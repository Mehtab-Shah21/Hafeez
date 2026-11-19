import type { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import { EMIRATE_KEYS, INQUIRY_TYPES } from '@app/shared';

const lang = { name: 'lang', in: 'query', schema: { type: 'string', enum: ['en', 'ar'], default: 'en' } };
const slug = { name: 'slug', in: 'path', required: true, schema: { type: 'string' } };
const envelope = (ref = 'object') => ({
  description: 'Success',
  content: { 'application/json': { schema: { type: 'object', properties: { ok: { const: true }, data: { type: ref } } } } },
});
const errors = {
  '404': { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
};
const getList = (summary: string, extra: object[] = []) => ({
  get: { tags: ['Public'], summary, parameters: [lang, ...extra], responses: { '200': envelope('array') } },
});
const getOne = (summary: string) => ({
  get: { tags: ['Public'], summary, parameters: [slug, lang], responses: { '200': envelope(), ...errors } },
});

/**
 * Hand-written OpenAPI 3.1 for the REST API. Request bodies mirror the Zod schemas in packages/shared;
 * admin CRUD endpoints are added here as each admin module lands (Step 6).
 */
export const openapi = {
  openapi: '3.1.0',
  info: {
    title: 'Website API',
    version: '0.2.0',
    description:
      'Public read API (localized with `?lang=en|ar`) and admin API (cookie session + `x-csrf-token` header on writes). Responses use the envelope `{ ok, data, meta? }` or `{ ok: false, error: { code, message, details? } }`.',
  },
  servers: [{ url: '/' }],
  tags: [{ name: 'Public' }, { name: 'Auth' }, { name: 'Admin' }],
  components: {
    schemas: {
      Error: {
        type: 'object',
        properties: {
          ok: { const: false },
          error: { type: 'object', properties: { code: { type: 'string' }, message: { type: 'string' }, details: {} } },
        },
      },
      InquiryCreate: {
        type: 'object',
        required: ['type', 'name', 'phone', 'email'],
        properties: {
          type: { type: 'string', enum: INQUIRY_TYPES },
          name: { type: 'string', minLength: 2, maxLength: 120 },
          company: { type: 'string' },
          phone: { type: 'string', example: '+971 50 123 4567', description: 'UAE number starting with +971' },
          email: { type: 'string', format: 'email' },
          serviceType: { type: 'string' },
          equipmentSlug: { type: 'string' },
          message: { type: 'string', maxLength: 5000 },
          locale: { type: 'string', enum: ['en', 'ar'] },
          booking: {
            type: 'object',
            properties: {
              pickup: { type: 'string' },
              pickupEmirate: { type: 'string', enum: EMIRATE_KEYS },
              dropoff: { type: 'string' },
              dropoffEmirate: { type: 'string', enum: EMIRATE_KEYS },
              cargoType: { type: 'string' },
              weightKg: { type: 'number' },
              date: { type: 'string' },
            },
          },
          website: { type: 'string', description: 'Honeypot. Must be empty.' },
        },
      },
    },
    securitySchemes: {
      cookie: { type: 'apiKey', in: 'cookie', name: 'access' },
      csrf: { type: 'apiKey', in: 'header', name: 'x-csrf-token' },
    },
  },
  paths: {
    '/api/public/settings': { get: { tags: ['Public'], summary: 'Company info, theme, navigation, hero and global SEO', parameters: [lang], responses: { '200': envelope() } } },
    '/api/public/pages/{slug}': { get: { tags: ['Public'], summary: 'Page content, sections and SEO by page key', parameters: [slug, lang], responses: { '200': envelope(), ...errors } } },
    '/api/public/services': getList('All published services'),
    '/api/public/services/{slug}': getOne('One service'),
    '/api/public/equipment-categories': getList('Equipment categories'),
    '/api/public/equipment': getList('Equipment catalogue (paginated, filterable)', [
      { name: 'category', in: 'query', schema: { type: 'string' } },
      { name: 'capacityMin', in: 'query', schema: { type: 'number' } },
      { name: 'capacityMax', in: 'query', schema: { type: 'number' } },
      { name: 'operator', in: 'query', schema: { type: 'string', enum: ['with', 'without'] } },
      { name: 'featured', in: 'query', schema: { type: 'boolean' } },
      { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1 } },
      { name: 'pageSize', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100 } },
    ]),
    '/api/public/equipment/{slug}': getOne('One equipment item'),
    '/api/public/fleet': getList('Truck and trailer types'),
    '/api/public/clients': getList('Client and partner logos'),
    '/api/public/testimonials': getList('Testimonials'),
    '/api/public/projects': getList('Projects / case studies'),
    '/api/public/projects/{slug}': getOne('One project'),
    '/api/public/blog': getList('Published posts (paginated)', [{ name: 'page', in: 'query', schema: { type: 'integer' } }]),
    '/api/public/blog/{slug}': getOne('One post'),
    '/api/public/faqs': getList('FAQs', [{ name: 'group', in: 'query', schema: { type: 'string', enum: ['general', 'rental', 'logistics', 'courier'] } }]),
    '/api/public/inquiries': {
      post: {
        tags: ['Public'],
        summary: 'Submit a quote, contact, booking or courier request (rate limited: 5 per hour per IP)',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/InquiryCreate' } } } },
        responses: { '201': envelope(), '400': { description: 'Validation error' }, '429': { description: 'Rate limited' } },
      },
    },
    '/api/public/track/{id}': {
      get: {
        tags: ['Public'],
        summary: 'Courier tracking (STUB: returns demo data, flagged isDemo=true)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', pattern: '^[A-Za-z0-9-]{4,40}$' } }],
        responses: { '200': envelope(), '400': { description: 'Invalid tracking number' } },
      },
    },
    '/api/admin/auth/csrf': { get: { tags: ['Auth'], summary: 'Issue a CSRF token (also set as the readable `csrf` cookie)', responses: { '200': envelope() } } },
    '/api/admin/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in; sets httpOnly access/refresh cookies and returns a rotated CSRF token',
        security: [{ csrf: [] }],
        requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string' }, password: { type: 'string' } } } } } },
        responses: { '200': envelope(), '401': { description: 'Invalid credentials' }, '403': { description: 'CSRF' }, '429': { description: 'Rate limited' } },
      },
    },
    '/api/admin/auth/refresh': { post: { tags: ['Auth'], summary: 'Rotate the refresh token', security: [{ csrf: [] }], responses: { '200': envelope(), '401': { description: 'Expired or reused' } } } },
    '/api/admin/auth/logout': { post: { tags: ['Auth'], summary: 'Revoke the session', security: [{ csrf: [] }], responses: { '200': envelope() } } },
    '/api/admin/auth/me': { get: { tags: ['Auth'], summary: 'Current user', security: [{ cookie: [] }], responses: { '200': envelope(), '401': { description: 'No session' } } } },
    '/api/admin/users': { get: { tags: ['Admin'], summary: 'List users (Super Admin)', security: [{ cookie: [] }], responses: { '200': envelope('array'), '403': { description: 'Forbidden' } } } },
  },
};

export function mountApiDocs(app: Express) {
  app.get('/api/docs.json', (_req, res) => res.json(openapi));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapi, { customSiteTitle: 'API docs' }));
}
