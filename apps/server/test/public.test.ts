import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

const app = createApp({ public: { inquiryMax: 50, inquiryWindowMs: 60_000 } });

const validInquiry = {
  type: 'quote',
  name: 'Test Person',
  phone: '+971 50 123 4567',
  email: 'test@example.com',
  message: 'Need a 50 t crane in Dubai next week',
};

describe('public read API', () => {
  it('returns localized settings with the envelope', async () => {
    const en = await request(app).get('/api/public/settings?lang=en');
    const ar = await request(app).get('/api/public/settings?lang=ar');
    expect(en.status).toBe(200);
    expect(en.body.ok).toBe(true);
    expect(en.body.data.navbar.items[0].label).toBe('Services');
    expect(ar.body.data.navbar.items[0].label).toBe('الخدمات');
    // Admin-only analytics fields never leak.
    expect(en.body.data.analytics).not.toHaveProperty('customHead');
  });

  it('sends ETag and cache headers, and answers 304 on revalidation', async () => {
    const first = await request(app).get('/api/public/services?lang=en');
    expect(first.headers['cache-control']).toContain('max-age=60');
    const etag = first.headers.etag as string;
    expect(etag).toBeTruthy();
    const second = await request(app).get('/api/public/services?lang=en').set('If-None-Match', etag);
    expect(second.status).toBe(304);
  });

  it('lists 6 services and 404s an unknown slug', async () => {
    const list = await request(app).get('/api/public/services');
    expect(list.body.data).toHaveLength(6);
    const missing = await request(app).get('/api/public/services/nope');
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe('NOT_FOUND');
  });

  it('filters and paginates equipment', async () => {
    const cranes = await request(app).get('/api/public/equipment?category=cranes');
    expect(cranes.body.data.every((e: { category: { slug: string } }) => e.category.slug === 'cranes')).toBe(true);
    const heavy = await request(app).get('/api/public/equipment?capacityMin=100&capacityUnit=t');
    expect(heavy.body.data.every((e: { capacityValue: number }) => e.capacityValue >= 100)).toBe(true);
    const paged = await request(app).get('/api/public/equipment?pageSize=5&page=2');
    expect(paged.body.meta).toMatchObject({ page: 2, pageSize: 5 });
    expect(paged.body.data).toHaveLength(5);
    const bad = await request(app).get('/api/public/equipment?operator=maybe');
    expect(bad.status).toBe(400);
  });

  it('returns page content with SEO', async () => {
    const res = await request(app).get('/api/public/pages/home?lang=en');
    expect(res.body.data.seo.title).toContain('Crane Rental Dubai');
    expect(res.body.data.sections.length).toBeGreaterThan(0);
  });

  it('serves the tracking stub flagged as demo, and validates ids', async () => {
    const ok = await request(app).get('/api/public/track/AB12-3456');
    expect(ok.body.data.isDemo).toBe(true);
    const bad = await request(app).get('/api/public/track/%3Cscript%3E');
    expect(bad.status).toBe(400);
  });

  it('documents the API', async () => {
    const res = await request(app).get('/api/docs.json');
    expect(res.body.paths).toHaveProperty('/api/public/inquiries');
  });
});

describe('inquiries', () => {
  it('stores a valid inquiry', async () => {
    const res = await request(app).post('/api/public/inquiries').send(validInquiry);
    expect(res.status).toBe(201);
    expect(res.body.data.reference).toHaveLength(8);
    expect(await prisma.inquiry.count({ where: { email: 'test@example.com' } })).toBeGreaterThan(0);
  });

  it('accepts multipart with a PDF attachment and stores it privately', async () => {
    const res = await request(app)
      .post('/api/public/inquiries')
      .field('type', 'contact')
      .field('name', 'File Person')
      .field('phone', '+971 4 123 4567')
      .field('email', 'file@example.com')
      .field('booking', JSON.stringify({ pickup: 'Jebel Ali', weightKg: 1200 }))
      .attach('file', Buffer.from('%PDF-1.4 test'), { filename: 'plan.pdf', contentType: 'application/pdf' });
    expect(res.status).toBe(201);
    const row = await prisma.inquiry.findFirst({ where: { email: 'file@example.com' } });
    expect(row?.attachmentId).toMatch(/.pdf$/);
    expect(row?.payload).toMatchObject({ pickup: 'Jebel Ali', weightKg: 1200 });
    // Attachments are never publicly served.
    const pub = await request(app).get('/uploads/' + row?.attachmentId);
    expect(pub.status).toBe(404);
  });

  it('strips HTML from text fields', async () => {
    await request(app).post('/api/public/inquiries').send({ ...validInquiry, email: 'xss@example.com', name: '<b>Bold</b> Name', message: '<script>alert(1)</script>Hi' });
    const row = await prisma.inquiry.findFirst({ where: { email: 'xss@example.com' } });
    expect(row?.name).toBe('Bold Name');
    expect(row?.message).toBe('Hi');
  });

  it('rejects a non-UAE phone number', async () => {
    const res = await request(app).post('/api/public/inquiries').send({ ...validInquiry, phone: '+1 555 0100' });
    expect(res.status).toBe(400);
  });

  it('silently drops honeypot submissions', async () => {
    const before = await prisma.inquiry.count();
    const res = await request(app).post('/api/public/inquiries').send({ ...validInquiry, website: 'http://spam' });
    expect(res.status).toBe(201);
    expect(await prisma.inquiry.count()).toBe(before);
  });

  it('rate limits per IP', async () => {
    const limited = createApp({ public: { inquiryMax: 2, inquiryWindowMs: 60_000 } });
    await request(limited).post('/api/public/inquiries').send(validInquiry);
    await request(limited).post('/api/public/inquiries').send(validInquiry);
    const blocked = await request(limited).post('/api/public/inquiries').send(validInquiry);
    expect(blocked.status).toBe(429);
  });
});
