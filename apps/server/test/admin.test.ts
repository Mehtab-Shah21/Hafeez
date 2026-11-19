import bcrypt from 'bcryptjs';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

// Test-only accounts in the throwaway test database.
const PASSWORD = 'admin-test-password-123';
const users = { admin: 'a6@test.local', editor: 'e6@test.local', seo: 's6@test.local' } as const;

beforeAll(async () => {
  const hash = await bcrypt.hash(PASSWORD, 4);
  const role = async (key: string) => (await prisma.role.findUniqueOrThrow({ where: { key } })).id;
  for (const [k, email] of Object.entries(users)) {
    const key = k === 'admin' ? 'SUPER_ADMIN' : k === 'editor' ? 'EDITOR' : 'SEO_MANAGER';
    await prisma.user.upsert({ where: { email }, update: {}, create: { email, name: k, passwordHash: hash, roleId: await role(key) } });
  }
});

async function login(email: string) {
  const app = createApp({ auth: { loginMax: 100 } });
  const agent = request.agent(app);
  const csrf = (await agent.get('/api/admin/auth/csrf')).body.data.token as string;
  const res = await agent.post('/api/admin/auth/login').set('x-csrf-token', csrf).send({ email, password: PASSWORD });
  return { agent, csrf: res.body.data.csrfToken as string };
}

const service = (slug: string) => {
  const c = { title: 'Crane hire', excerpt: 'x', overview: 'Crane hire in Dubai.', features: [], useCases: [], faqs: [] };
  return { slug, content: { en: c, ar: c } };
};

describe('admin content CRUD + RBAC', () => {
  it('editor creates, updates, lists and deletes a service, and it is audited', async () => {
    const { agent, csrf } = await login(users.editor);
    const created = await agent.post('/api/admin/services').set('x-csrf-token', csrf).send(service('test-crane-hire'));
    expect(created.status).toBe(201);
    const id = created.body.data.id as string;
    const dup = await agent.post('/api/admin/services').set('x-csrf-token', csrf).send(service('test-crane-hire'));
    expect(dup.status).toBe(409);
    const upd = await agent.put(`/api/admin/services/${id}`).set('x-csrf-token', csrf).send({ ...service('test-crane-hire'), featured: true });
    expect(upd.body.data.featured).toBe(true);
    const list = await agent.get('/api/admin/services?q=test-crane');
    expect(list.body.data.some((s: { id: string }) => s.id === id)).toBe(true);
    expect((await agent.delete(`/api/admin/services/${id}`).set('x-csrf-token', csrf)).status).toBe(200);
    expect(await prisma.auditLog.count({ where: { entityType: 'service', entityId: id } })).toBeGreaterThanOrEqual(3);
  });

  it('rejects invalid slugs with 400', async () => {
    const { agent, csrf } = await login(users.editor);
    const res = await agent.post('/api/admin/services').set('x-csrf-token', csrf).send(service('Not A Slug!'));
    expect(res.status).toBe(400);
  });

  it('SEO manager can read content but not write it; editor cannot manage users or SEO settings', async () => {
    const seo = await login(users.seo);
    expect((await seo.agent.get('/api/admin/services')).status).toBe(200);
    expect((await seo.agent.post('/api/admin/services').set('x-csrf-token', seo.csrf).send(service('nope-seo'))).status).toBe(403);
    const ed = await login(users.editor);
    expect((await ed.agent.get('/api/admin/users')).status).toBe(403);
    expect((await ed.agent.put('/api/admin/settings/robots').set('x-csrf-token', ed.csrf).send({ content: 'User-agent: *' })).status).toBe(403);
  });

  it('validates settings against their schema', async () => {
    const { agent, csrf } = await login(users.admin);
    const bad = await agent.put('/api/admin/settings/theme').set('x-csrf-token', csrf).send({ navy: 'blue' });
    expect(bad.status).toBe(400);
    const good = await agent.put('/api/admin/settings/theme').set('x-csrf-token', csrf).send({ navy: '#0B1B3A', yellow: '#FFC62B', blue: '#2F63FF', offwhite: '#F4F7FB', ink: '#0A0B0C' });
    expect(good.status).toBe(200);
  });

  it('section edits stay in draft until published', async () => {
    const { agent, csrf } = await login(users.editor);
    const s = await prisma.section.findFirstOrThrow({ where: { type: 'stats' } });
    const draft = { en: { items: [] }, ar: { items: [] } };
    await agent.put(`/api/admin/sections/${s.id}`).set('x-csrf-token', csrf).send({ type: 'stats', order: 0, isVisible: true, draftContent: draft });
    const mid = await prisma.section.findUniqueOrThrow({ where: { id: s.id } });
    expect(mid.content).toEqual(s.content); // live content unchanged
    await agent.post(`/api/admin/sections/${s.id}/publish`).set('x-csrf-token', csrf);
    const after = await prisma.section.findUniqueOrThrow({ where: { id: s.id } });
    expect(after.content).toEqual(draft);
  });
});

describe('SEO manager', () => {
  it('scores meta and stores it per locale', async () => {
    const { agent, csrf } = await login(users.seo);
    const get = await agent.get('/api/admin/seo/meta/page/home/en');
    expect(get.status).toBe(200);
    expect(get.body.data.checks.length).toBeGreaterThan(10);
    const put = await agent.put('/api/admin/seo/meta/page/home/en').set('x-csrf-token', csrf).send({
      title: 'Crane Rental Dubai | Heavy Equipment, Logistics & Courier',
      description: 'Crane rental Dubai and across the UAE: mobile cranes, forklifts, lowbed transport and same-day courier. Certified operators, fast quotes, all seven emirates.',
      focusKeyword: 'crane rental Dubai',
    });
    expect(put.status).toBe(200);
    expect(put.body.data.score).toBeGreaterThan(50);
    const bulk = await agent.get('/api/admin/seo/entities');
    expect(bulk.body.data.length).toBeGreaterThan(40);
  });

  it('redirects created in the admin apply to page requests', async () => {
    const { agent, csrf } = await login(users.seo);
    const r = await agent.post('/api/admin/redirects').set('x-csrf-token', csrf).send({ from: '/old-cranes', to: '/en/equipment?category=cranes', code: 301 });
    expect(r.status).toBe(201);
    const res = await request(createApp()).get('/old-cranes');
    expect(res.status).toBe(301);
    expect(res.headers.location).toBe('/en/equipment?category=cranes');
  });
});

describe('inquiries inbox', () => {
  it('updates status, appends notes and exports CSV safely', async () => {
    await prisma.inquiry.create({ data: { type: 'quote', name: '=HYPERLINK("x")', phone: '+971 50 000 0000', email: 'csv@example.com', payload: {}, notes: [] } });
    const { agent, csrf } = await login(users.editor);
    const list = await agent.get('/api/admin/inquiries?status=NEW&q=csv@example.com');
    const id = list.body.data[0].id as string;
    const upd = await agent.patch(`/api/admin/inquiries/${id}`).set('x-csrf-token', csrf).send({ status: 'CONTACTED', note: 'Called back' });
    expect(upd.body.data.status).toBe('CONTACTED');
    expect(upd.body.data.notes).toHaveLength(1);
    const csv = await agent.get('/api/admin/inquiries/export.csv?q=csv@example.com');
    expect(csv.headers['content-type']).toContain('text/csv');
    expect(csv.text).toContain(`"'=HYPERLINK`); // formula neutralised
  });
});

describe('users', () => {
  it('super admin creates a user; nobody can demote themselves', async () => {
    const { agent, csrf } = await login(users.admin);
    const created = await agent.post('/api/admin/users').set('x-csrf-token', csrf).send({ email: 'new6@test.local', name: 'New', role: 'EDITOR', password: 'a-strong-password-1' });
    expect(created.status).toBe(201);
    const me = await prisma.user.findUniqueOrThrow({ where: { email: users.admin } });
    const demote = await agent.put(`/api/admin/users/${me.id}`).set('x-csrf-token', csrf).send({ role: 'EDITOR' });
    expect(demote.status).toBe(400);
  });
});
