import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { adminMediaUpdateSchema } from '@app/shared';
import { audit } from '../../lib/audit.js';
import { AppError, notFound } from '../../lib/errors.js';
import { asyncHandler, ok } from '../../lib/http.js';
import { prisma } from '../../lib/prisma.js';
import { storage, storageKey } from '../../lib/storage.js';
import { requirePermission } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';

const WIDTHS = [480, 960, 1600];
// Raster only: SVG can carry script, so it is not accepted from uploads.
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

export interface Credit {
  author: string;
  licence: string;
  licenceUrl: string;
  sourceUrl: string;
}

/**
 * Compresses one image into WebP + AVIF at several widths (never upscaled), strips metadata,
 * stores the files and creates the Media row. Shared by the upload API and the photo import script.
 */
export async function processImage(
  input: Buffer,
  originalName: string,
  alt: { en: string; ar: string },
  opts: { folder?: string; uploadedById?: string | null; credit?: Credit | null; source?: 'upload' | 'stand-in' } = {},
) {
  const img = sharp(input, { failOn: 'error' }).rotate(); // apply EXIF orientation, then drop metadata
  const meta = await img.metadata();
  if (!meta.width || !meta.height) throw new AppError(400, 'VALIDATION_ERROR', 'Not a readable image');
  const store = storage();
  const widths = [...new Set([...WIDTHS.filter((w) => w < meta.width!), Math.min(meta.width, 2400)])].sort((a, b) => a - b);
  const variants: { webp: { w: number; url: string }[]; avif: { w: number; url: string }[]; original: string } = { webp: [], avif: [], original: '' };
  const keys: string[] = [];
  for (const w of widths) {
    const resized = img.clone().resize({ width: w, withoutEnlargement: true });
    const [webp, avif] = await Promise.all([resized.clone().webp({ quality: 78 }).toBuffer(), resized.clone().avif({ quality: 55 }).toBuffer()]);
    const kw = storageKey(opts.folder ?? 'media', `${originalName}-${w}`, 'webp');
    const ka = kw.replace(/\.webp$/, '.avif');
    variants.webp.push({ w, url: await store.put(kw, webp, 'image/webp') });
    variants.avif.push({ w, url: await store.put(ka, avif, 'image/avif') });
    keys.push(kw, ka);
  }
  variants.original = variants.webp.at(-1)!.url;
  const largest = widths.at(-1)!;
  return prisma.media.create({
    data: {
      filename: originalName.slice(0, 200),
      mime: 'image/webp',
      width: largest,
      height: Math.round((meta.height / meta.width) * largest),
      sizeBytes: input.length,
      variants: { ...variants, keys } as Prisma.InputJsonValue,
      alt,
      folder: opts.folder ?? '',
      source: opts.source ?? 'upload',
      credit: (opts.credit ?? undefined) as Prisma.InputJsonValue | undefined,
      uploadedById: opts.uploadedById ?? null,
    },
  });
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => cb(null, IMAGE_TYPES.has(file.mimetype)),
});

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(48),
  q: z.string().max(100).optional(),
});

export function mediaRouter(): Router {
  const r = Router();
  r.get(
    '/',
    requirePermission('content:read'),
    validate(listQuery, 'query'),
    asyncHandler(async (req, res) => {
      const { page, pageSize, q } = req.query as unknown as z.infer<typeof listQuery>;
      const where = q ? { filename: { contains: q } } : {};
      const [total, items] = await Promise.all([
        prisma.media.count({ where }),
        prisma.media.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      ]);
      return ok(res, items, { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) });
    }),
  );

  // multipart: files[] + alt_en + alt_ar (required, applied to every file in the batch)
  r.post(
    '/',
    requirePermission('media:write'),
    upload.array('files', 10),
    asyncHandler(async (req, res) => {
      const files = (req.files as Express.Multer.File[] | undefined) ?? [];
      if (!files.length) throw new AppError(400, 'VALIDATION_ERROR', 'Choose at least one JPG, PNG, WebP or AVIF image');
      const body = req.body as { alt_en?: string; alt_ar?: string; folder?: string };
      const alt = adminMediaUpdateSchema.shape.alt.parse({ en: body.alt_en ?? '', ar: body.alt_ar ?? '' });
      const created = [];
      for (const f of files) {
        const m = await processImage(f.buffer, f.originalname, alt, { folder: body.folder || 'media', uploadedById: req.user?.id ?? null });
        await audit(req, 'upload', 'media', m.id);
        created.push(m);
      }
      return ok(res, created, undefined, 201);
    }),
  );

  r.put(
    '/:id',
    requirePermission('media:write'),
    validate(adminMediaUpdateSchema),
    asyncHandler(async (req, res) => {
      const id = String(req.params.id);
      const body = req.body as z.infer<typeof adminMediaUpdateSchema>;
      const m = await prisma.media.update({ where: { id }, data: { alt: body.alt, ...(body.folder !== undefined ? { folder: body.folder } : {}) } }).catch(() => {
        throw notFound();
      });
      await audit(req, 'update', 'media', id);
      return ok(res, m);
    }),
  );

  r.delete(
    '/:id',
    requirePermission('media:write'),
    asyncHandler(async (req, res) => {
      const id = String(req.params.id);
      const m = await prisma.media.findUnique({ where: { id } });
      if (!m) throw notFound();
      await prisma.media.delete({ where: { id } }).catch(() => {
        throw new AppError(409, 'CONFLICT', 'This image is still used by equipment, services or other content');
      });
      const keys = ((m.variants as { keys?: string[] }).keys ?? []) as string[];
      await Promise.all(keys.map((k) => storage().remove(k)));
      await audit(req, 'delete', 'media', id);
      return ok(res, { deleted: true });
    }),
  );
  return r;
}
