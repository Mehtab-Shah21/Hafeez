import { createHash, createHmac, randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Storage adapter. `local` writes under <repo>/uploads (served at /uploads) for development and
 * single-server deployments; `s3` and `cloudinary` are for production. Keys look like
 * "media/2026/11/uuid-name.webp"; `put` returns the public URL.
 */
export interface Storage {
  put(key: string, body: Buffer, contentType: string): Promise<string>;
  remove(key: string): Promise<void>;
}

export const uploadsDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../uploads');
/** Never served publicly: inquiry attachments (downloaded through the authenticated admin API). */
export const privateUploadsDir = resolve(uploadsDir, '../uploads-private');

const local: Storage = {
  async put(key, body) {
    const file = resolve(uploadsDir, key);
    if (!file.startsWith(uploadsDir)) throw new Error('Invalid storage key');
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, body);
    return `/uploads/${key}`;
  },
  async remove(key) {
    const file = resolve(uploadsDir, key);
    if (!file.startsWith(uploadsDir)) return;
    await unlink(file).catch(() => undefined);
  },
};

/** S3 (or any S3-compatible store such as Cloudflare R2) via a SigV4-signed PUT, no SDK needed. */
function s3(): Storage {
  const bucket = process.env.S3_BUCKET ?? '';
  const region = process.env.S3_REGION ?? 'me-central-1';
  const keyId = process.env.S3_ACCESS_KEY_ID ?? '';
  const secret = process.env.S3_SECRET_ACCESS_KEY ?? '';
  const publicUrl = (process.env.S3_PUBLIC_URL ?? `https://${bucket}.s3.${region}.amazonaws.com`).replace(/\/$/, '');
  if (!bucket || !keyId || !secret) throw new Error('S3 storage selected but S3_BUCKET / S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY are missing');
  const host = `${bucket}.s3.${region}.amazonaws.com`;
  const hmac = (k: Buffer | string, d: string) => createHmac('sha256', k).update(d).digest();
  const sha = (d: Buffer | string) => createHash('sha256').update(d).digest('hex');

  async function signed(method: 'PUT' | 'DELETE', key: string, body: Buffer, contentType: string) {
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const day = amzDate.slice(0, 8);
    const path = '/' + key.split('/').map(encodeURIComponent).join('/');
    const payloadHash = sha(body);
    const headers: Record<string, string> = { host, 'x-amz-content-sha256': payloadHash, 'x-amz-date': amzDate };
    if (method === 'PUT') headers['content-type'] = contentType;
    const names = Object.keys(headers).sort();
    const canonical = [method, path, '', ...names.map((n) => `${n}:${headers[n]}`), '', names.join(';'), payloadHash].join('\n');
    const scope = `${day}/${region}/s3/aws4_request`;
    const toSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha(canonical)].join('\n');
    const kSigning = hmac(hmac(hmac(hmac(`AWS4${secret}`, day), region), 's3'), 'aws4_request');
    const signature = createHmac('sha256', kSigning).update(toSign).digest('hex');
    const res = await fetch(`https://${host}${path}`, {
      method,
      headers: { ...headers, authorization: `AWS4-HMAC-SHA256 Credential=${keyId}/${scope}, SignedHeaders=${names.join(';')}, Signature=${signature}` },
      body: method === 'PUT' ? body : undefined,
    });
    if (!res.ok) throw new Error(`S3 ${method} failed: ${res.status}`);
  }

  return {
    async put(key, body, contentType) {
      await signed('PUT', key, body, contentType);
      return `${publicUrl}/${key}`;
    },
    async remove(key) {
      await signed('DELETE', key, Buffer.alloc(0), '');
    },
  };
}

/** Cloudinary signed upload via its REST API (raw files keep their bytes; we upload pre-optimised images). */
function cloudinary(): Storage {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME ?? '';
  const apiKey = process.env.CLOUDINARY_API_KEY ?? '';
  const apiSecret = process.env.CLOUDINARY_API_SECRET ?? '';
  if (!cloud || !apiKey || !apiSecret) throw new Error('Cloudinary storage selected but CLOUDINARY_* variables are missing');
  const sign = (params: Record<string, string>) =>
    createHash('sha1')
      .update(Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join('&') + apiSecret)
      .digest('hex');
  return {
    async put(key, body, contentType) {
      const publicId = key.replace(/\.[a-z0-9]+$/i, '');
      const timestamp = String(Math.floor(Date.now() / 1000));
      const form = new FormData();
      form.set('file', new Blob([body], { type: contentType }), key.split('/').pop());
      form.set('public_id', publicId);
      form.set('timestamp', timestamp);
      form.set('api_key', apiKey);
      form.set('signature', sign({ public_id: publicId, timestamp }));
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/raw/upload`, { method: 'POST', body: form });
      if (!res.ok) throw new Error(`Cloudinary upload failed: ${res.status}`);
      return ((await res.json()) as { secure_url: string }).secure_url;
    },
    async remove(key) {
      const publicId = key.replace(/\.[a-z0-9]+$/i, '');
      const timestamp = String(Math.floor(Date.now() / 1000));
      const form = new FormData();
      form.set('public_id', publicId);
      form.set('timestamp', timestamp);
      form.set('api_key', apiKey);
      form.set('signature', sign({ public_id: publicId, timestamp }));
      await fetch(`https://api.cloudinary.com/v1_1/${cloud}/raw/destroy`, { method: 'POST', body: form });
    },
  };
}

let instance: Storage | null = null;
export function storage(): Storage {
  if (instance) return instance;
  const driver = process.env.STORAGE_DRIVER ?? 'local';
  instance = driver === 's3' ? s3() : driver === 'cloudinary' ? cloudinary() : local;
  return instance;
}

/** "media/2026/11/<uuid>-<safe-name>.<ext>" */
export function storageKey(folder: string, originalName: string, ext: string): string {
  const now = new Date();
  const base = originalName.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'file';
  return `${folder}/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${randomUUID().slice(0, 8)}-${base}.${ext}`;
}
