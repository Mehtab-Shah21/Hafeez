import type { ZodTypeAny } from 'zod';
import {
  adminBlogSchema,
  adminClientSchema,
  adminEquipmentCategorySchema,
  adminEquipmentSchema,
  adminFaqSchema,
  adminFleetSchema,
  adminProjectSchema,
  adminRedirectSchema,
  adminServiceSchema,
  adminTeamSchema,
  adminTestimonialSchema,
  EMIRATES,
  FAQ_GROUPS,
  type Permission,
  type SeoEntityType,
} from '@app/shared';
import { apiPaged } from './api';
import type { FieldDef, Option } from './fields';

export interface ModuleDef {
  key: string;
  title: string;
  api: string;
  write: Permission;
  schema: ZodTypeAny;
  /** Table columns: label + how to read a display value from a row. */
  columns: { label: string; get: (row: Row) => string | number | boolean }[];
  fields: FieldDef[];
  defaults: Record<string, unknown>;
  /** API row → form values (strip relations, map join tables). */
  fromItem?: (row: Row) => Record<string, unknown>;
  seoType?: SeoEntityType;
  publicPath?: (row: Row) => string;
  orderable?: boolean;
}
export type Row = Record<string, unknown> & { id: string };

const en = (row: Row, key: string) => ((row.content as Record<string, Record<string, unknown>> | undefined)?.en?.[key] as string) ?? '';
const status = [
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'DRAFT', label: 'Draft' },
];
const loc = (fields: FieldDef[]): FieldDef => ({ kind: 'localized', base: 'content', fields });
const emptyLoc = (v: Record<string, unknown>) => ({ en: { ...v }, ar: { ...v } });
const categories = async (): Promise<Option[]> => (await apiPaged<Row>('/equipment-categories?pageSize=200')).items.map((c) => ({ value: c.id, label: en(c, 'name') || String(c.slug) }));
const pick = (row: Row, keys: string[]) => Object.fromEntries(keys.map((k) => [k, row[k]]));

const faqFields: FieldDef = { kind: 'objects', name: 'faqs', label: 'FAQs', fields: [{ key: 'q', label: 'Question' }, { key: 'a', label: 'Answer', kind: 'textarea' }] };

export const MODULES: ModuleDef[] = [
  {
    key: 'services',
    title: 'Services',
    api: '/services',
    write: 'content:write',
    schema: adminServiceSchema,
    orderable: true,
    seoType: 'service',
    publicPath: (r) => `/services/${String(r.slug)}`,
    columns: [
      { label: 'Title', get: (r) => en(r, 'title') },
      { label: 'Slug', get: (r) => String(r.slug) },
      { label: 'Status', get: (r) => String(r.status) },
      { label: 'Featured', get: (r) => Boolean(r.featured) },
    ],
    fields: [
      { kind: 'slug', name: 'slug', label: 'URL slug' },
      { kind: 'select', name: 'icon', label: 'Icon', options: ['crane', 'hook', 'forklift', 'truck', 'lowbed', 'parcel', 'warehouse'].map((v) => ({ value: v, label: v })) },
      { kind: 'select', name: 'status', label: 'Status', options: status },
      { kind: 'number', name: 'order', label: 'Order' },
      { kind: 'checkbox', name: 'featured', label: 'Featured on home' },
      { kind: 'media', name: 'imageId', label: 'Card image' },
      loc([
        { kind: 'text', name: 'title', label: 'Title (H1)' },
        { kind: 'textarea', name: 'excerpt', label: 'Short summary', rows: 2 },
        { kind: 'textarea', name: 'overview', label: 'Overview (first paragraph)', rows: 5 },
        { kind: 'objects', name: 'features', label: 'Features', fields: [{ key: 'title', label: 'Title' }, { key: 'body', label: 'Text', kind: 'textarea' }] },
        { kind: 'lines', name: 'useCases', label: 'Use cases' },
        faqFields,
      ]),
    ],
    defaults: { slug: '', icon: 'crane', imageId: null, featured: false, order: 0, status: 'PUBLISHED', content: emptyLoc({ title: '', excerpt: '', overview: '', features: [], useCases: [], faqs: [] }) },
    fromItem: (r) => pick(r, ['slug', 'icon', 'imageId', 'featured', 'order', 'status', 'content']),
  },
  {
    key: 'equipment',
    title: 'Equipment',
    api: '/equipment',
    write: 'content:write',
    schema: adminEquipmentSchema,
    orderable: true,
    seoType: 'equipment',
    publicPath: (r) => `/equipment/${String(r.slug)}`,
    columns: [
      { label: 'Name', get: (r) => en(r, 'name') },
      { label: 'Category', get: (r) => ((r.category as Row | undefined) ? en(r.category as Row, 'name') : '') },
      { label: 'Capacity', get: (r) => `${String(r.capacityValue)} ${String(r.capacityUnit)}` },
      { label: 'Availability', get: (r) => String(r.availability) },
      { label: 'Featured', get: (r) => Boolean(r.featured) },
    ],
    fields: [
      { kind: 'slug', name: 'slug', label: 'URL slug' },
      { kind: 'select', name: 'categoryId', label: 'Category', options: categories },
      { kind: 'number', name: 'capacityValue', label: 'Capacity' },
      { kind: 'select', name: 'capacityUnit', label: 'Unit', options: ['t', 'kg', 'm', 'kVA'].map((v) => ({ value: v, label: v })) },
      { kind: 'select', name: 'availability', label: 'Availability', options: ['available', 'limited', 'on-request'].map((v) => ({ value: v, label: v })) },
      { kind: 'select', name: 'status', label: 'Status', options: status },
      { kind: 'checkbox', name: 'withOperator', label: 'Operator included' },
      { kind: 'checkbox', name: 'operatorOptional', label: 'Can rent without operator' },
      { kind: 'checkbox', name: 'featured', label: 'Featured' },
      { kind: 'number', name: 'order', label: 'Order' },
      { kind: 'mediaList', name: 'imageIds', label: 'Photos (cutouts on plain backgrounds work best)' },
      loc([
        { kind: 'text', name: 'name', label: 'Name (H1)' },
        { kind: 'textarea', name: 'summary', label: 'Summary', rows: 2 },
        { kind: 'textarea', name: 'description', label: 'Description', rows: 4 },
        { kind: 'objects', name: 'specs', label: 'Specifications', fields: [{ key: 'label', label: 'Spec' }, { key: 'value', label: 'Value' }] },
        { kind: 'lines', name: 'rentalTerms', label: 'Rental terms' },
      ]),
    ],
    defaults: { slug: '', categoryId: '', capacityValue: 0, capacityUnit: 't', withOperator: true, operatorOptional: true, featured: false, availability: 'available', order: 0, status: 'PUBLISHED', imageIds: [], content: emptyLoc({ name: '', summary: '', description: '', specs: [], rentalTerms: [] }) },
    fromItem: (r) => ({
      ...pick(r, ['slug', 'categoryId', 'capacityValue', 'capacityUnit', 'withOperator', 'operatorOptional', 'featured', 'availability', 'order', 'status', 'content']),
      imageIds: ((r.images as { mediaId: string }[] | undefined) ?? []).map((i) => i.mediaId),
    }),
  },
  {
    key: 'equipment-categories',
    title: 'Equipment categories',
    api: '/equipment-categories',
    write: 'content:write',
    schema: adminEquipmentCategorySchema,
    orderable: true,
    seoType: 'category',
    columns: [
      { label: 'Name', get: (r) => en(r, 'name') },
      { label: 'Slug', get: (r) => String(r.slug) },
    ],
    fields: [{ kind: 'slug', name: 'slug', label: 'Slug' }, { kind: 'number', name: 'order', label: 'Order' }, loc([{ kind: 'text', name: 'name', label: 'Name' }, { kind: 'textarea', name: 'description', label: 'Description' }])],
    defaults: { slug: '', order: 0, content: emptyLoc({ name: '', description: '' }) },
    fromItem: (r) => pick(r, ['slug', 'order', 'content']),
  },
  {
    key: 'fleet',
    title: 'Fleet / trucks',
    api: '/fleet',
    write: 'content:write',
    schema: adminFleetSchema,
    orderable: true,
    columns: [
      { label: 'Name', get: (r) => en(r, 'name') },
      { label: 'Payload (t)', get: (r) => Number(r.payloadTonnes) },
      { label: 'Deck (m)', get: (r) => Number(r.deckLengthM) },
    ],
    fields: [
      { kind: 'slug', name: 'slug', label: 'Slug' },
      { kind: 'number', name: 'payloadTonnes', label: 'Payload (t)' },
      { kind: 'number', name: 'deckLengthM', label: 'Deck length (m)' },
      { kind: 'select', name: 'status', label: 'Status', options: status },
      { kind: 'number', name: 'order', label: 'Order' },
      { kind: 'media', name: 'imageId', label: 'Photo' },
      loc([{ kind: 'text', name: 'name', label: 'Name' }, { kind: 'textarea', name: 'summary', label: 'Summary' }, { kind: 'lines', name: 'bestFor', label: 'Best for' }]),
    ],
    defaults: { slug: '', payloadTonnes: 0, deckLengthM: 0, imageId: null, status: 'PUBLISHED', order: 0, content: emptyLoc({ name: '', summary: '', bestFor: [] }) },
    fromItem: (r) => pick(r, ['slug', 'payloadTonnes', 'deckLengthM', 'imageId', 'status', 'order', 'content']),
  },
  {
    key: 'clients',
    title: 'Clients & partners',
    api: '/clients',
    write: 'content:write',
    schema: adminClientSchema,
    orderable: true,
    columns: [
      { label: 'Name', get: (r) => String(r.name) },
      { label: 'Visible', get: (r) => Boolean(r.isVisible) },
      { label: 'Logo', get: (r) => (r.logoId ? 'yes' : 'no') },
    ],
    fields: [
      { kind: 'text', name: 'name', label: 'Name' },
      { kind: 'text', name: 'url', label: 'Website (optional)', dir: 'ltr' },
      { kind: 'media', name: 'logoId', label: 'Logo (only logos you have permission to use)' },
      { kind: 'number', name: 'order', label: 'Order' },
      { kind: 'checkbox', name: 'isVisible', label: 'Show in marquee' },
    ],
    defaults: { name: '', url: '', logoId: null, order: 0, isVisible: true },
    fromItem: (r) => pick(r, ['name', 'url', 'logoId', 'order', 'isVisible']),
  },
  {
    key: 'testimonials',
    title: 'Testimonials',
    api: '/testimonials',
    write: 'content:write',
    schema: adminTestimonialSchema,
    orderable: true,
    columns: [
      { label: 'Name', get: (r) => en(r, 'name') },
      { label: 'Company', get: (r) => String(r.company) },
      { label: 'Rating', get: (r) => Number(r.rating) },
    ],
    fields: [
      { kind: 'text', name: 'company', label: 'Company' },
      { kind: 'number', name: 'rating', label: 'Rating (1–5)' },
      { kind: 'media', name: 'avatarId', label: 'Avatar' },
      { kind: 'number', name: 'order', label: 'Order' },
      { kind: 'checkbox', name: 'isVisible', label: 'Visible' },
      loc([{ kind: 'text', name: 'name', label: 'Person' }, { kind: 'text', name: 'role', label: 'Role' }, { kind: 'textarea', name: 'quote', label: 'Quote' }]),
    ],
    defaults: { company: '', rating: 5, avatarId: null, order: 0, isVisible: true, content: emptyLoc({ name: '', role: '', quote: '' }) },
    fromItem: (r) => pick(r, ['company', 'rating', 'avatarId', 'order', 'isVisible', 'content']),
  },
  {
    key: 'projects',
    title: 'Projects',
    api: '/projects',
    write: 'content:write',
    schema: adminProjectSchema,
    seoType: 'project',
    publicPath: (r) => `/projects/${String(r.slug)}`,
    columns: [
      { label: 'Title', get: (r) => en(r, 'title') },
      { label: 'Year', get: (r) => Number(r.year) },
      { label: 'Emirate', get: (r) => String(r.emirate) },
      { label: 'Featured', get: (r) => Boolean(r.featured) },
    ],
    fields: [
      { kind: 'slug', name: 'slug', label: 'Slug' },
      { kind: 'number', name: 'year', label: 'Year' },
      { kind: 'select', name: 'emirate', label: 'Emirate', options: EMIRATES.map((e) => ({ value: e.key, label: e.en })) },
      { kind: 'select', name: 'status', label: 'Status', options: status },
      { kind: 'checkbox', name: 'featured', label: 'Featured on home' },
      { kind: 'media', name: 'coverId', label: 'Cover photo' },
      { kind: 'mediaList', name: 'gallery', label: 'Gallery' },
      loc([
        { kind: 'text', name: 'title', label: 'Title (H1)' },
        { kind: 'textarea', name: 'summary', label: 'Summary', rows: 2 },
        { kind: 'textarea', name: 'challenge', label: 'Challenge' },
        { kind: 'textarea', name: 'solution', label: 'Solution' },
        { kind: 'lines', name: 'results', label: 'Results' },
      ]),
    ],
    defaults: { slug: '', year: new Date().getFullYear(), emirate: 'dubai', coverId: null, gallery: [], featured: false, status: 'PUBLISHED', content: emptyLoc({ title: '', summary: '', challenge: '', solution: '', results: [] }) },
    fromItem: (r) => pick(r, ['slug', 'year', 'emirate', 'coverId', 'gallery', 'featured', 'status', 'content']),
  },
  {
    key: 'team',
    title: 'Team',
    api: '/team',
    write: 'content:write',
    schema: adminTeamSchema,
    orderable: true,
    columns: [
      { label: 'Name', get: (r) => en(r, 'name') },
      { label: 'Role', get: (r) => en(r, 'role') },
    ],
    fields: [{ kind: 'media', name: 'photoId', label: 'Photo' }, { kind: 'number', name: 'order', label: 'Order' }, { kind: 'checkbox', name: 'isVisible', label: 'Visible' }, loc([{ kind: 'text', name: 'name', label: 'Name' }, { kind: 'text', name: 'role', label: 'Role' }, { kind: 'textarea', name: 'bio', label: 'Bio' }])],
    defaults: { photoId: null, order: 0, isVisible: true, content: emptyLoc({ name: '', role: '', bio: '' }) },
    fromItem: (r) => pick(r, ['photoId', 'order', 'isVisible', 'content']),
  },
  {
    key: 'faqs',
    title: 'FAQs',
    api: '/faqs',
    write: 'content:write',
    schema: adminFaqSchema,
    orderable: true,
    columns: [
      { label: 'Question', get: (r) => en(r, 'q') },
      { label: 'Group', get: (r) => String(r.group) },
    ],
    fields: [{ kind: 'select', name: 'group', label: 'Group', options: FAQ_GROUPS.map((g) => ({ value: g, label: g })) }, { kind: 'number', name: 'order', label: 'Order' }, { kind: 'checkbox', name: 'isVisible', label: 'Visible' }, loc([{ kind: 'text', name: 'q', label: 'Question' }, { kind: 'textarea', name: 'a', label: 'Answer' }])],
    defaults: { group: 'general', order: 0, isVisible: true, content: emptyLoc({ q: '', a: '' }) },
    fromItem: (r) => pick(r, ['group', 'order', 'isVisible', 'content']),
  },
  {
    key: 'blog',
    title: 'Blog posts',
    api: '/blog',
    write: 'content:write',
    schema: adminBlogSchema,
    seoType: 'blog',
    publicPath: (r) => `/blog/${String(r.slug)}`,
    columns: [
      { label: 'Title', get: (r) => en(r, 'title') },
      { label: 'Status', get: (r) => String(r.status) },
      { label: 'Published', get: (r) => (r.publishedAt ? String(r.publishedAt).slice(0, 10) : '') },
    ],
    fields: [
      { kind: 'slug', name: 'slug', label: 'Slug' },
      { kind: 'select', name: 'status', label: 'Status', options: status },
      { kind: 'media', name: 'coverId', label: 'Cover image' },
      { kind: 'lines', name: 'tags', label: 'Tags' },
      loc([{ kind: 'text', name: 'title', label: 'Title (H1)' }, { kind: 'textarea', name: 'excerpt', label: 'Excerpt', rows: 2 }, { kind: 'richtext', name: 'bodyHtml', label: 'Body' }]),
    ],
    defaults: { slug: '', status: 'DRAFT', coverId: null, publishedAt: null, tags: [], content: emptyLoc({ title: '', excerpt: '', bodyHtml: '' }) },
    fromItem: (r) => ({ ...pick(r, ['slug', 'status', 'coverId', 'tags', 'content']), publishedAt: r.publishedAt ?? null }),
  },
  {
    key: 'redirects',
    title: 'Redirects',
    api: '/redirects',
    write: 'seo:write',
    schema: adminRedirectSchema,
    columns: [
      { label: 'From', get: (r) => String(r.from) },
      { label: 'To', get: (r) => String(r.to) },
      { label: 'Code', get: (r) => Number(r.code) },
      { label: 'Hits', get: (r) => Number(r.hits) },
      { label: 'Active', get: (r) => Boolean(r.isActive) },
    ],
    fields: [
      { kind: 'text', name: 'from', label: 'From path', hint: 'e.g. /old-page (no domain)', dir: 'ltr' },
      { kind: 'text', name: 'to', label: 'To URL or path', hint: 'Leave empty for 410 Gone', dir: 'ltr' },
      { kind: 'select', name: 'code', label: 'Type', numeric: true, options: [{ value: '301', label: '301 permanent' }, { value: '302', label: '302 temporary' }, { value: '410', label: '410 gone' }] },
      { kind: 'checkbox', name: 'isActive', label: 'Active' },
    ],
    defaults: { from: '/', to: '', code: 301, isActive: true },
    fromItem: (r) => pick(r, ['from', 'to', 'code', 'isActive']),
  },
];

export const moduleByKey = (k: string) => MODULES.find((m) => m.key === k);
