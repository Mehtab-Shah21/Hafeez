import bcrypt from 'bcryptjs';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { ROLE_PERMISSIONS, ROLES } from '@app/shared';
import { createApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

// Test-only credentials, created in the throwaway test database.
const PASSWORD = 'correct-horse-battery-staple';
const ADMIN = 'admin@test.local';
const EDITOR = 'editor@test.local';

beforeAll(async () => {
  for (const key of ROLES) {
    await prisma.role.upsert({
      where: { key },
      update: {},
      create: { key, name: key, permissions: [...ROLE_PERMISSIONS[key]] },
    });
  }
  const hash = await bcrypt.hash(PASSWORD, 4);
  const role = async (key: string) => (await prisma.role.findUniqueOrThrow({ where: { key } })).id;
  await prisma.user.upsert({ where: { email: ADMIN }, update: {}, create: { email: ADMIN, name: 'Admin', passwordHash: hash, roleId: await role('SUPER_ADMIN') } });
  await prisma.user.upsert({ where: { email: EDITOR }, update: {}, create: { email: EDITOR, name: 'Editor', passwordHash: hash, roleId: await role('EDITOR') } });
});

/** A cookie-keeping client that fetches a CSRF token and sends it on writes, like the admin app will. */
async function client(app = createApp()) {
  const agent = request.agent(app);
  const res = await agent.get('/api/admin/auth/csrf');
  const token = (res.body as { data: { token: string } }).data.token;
  return { agent, token };
}

const getCookie = (res: request.Response, name: string): string | undefined => {
  const raw = res.headers['set-cookie'] as unknown as string[] | undefined;
  return raw?.find((c) => c.startsWith(`${name}=`))?.split(';')[0]?.slice(name.length + 1);
};

describe('auth', () => {
  it('logs in with valid credentials and sets httpOnly cookies', async () => {
    const { agent, token } = await client();
    const res = await agent.post('/api/admin/auth/login').set('x-csrf-token', token).send({ email: ADMIN, password: PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.data.user).toMatchObject({ email: ADMIN, role: 'SUPER_ADMIN' });
    const cookies = (res.headers['set-cookie'] as unknown as string[]).join('\n');
    expect(cookies).toMatch(/access=.*HttpOnly/);
    expect(cookies).toMatch(/refresh=.*Path=\/api\/admin\/auth.*HttpOnly/);
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });

  it('rejects a wrong password with a generic 401', async () => {
    const { agent, token } = await client();
    const res = await agent.post('/api/admin/auth/login').set('x-csrf-token', token).send({ email: ADMIN, password: 'nope' });
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Email or password is incorrect');
  });

  it('rejects an unknown email with the same message', async () => {
    const { agent, token } = await client();
    const res = await agent.post('/api/admin/auth/login').set('x-csrf-token', token).send({ email: 'ghost@test.local', password: PASSWORD });
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Email or password is incorrect');
  });

  it('returns 400 for an invalid body', async () => {
    const { agent, token } = await client();
    const res = await agent.post('/api/admin/auth/login').set('x-csrf-token', token).send({ email: 'not-an-email' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('/me needs a session', async () => {
    const anon = await request(createApp()).get('/api/admin/auth/me');
    expect(anon.status).toBe(401);

    const { agent, token } = await client();
    await agent.post('/api/admin/auth/login').set('x-csrf-token', token).send({ email: ADMIN, password: PASSWORD });
    const me = await agent.get('/api/admin/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.data.user.email).toBe(ADMIN);
  });

  it('rotates the CSRF token on login', async () => {
    const { agent, token } = await client();
    const login = await agent.post('/api/admin/auth/login').set('x-csrf-token', token).send({ email: ADMIN, password: PASSWORD });
    const next = login.body.data.csrfToken as string;
    expect(next).toBeTruthy();
    expect(next).not.toBe(token);
    expect((await agent.post('/api/admin/auth/refresh').set('x-csrf-token', token)).status).toBe(403);
    expect((await agent.post('/api/admin/auth/refresh').set('x-csrf-token', next)).status).toBe(200);
  });

  it('rotates the refresh token, and reusing an old one revokes the whole family', async () => {
    const app = createApp();
    const c = await client(app);
    const agent = c.agent;
    const login = await agent.post('/api/admin/auth/login').set('x-csrf-token', c.token).send({ email: ADMIN, password: PASSWORD });
    const token = login.body.data.csrfToken as string;
    const first = getCookie(login, 'refresh');
    expect(first).toBeTruthy();

    const r1 = await agent.post('/api/admin/auth/refresh').set('x-csrf-token', token);
    expect(r1.status).toBe(200);
    const second = getCookie(r1, 'refresh');
    expect(second).toBeTruthy();
    expect(second).not.toBe(first);

    // An attacker replays the first (already rotated) token.
    const replay = await request(app)
      .post('/api/admin/auth/refresh')
      .set('Cookie', [`refresh=${first}`, `csrf=${token}`])
      .set('x-csrf-token', token);
    expect(replay.status).toBe(401);

    // The legitimate session's current token is now revoked too.
    const after = await request(app)
      .post('/api/admin/auth/refresh')
      .set('Cookie', [`refresh=${second}`, `csrf=${token}`])
      .set('x-csrf-token', token);
    expect(after.status).toBe(401);
  });

  it('logout revokes the refresh token', async () => {
    const app = createApp();
    const c = await client(app);
    const agent = c.agent;
    const login = await agent.post('/api/admin/auth/login').set('x-csrf-token', c.token).send({ email: ADMIN, password: PASSWORD });
    const token = login.body.data.csrfToken as string;
    const refresh = getCookie(login, 'refresh');
    expect((await agent.post('/api/admin/auth/logout').set('x-csrf-token', token)).status).toBe(200);
    const res = await request(app)
      .post('/api/admin/auth/refresh')
      .set('Cookie', [`refresh=${refresh}`, `csrf=${token}`])
      .set('x-csrf-token', token);
    expect(res.status).toBe(401);
  });
});

describe('csrf', () => {
  it('blocks writes without the header', async () => {
    const { agent } = await client();
    const res = await agent.post('/api/admin/auth/login').send({ email: ADMIN, password: PASSWORD });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('CSRF_INVALID');
  });

  it('blocks a forged token that matches the cookie but has a bad signature', async () => {
    const forged = 'abc.def';
    const res = await request(createApp())
      .post('/api/admin/auth/login')
      .set('Cookie', [`csrf=${forged}`])
      .set('x-csrf-token', forged)
      .send({ email: ADMIN, password: PASSWORD });
    expect(res.status).toBe(403);
  });
});

describe('rbac', () => {
  it('lets a super admin list users and forbids an editor', async () => {
    const admin = await client();
    await admin.agent.post('/api/admin/auth/login').set('x-csrf-token', admin.token).send({ email: ADMIN, password: PASSWORD });
    const ok = await admin.agent.get('/api/admin/users');
    expect(ok.status).toBe(200);
    expect(ok.body.data.length).toBeGreaterThanOrEqual(2);

    const editor = await client();
    await editor.agent.post('/api/admin/auth/login').set('x-csrf-token', editor.token).send({ email: EDITOR, password: PASSWORD });
    const denied = await editor.agent.get('/api/admin/users');
    expect(denied.status).toBe(403);
    expect(denied.body.error.code).toBe('FORBIDDEN');
  });

  it('blocks deactivated users immediately', async () => {
    const editor = await client();
    await editor.agent.post('/api/admin/auth/login').set('x-csrf-token', editor.token).send({ email: EDITOR, password: PASSWORD });
    await prisma.user.update({ where: { email: EDITOR }, data: { isActive: false } });
    const me = await editor.agent.get('/api/admin/auth/me');
    expect(me.status).toBe(401);
    await prisma.user.update({ where: { email: EDITOR }, data: { isActive: true } });
  });
});

describe('rate limit', () => {
  it('returns 429 after too many failed logins for one account', async () => {
    const app = createApp({ auth: { loginMax: 3, loginWindowMs: 60_000 } });
    const { agent, token } = await client(app);
    const attempt = () =>
      agent.post('/api/admin/auth/login').set('x-csrf-token', token).send({ email: ADMIN, password: 'wrong' });
    for (let i = 0; i < 3; i++) expect((await attempt()).status).toBe(401);
    const blocked = await attempt();
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe('RATE_LIMITED');
  });
});
