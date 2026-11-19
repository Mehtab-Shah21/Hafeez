import type { Request } from 'express';
import type { Prisma } from '@prisma/client';
import { logger } from './logger.js';
import { prisma } from './prisma.js';

/** Writes one audit row. Never throws: auditing must not break the action it records. */
export async function audit(req: Request, action: string, entityType: string, entityId = '', diff?: unknown) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id ?? null,
        action,
        entityType,
        entityId,
        diff: diff === undefined ? undefined : (diff as Prisma.InputJsonValue),
        ip: (req.ip ?? '').slice(0, 64),
      },
    });
  } catch (err) {
    logger.warn({ err, action, entityType }, 'audit write failed');
  }
}
