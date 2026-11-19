import { Router, type Request } from 'express';
import { z, type ZodTypeAny } from 'zod';
import { reorderSchema, type Permission } from '@app/shared';
import { audit } from '../../lib/audit.js';
import { AppError, notFound } from '../../lib/errors.js';
import { asyncHandler, ok } from '../../lib/http.js';
import { prisma } from '../../lib/prisma.js';
import { requirePermission } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';

/** The subset of a Prisma model delegate the factory needs (kept loose: every model shares these). */
export interface Delegate {
  findMany(args: unknown): Promise<unknown[]>;
  count(args: unknown): Promise<number>;
  findUnique(args: unknown): Promise<unknown>;
  create(args: unknown): Promise<{ id: string }>;
  update(args: unknown): Promise<unknown>;
  delete(args: unknown): Promise<unknown>;
}

export interface CrudConfig<S extends ZodTypeAny> {
  /** Audit/SEO entity name, e.g. "service". */
  entity: string;
  delegate: Delegate;
  schema: S;
  write?: Permission;
  /** Plain string columns to search with `?q=` (Json content is searched as text where supported). */
  search?: string[];
  orderBy?: unknown;
  include?: unknown;
  /** Map validated input to Prisma `data` (e.g. nested relations). */
  toData?: (input: z.infer<S>, id?: string) => unknown | Promise<unknown>;
  /** Has an `order` column → enables PATCH /reorder. */
  orderable?: boolean;
  /** Called after create/update/delete (cache invalidation etc.). */
  after?: (req: Request, id: string) => void | Promise<void>;
}

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
  q: z.string().max(100).optional(),
});

/** Unique-constraint violations become a readable 409 instead of a 500. */
function mapPrismaError(err: unknown): never {
  const code = (err as { code?: string }).code;
  if (code === 'P2002') throw new AppError(409, 'CONFLICT', 'That slug or value is already used by another item');
  if (code === 'P2025') throw notFound();
  if (code === 'P2003') throw new AppError(409, 'CONFLICT', 'This item is still used elsewhere and cannot be removed');
  throw err;
}

/**
 * Standard admin REST resource: list (search + pagination), get, create, update, delete, reorder.
 * Reads need `content:read`; writes need `write` (default `content:write`). Every write is audited.
 */
export function crudRouter<S extends ZodTypeAny>(cfg: CrudConfig<S>): Router {
  const r = Router();
  const write = requirePermission(cfg.write ?? 'content:write');
  const toData = cfg.toData ?? ((v: z.infer<S>) => v);

  r.get(
    '/',
    requirePermission('content:read'),
    validate(listQuery, 'query'),
    asyncHandler(async (req, res) => {
      const { page, pageSize, q } = req.query as unknown as z.infer<typeof listQuery>;
      const where = q && cfg.search?.length ? { OR: cfg.search.map((f) => ({ [f]: { contains: q } })) } : {};
      const [total, items] = await Promise.all([
        cfg.delegate.count({ where }),
        cfg.delegate.findMany({ where, orderBy: cfg.orderBy, include: cfg.include, skip: (page - 1) * pageSize, take: pageSize }),
      ]);
      return ok(res, items, { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
    }),
  );

  r.get(
    '/:id',
    requirePermission('content:read'),
    asyncHandler(async (req, res) => {
      const item = await cfg.delegate.findUnique({ where: { id: req.params.id }, include: cfg.include });
      if (!item) throw notFound();
      return ok(res, item);
    }),
  );

  r.post(
    '/',
    write,
    validate(cfg.schema),
    asyncHandler(async (req, res) => {
      const data = await toData(req.body as z.infer<S>);
      const created = await cfg.delegate.create({ data }).catch(mapPrismaError);
      await audit(req, 'create', cfg.entity, created.id);
      await cfg.after?.(req, created.id);
      return ok(res, created, undefined, 201);
    }),
  );

  r.put(
    '/:id',
    write,
    validate(cfg.schema),
    asyncHandler(async (req, res) => {
      const id = String(req.params.id);
      const before = await cfg.delegate.findUnique({ where: { id } });
      if (!before) throw notFound();
      const data = await toData(req.body as z.infer<S>, id);
      const updated = await cfg.delegate.update({ where: { id }, data }).catch(mapPrismaError);
      await audit(req, 'update', cfg.entity, id, { before, after: req.body as unknown });
      await cfg.after?.(req, id);
      return ok(res, updated);
    }),
  );

  r.delete(
    '/:id',
    write,
    asyncHandler(async (req, res) => {
      const id = String(req.params.id);
      await cfg.delegate.delete({ where: { id } }).catch(mapPrismaError);
      await prisma.seoMeta.deleteMany({ where: { entityType: cfg.entity, entityId: id } });
      await audit(req, 'delete', cfg.entity, id);
      await cfg.after?.(req, id);
      return ok(res, { deleted: true });
    }),
  );

  if (cfg.orderable) {
    r.patch(
      '/reorder',
      write,
      validate(reorderSchema),
      asyncHandler(async (req, res) => {
        const { ids } = req.body as z.infer<typeof reorderSchema>;
        await prisma.$transaction(ids.map((id, i) => cfg.delegate.update({ where: { id }, data: { order: i } }) as never));
        await audit(req, 'reorder', cfg.entity, '', { ids });
        return ok(res, { reordered: ids.length });
      }),
    );
  }
  return r;
}
