import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { isRole, type AuthUser, type LoginInput } from '@app/shared';
import { unauthorized } from '../../lib/errors.js';
import { prisma } from '../../lib/prisma.js';
import { hashToken, newRefreshToken, REFRESH_TTL_MS, signAccessToken } from './tokens.js';

// Compared against when the email is unknown, so response time does not reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('timing-equaliser-not-a-real-password', 12);
const INVALID = 'Email or password is incorrect';

interface Session {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

async function issueSession(user: AuthUser, familyId: string, userAgent: string): Promise<Session> {
  const refreshToken = newRefreshToken();
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      familyId,
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      userAgent: userAgent.slice(0, 300),
    },
  });
  return { user, accessToken: signAccessToken(user.id, user.role), refreshToken };
}

export async function login(input: LoginInput, userAgent: string, ip: string): Promise<Session> {
  const row = await prisma.user.findUnique({ where: { email: input.email }, include: { role: true } });
  const passwordOk = await bcrypt.compare(input.password, row?.passwordHash ?? DUMMY_HASH);
  if (!row || !passwordOk || !row.isActive || !isRole(row.role.key)) throw unauthorized(INVALID);

  await prisma.user.update({ where: { id: row.id }, data: { lastLoginAt: new Date() } });
  await prisma.auditLog.create({ data: { userId: row.id, action: 'login', entityType: 'user', entityId: row.id, ip } });

  const user: AuthUser = { id: row.id, email: row.email, name: row.name, role: row.role.key };
  return issueSession(user, randomUUID(), userAgent);
}

/**
 * Rotates the refresh token. Presenting a token that was already rotated means it was copied,
 * so the whole family (every session descended from that login) is revoked.
 */
export async function refresh(rawToken: string, userAgent: string): Promise<Session> {
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(rawToken) },
    include: { user: { include: { role: true } } },
  });
  if (!stored) throw unauthorized('Session expired');

  if (stored.revokedAt) {
    await prisma.refreshToken.updateMany({
      where: { familyId: stored.familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw unauthorized('Session expired');
  }
  const u = stored.user;
  if (stored.expiresAt < new Date() || !u.isActive || !isRole(u.role.key)) throw unauthorized('Session expired');

  // Conditional revoke: if two requests race with the same token, only one wins.
  const { count } = await prisma.refreshToken.updateMany({
    where: { id: stored.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (count === 0) throw unauthorized('Session expired');

  return issueSession({ id: u.id, email: u.email, name: u.name, role: u.role.key }, stored.familyId, userAgent);
}

export async function logout(rawToken: string | undefined): Promise<void> {
  if (!rawToken) return;
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash: hashToken(rawToken) } });
  if (!stored) return;
  await prisma.refreshToken.updateMany({
    where: { familyId: stored.familyId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
