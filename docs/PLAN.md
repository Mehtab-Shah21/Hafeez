# Build Plan

Companion to `CLAUDE.md`. This is the plan to confirm before Step 1.

## 1. Monorepo layout
```
/                       package.json (workspaces, root scripts), tsconfig.base.json, eslint, prettier, .env.example, README.md, CLAUDE.md
/apps/web               Vite + React 18 + TS + Tailwind
  index.html            SSR template (<!--app-head-->, <!--app-html-->, <!--app-state-->)
  src/entry-client.tsx  hydrateRoot + QueryClient hydrate
  src/entry-server.tsx  render(url) → stream, status, helmet, dehydrated state
  src/routes/           public routes (/:lang/...) + lazy admin routes
  src/pages/            Home, About, Services, ServiceDetail, Equipment, EquipmentDetail, Logistics,
                        Contact, Projects, ProjectDetail, Blog, BlogPost, Legal, NotFound
  src/components/       ui/ layout/ sections/ machinery/ seo/ forms/
  src/hero/             HeroScene, layers/*.svg components, timelines.ts, useScrollVideo.ts
  src/config/hero.ts    asset swap point (video URLs, poster, layers, intensity)
  src/admin/            AdminApp, shell, modules/* (client-only, lazy)
  src/lib/              raf.ts (single loop), motion.ts, deviceTier.ts, i18n.ts, queryClient.ts, api.ts
  src/locales/en|ar/    UI chrome strings
/apps/server            Express + TS
  src/index.ts          boot
  src/app.ts            middleware stack + routers + SSR catch-all
  src/ssr/              dev (Vite middleware mode) / prod (dist/server/entry-server.js) renderer
  src/modules/          auth, users, settings, pages, sections, services, equipment, categories, fleet,
                        clients, testimonials, projects, team, faqs, blog, media, inquiries, seo,
                        redirects, notfound, audit, track
  src/middleware/       auth, rbac, csrf, validate, errorHandler, redirects, rateLimits, etag
  src/lib/              prisma, logger, mailer, storage/{local,s3,cloudinary}, seo/{sitemap,robots,jsonld,score}
  src/openapi/          zod-to-openapi registry → /api/docs
/packages/shared        schemas/, constants/, types/, api/ (envelope + typed client)
/prisma                 schema.prisma, migrations/, seed.ts, seed-data/
/docs                   PLAN.md, SESSION_ARCHIVE.md
```

## 2. Prisma schema (summary)
Localized fields live in `content Json` shaped `{ en: {...}, ar: {...} }` (Zod-validated per model). Status strings: `DRAFT | PUBLISHED`.

| Model | Key fields |
|---|---|
| User | id, email (unique), passwordHash, name, roleId, isActive, lastLoginAt, refreshTokens[] |
| Role | id, key (SUPER_ADMIN/EDITOR/SEO_MANAGER), name, permissions Json |
| RefreshToken | id, userId, tokenHash, expiresAt, revokedAt (rotation) |
| Setting | key (unique: `company`, `theme`, `navbar`, `footer`, `hero`, `seo.global`, `robots`, `analytics`), value Json, updatedAt |
| Page | id, key/slug (home, about, services, equipment, logistics, contact, projects, blog, privacy, terms), status, sections[] |
| Section | id, pageId, type (hero, stats, process, faq…), order, isVisible, content Json, draftContent Json, status |
| Service | id, slug, order, icon, imageId, featured, status, content Json (title, excerpt, overview, features[], useCases[], faqs[]) |
| EquipmentCategory | id, slug, order, content Json |
| Equipment | id, slug, categoryId, capacityValue Float, capacityUnit, withOperator Bool, operatorOptional Bool, featured, availability, specs Json, rentalTerms Json, images (EquipmentImage[]), status, content Json |
| FleetType | id, slug, order, payloadTonnes, deckLengthM, imageId, specs Json, status, content Json |
| Client | id, name, logoId, url, order, isVisible |
| Testimonial | id, rating, avatarId, company, order, isVisible, content Json (name, role, quote) |
| Project | id, slug, year, emirate, clientId?, coverId, gallery Json, featured, status, content Json |
| TeamMember | id, photoId, order, isVisible, content Json (name, role, bio) |
| Faq | id, group (general/rental/logistics/courier), order, isVisible, content Json (q, a) |
| BlogPost | id, slug, coverId, authorId, publishedAt, status, tags Json, content Json (title, excerpt, body TipTap JSON + HTML) |
| Media | id, filename, mime, width, height, sizeBytes, variants Json (webp/avif/sizes), alt Json {en,ar} (required), folder, uploadedById |
| Inquiry | id, type (quote/contact/booking/courier), status (NEW/CONTACTED/WON/LOST), name, company, phone, email, serviceType, equipmentSlug, payload Json (pickup, dropoff, cargo, weight, date…), message, attachmentId, notes Json, locale, ip hash, userAgent, createdAt |
| SeoMeta | id, entityType (page/service/equipment/project/blog/category), entityId, locale; title, description, focusKeyword, canonical, robotsIndex, robotsFollow, ogTitle, ogDescription, ogImageId, twitterCard, jsonLdOverride Json?, score Int; unique(entityType, entityId, locale) |
| Redirect | id, from (unique), to, code (301/302/410), isActive, hits |
| NotFoundLog | id, path (unique), hits, lastSeenAt, referrer |
| AuditLog | id, userId, action, entityType, entityId, diff Json, ip, createdAt |

## 3. API routes
**Public** (`/api/public`, ETag, cache headers): `GET settings`, `pages/:slug`, `services`, `services/:slug`, `equipment?category&capacityMin&capacityMax&operator&page`, `equipment/:slug`, `equipment-categories`, `fleet`, `clients`, `testimonials`, `projects`, `projects/:slug`, `blog?page&tag`, `blog/:slug`, `faqs?group`; `POST inquiries` (multipart, honeypot, rate-limit, Zod, optional Turnstile); `GET track/:id` (stub).
**Auth** (`/api/admin/auth`): `POST login`, `POST refresh`, `POST logout`, `GET me`, `GET csrf`.
**Admin** (`/api/admin`, auth + CSRF + RBAC + audit): REST CRUD (`GET list`, `GET :id`, `POST`, `PATCH :id`, `DELETE :id`, `PATCH reorder`) for settings, pages, sections (+ `POST :id/publish`), services, equipment, equipment-categories, fleet, clients, testimonials, projects, team, faqs, blog; `media` (upload/list/update alt/delete); `inquiries` (list/filter, update status/notes, `GET export.csv`); `seo/meta` (get/upsert per entity+locale), `seo/bulk`, `seo/score/:entityType/:id`, `seo/global`, `seo/robots`; `redirects` CRUD; `not-found-log` (list, suggestions, dismiss); `users` CRUD; `audit-log` list; `dashboard/summary`.
**Infra**: `GET /sitemap.xml`, `GET /robots.txt`, `GET /api/docs`, `GET /healthz`, `/uploads/*`.

## 4. SSR architecture
- **Dev**: Express creates Vite in middleware mode; SSR handler uses `vite.ssrLoadModule('/src/entry-server.tsx')` + `vite.transformIndexHtml`.
- **Prod**: `vite build` (client, manifest) + `vite build --ssr src/entry-server.tsx` → server imports `dist/server/entry-server.js`; static `dist/client/assets` with `immutable, max-age=31536000`; HTML `no-cache`.
- Each route object exports `prefetch({ queryClient, params, lang, services })`. Server passes an in-process data adapter (service layer); client uses HTTP adapter with the same query keys → identical cache.
- `renderToPipeableStream` → `onAllReady` → stream template head (Helmet tags, preloads, `lang`/`dir`) + app HTML + `<script>window.__RQ_STATE__=…</script>` (serialized safely, `<` escaped).
- Status: `NotFound` / `Gone` / `Redirect` thrown by prefetch → handled before streaming.
- `/admin/*`: no SSR; serve shell with `<meta name="robots" content="noindex,nofollow">`; admin code is a separate lazy chunk never referenced by public routes.

## 5. Component list
- **Layout**: SiteLayout, Navbar (glass pill, mega menu, LangSwitcher, QuoteButton), MobileMenu, Footer (wordmark, quick links, contact, licence/TRN), QuoteBand, WhatsAppFab, MobileCtaBar, CookieConsent, Preloader, SkipLink, Breadcrumbs.
- **Primitives**: Container, Section, Heading (condensed display), PillButton (chevron), ImageCard, GlassCard, StatCounter, Reveal (IO once), Marquee, Tilt, ResponsiveImage (`<picture>` avif/webp + srcset), Accordion, Tabs.
- **Machinery**: CraneHookIcon, ForkliftIcon, TruckIcon (wheel spin), ReachStackerIcon, MachineryDivider (truck/forklift crossing on reveal), BlueprintGrid, TopoPattern.
- **Sections**: Hero, TrustMarquee, ServicesOverview, EquipmentHighlights, LogisticsCourierSplit, WhyChooseUs (stats), ProcessTimeline, FeaturedProjects, Testimonials, Certifications, FaqSection, QuoteCtaBand, StoryBlock, MissionVision, TeamGrid, ValuesGrid, MilestonesTimeline, FleetStats.
- **Feature**: EquipmentFilters + EquipmentGrid + SpecTable + Gallery, TruckTypes, UaeGccMap (interactive SVG), BookingForm, TrackingWidget, InquiryForm (file upload, emirate selector, +971 phone), BlogCard, ProjectCard.
- **SEO**: Seo (helmet: title, meta, canonical, hreflang, OG/Twitter, robots), JsonLd.
- **Admin**: AdminShell (sidebar, topbar), DataTable (TanStack), EntityForm (EN/AR tabs), MediaPicker, ImageUploader, RichTextEditor (TipTap), SeoPanel (counters, SERP preview, social preview, score checklist, JSON-LD editor), StatusBadge, ConfirmDialog.

## 6. Animation architecture
- `lib/raf.ts`: single global rAF loop with subscriber set (scroll-video easing, parallax, Lenis `raf`); auto-stops when no subscribers.
- `lib/motion.ts`: `usePrefersReducedMotion`, `useDeviceTier` (high/low), SSR-safe defaults (render the static final frame on the server).
- Hero: GSAP dynamically imported in `useEffect`; `gsap.context()` for cleanup; intro timeline then ScrollTrigger pin (`end: '+=300%'`, `scrub: 0.6`) on one master timeline; RTL multiplies x-translations by −1; low tier → `end: '+=150%'`, parallax off, fewer layers.
- Section reveals: Framer Motion `whileInView` with `viewport={{ once: true }}`, transform/opacity only; `will-change` set via `onAnimationStart`, cleared `onAnimationComplete`.
- Ambient loops (marquee, hook sway, heat haze): CSS keyframes on transform/opacity, paused off-screen and under reduced motion.
- Lenis: created client-side only when motion allowed; drives ScrollTrigger via `lenis.on('scroll', ScrollTrigger.update)` and the shared rAF loop.

## 7. Build order
1. Monorepo + DB + auth + design system → 2. API + SSR (prove on Home with `curl`) → 3. Layout/navbar/footer → 4. Hero → 5. Public pages → 6. Admin + SEO Manager → 7. SEO/technical pass → 8. Perf + a11y audit.

## 8. Imagery
Real photographs throughout: licensed Wikimedia Commons stand-ins (CC0/BY/BY-SA/PD) for cranes, forklifts, aerial lifts, earthmoving, trucks/trailers, port terminals, warehouses and the UAE skyline. All are self-hosted as AVIF/WebP and credited in the footer and on `/credits`. The hero keeps its animated vector machinery over a real photo background layer (confirmed by the user 2026-11-17). Each stand-in gets swapped for the client's own photo later.

## 9. Open inputs (placeholders until supplied)
Company name, tagline, HQ emirate, phone/WhatsApp, emails, branch addresses + coordinates, Trade Licence/TRN, social links, real logos/photos/video, actual certifications held.
