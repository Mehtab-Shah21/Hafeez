/**
 * npm run photos:import
 *
 * Imports licensed stand-in photographs from Wikimedia Commons (CC0, CC BY, CC BY-SA, public
 * domain; ≥1600px wide), optimises them with the same pipeline as admin uploads (WebP + AVIF),
 * stores author/licence for the /credits page, and attaches them where content has no image yet.
 *
 * Needs internet access. Review every imported image afterwards in Admin → Media: remove any with
 * readable company names/logos or recognisable faces, and replace stand-ins with your own photos.
 * Re-running skips subjects that already have images.
 */
import 'dotenv/config';
import { prisma } from '../src/lib/prisma.js';
import { processImage, type Credit } from '../src/modules/admin/media.js';

// Generic client name (no personal details sent to third parties).
const UA = 'site-photo-import/1.0 (licensed stand-in images for a business website)';
const OK_LICENCE = /^(cc0|cc[- ]by(-sa)?[- ]?\d|cc[- ]by(-sa)?$|public domain|pd)/i;

interface Candidate {
  title: string;
  url: string;
  width: number;
  height: number;
  credit: Credit;
}

async function search(query: string, count = 6): Promise<Candidate[]> {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    generator: 'search',
    gsrsearch: `filetype:bitmap ${query}`,
    gsrnamespace: '6',
    gsrlimit: '30',
    prop: 'imageinfo',
    iiprop: 'url|size|extmetadata|mime',
    iiurlwidth: '1920',
  });
  const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params.toString()}`, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Commons search failed: ${res.status}`);
  const json = (await res.json()) as { query?: { pages?: Record<string, { title: string; imageinfo?: { thumburl?: string; url: string; width: number; height: number; mime: string; descriptionurl: string; extmetadata?: Record<string, { value: string }> }[] }> } };
  const strip = (s = '') => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  return Object.values(json.query?.pages ?? {})
    .map((p) => {
      const ii = p.imageinfo?.[0];
      const md = ii?.extmetadata ?? {};
      const licence = strip(md.LicenseShortName?.value);
      if (!ii || ii.mime !== 'image/jpeg' || ii.width < 1600 || !OK_LICENCE.test(licence)) return null;
      // Skip files whose names suggest logos, maps, drawings or named businesses.
      if (/logo|map|drawing|diagram|poster|sign|svg|painting|interior of .* store/i.test(p.title)) return null;
      return {
        title: p.title.replace(/^File:/, '').replace(/\.[a-z]+$/i, ''),
        url: ii.thumburl ?? ii.url,
        width: ii.width,
        height: ii.height,
        credit: {
          author: strip(md.Artist?.value) || 'Unknown',
          licence,
          licenceUrl: md.LicenseUrl?.value ?? 'https://creativecommons.org/publicdomain/mark/1.0/',
          sourceUrl: ii.descriptionurl,
        },
      } satisfies Candidate;
    })
    .filter((c): c is Candidate => c !== null)
    .slice(0, count);
}

async function importOne(query: string, alt: { en: string; ar: string }, used: Set<string>) {
  for (const c of await search(query)) {
    if (used.has(c.credit.sourceUrl)) continue;
    const res = await fetch(c.url, { headers: { 'User-Agent': UA } });
    if (!res.ok) continue;
    used.add(c.credit.sourceUrl);
    const media = await processImage(Buffer.from(await res.arrayBuffer()), c.title, alt, { folder: 'stand-in', credit: c.credit, source: 'stand-in' });
    console.log(`  ✓ ${query} → ${c.title} (${c.credit.licence}, ${c.credit.author})`);
    return media.id;
  }
  console.log(`  – nothing suitable for "${query}"`);
  return null;
}

const SUBJECTS = {
  service: {
    'equipment-rental': ['mobile crane construction site', { en: 'Mobile crane working on a construction site', ar: 'رافعة متحركة تعمل في موقع بناء' }],
    'heavy-transport': ['lowboy trailer excavator transport', { en: 'Lowbed trailer carrying heavy machinery', ar: 'شاحنة منخفضة تنقل آليات ثقيلة' }],
    'freight-truckload': ['semi trailer truck highway', { en: 'Truck and trailer on the highway', ar: 'شاحنة ومقطورة على الطريق السريع' }],
    'courier-express': ['delivery van parcels', { en: 'Courier van with parcels', ar: 'شاحنة توصيل مع طرود' }],
    warehousing: ['warehouse pallet racking forklift', { en: 'Warehouse with pallet racking', ar: 'مستودع مع رفوف المنصات' }],
    'rigging-lifting': ['crane rigging lifting load', { en: 'Rigging crew lifting a heavy load', ar: 'فريق تعليق يرفع حمولة ثقيلة' }],
  },
  category: {
    cranes: 'mobile crane',
    forklifts: 'forklift truck',
    'aerial-lifts': 'boom lift aerial work platform',
    earthmoving: 'crawler excavator',
    handling: 'reach stacker container',
  },
  fleet: {
    flatbed: 'flatbed trailer truck',
    lowbed: 'lowboy trailer',
    reefer: 'refrigerated trailer truck',
    'curtain-side': 'curtainsider trailer',
    'container-trailer': 'container truck chassis',
    'courier-van': 'delivery van',
  },
  hero: ['Jebel Ali port container cranes', { en: 'Container port with ship-to-shore cranes at dusk', ar: 'ميناء حاويات مع رافعات الشحن عند الغروب' }],
} as const;

async function main() {
  const used = new Set<string>();
  console.log('Services');
  for (const [slug, [q, alt]] of Object.entries(SUBJECTS.service)) {
    const s = await prisma.service.findUnique({ where: { slug } });
    if (!s || s.imageId) continue;
    const id = await importOne(q, alt, used);
    if (id) await prisma.service.update({ where: { id: s.id }, data: { imageId: id } });
  }
  console.log('Equipment (one photo per machine, by category)');
  const equipment = await prisma.equipment.findMany({ include: { category: true, images: true } });
  for (const e of equipment) {
    if (e.images.length) continue;
    const name = (e.content as { en?: { name?: string }; ar?: { name?: string } }).en?.name ?? e.slug;
    const nameAr = (e.content as { ar?: { name?: string } }).ar?.name ?? name;
    const q = SUBJECTS.category[e.category.slug as keyof typeof SUBJECTS.category] ?? name;
    const id = await importOne(`${q} ${name.replace(/[\d.]+\s*(t|m|kva|m³)\b/gi, '').trim()}`, { en: name, ar: nameAr }, used);
    if (id) await prisma.equipmentImage.create({ data: { equipmentId: e.id, mediaId: id, order: 0 } });
  }
  console.log('Fleet');
  for (const [slug, q] of Object.entries(SUBJECTS.fleet)) {
    const f = await prisma.fleetType.findUnique({ where: { slug } });
    if (!f || f.imageId) continue;
    const c = f.content as { en: { name: string }; ar: { name: string } };
    const id = await importOne(q, { en: c.en.name, ar: c.ar.name }, used);
    if (id) await prisma.fleetType.update({ where: { id: f.id }, data: { imageId: id } });
  }
  console.log('Hero background');
  const heroRow = await prisma.setting.findUnique({ where: { key: 'hero' } });
  const hero = heroRow?.value as { backgroundId?: string | null } | undefined;
  if (heroRow && hero && !hero.backgroundId) {
    const [q, alt] = SUBJECTS.hero;
    const id = await importOne(q, alt, used);
    if (id) await prisma.setting.update({ where: { key: 'hero' }, data: { value: { ...(heroRow.value as object), backgroundId: id } } });
  }
  console.log('\nDone. Review every stand-in in Admin → Media and replace with your own photos when ready.');
}

main()
  .catch((e: unknown) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
