# [COMPANY NAME] Website: Project Memory

> Read this file in full at the start of every session, then continue from **§9 Next Steps**.
> Update it after every meaningful unit of work. Never store secrets here (see `.env.example`).

## 1. Project Summary
Premium, animated, bilingual (EN/AR, full RTL) marketing website plus full admin panel for a UAE company doing **heavy-equipment rental** (cranes, forklifts, aerial lifts, earthmoving, handling, generators; with/without operator), **logistics & transportation** (FTL, LTL, flatbed, lowbed/heavy haulage, container, project cargo), **courier & express** (same-/next-day, inter-emirate) and supporting services (warehousing, rigging, site logistics). Serves all 7 emirates + GCC cross-border. Goal: an agency-grade site that signals trust, generates quote requests/inquiries (WhatsApp first-class), ranks locally (SSR + structured data), and is 100% editable from the admin (content, company info, SEO) without touching code. Targets: Lighthouse 90+ ×4, LCP < 2.5s, CLS < 0.05, INP < 200ms, home JS < 180KB gzip.

## 2. Tech Stack (fixed)
- **Frontend (`apps/web`)**: React 18 + TypeScript (strict) + Vite, Tailwind CSS (tokens in `tailwind.config.ts`, theme colours as CSS variables), React Router v6 data routers, TanStack Query, shadcn/ui (Radix) for admin, Framer Motion (UI/sections), GSAP + ScrollTrigger (hero/scroll storytelling), Lenis (off under reduced motion), react-i18next (EN/AR + RTL), react-helmet-async, React Hook Form + Zod, TipTap (blog editor), TanStack Table (admin tables).
- **SSR**: Vite SSR (`entry-client.tsx` / `entry-server.tsx`, `renderToPipeableStream`) mounted in Express; data prefetched server-side and dehydrated (TanStack Query hydration). Public pages = full HTML incl. title/meta/canonical/hreflang/OG/JSON-LD. Admin = client-only lazy chunk, `noindex`.
- **Backend (`apps/server`)**: Node + Express + TypeScript, Prisma, bcrypt, JWT access + refresh (httpOnly/secure/sameSite cookies), CSRF (double-submit token), RBAC (SUPER_ADMIN / EDITOR / SEO_MANAGER), Zod validation middleware, central error handler, pino, helmet (CSP/HSTS), cors, express-rate-limit, compression, cookie-parser, hpp, multer + sharp (WebP/AVIF), storage adapter (local `/uploads` dev; S3/Cloudinary prod), Nodemailer (SMTP/Resend), swagger-ui at `/api/docs`.
- **DB**: PostgreSQL in production, SQLite for local dev (Prisma).
- **Monorepo (npm workspaces)**:
  ```
  /apps/web        React + Vite + Tailwind (public site + admin)
  /apps/server     Express API + SSR host
  /packages/shared Zod schemas, types, constants, typed API client
  /prisma          schema, migrations, seed
  ```
- Single prod command: `npm run build && npm start` (one Express process serves API + SSR + static assets).

## 3. How to Run
_Verified 2026-11-20 (all steps): `npm run dev` = Express + Vite middleware SSR on :3000; `npm run build && npm start` = production SSR._
- Requirements: Node ≥ 20 (dev machine has Node 24.13, npm 11.5), PostgreSQL 15+ for prod (SQLite file for dev).
- First run: `npm install` → copy `.env.example` to `.env` and fill the secrets + `SEED_ADMIN_PASSWORD` (12+ chars) → `npm run db:migrate -- --name init` (also seeds) → `npm run seed` (idempotent; safe to re-run).
- Dev: `npm run dev` → http://localhost:3000 (`/en`, `/ar`, `/api/docs`, dev-only `/__styleguide`). Web/SSR code reloads on every request through Vite; restart after editing server code, or use `npm run dev:watch` (see Known Issues). In the desktop app: preview configs `dev` and `prod` (port 3100, NODE_ENV=production) in `.claude/launch.json`.
- Build: `npm run build` (shared → web → server) · Start prod: `npm start`
- Quality: `npm run lint` · `npm run typecheck` · `npm test` (Vitest + Supertest; uses a throwaway `prisma/test.db`)
- Postgres: `npm run db:migrate:pg` / `npm run db:deploy:pg` (generates `prisma/postgres/schema.prisma` from the SQLite schema).
- Default admin login (dev only): the email + password in your local `.env` (`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`). The local `.env` was generated with random secrets; it is git-ignored. Never commit it.
- Env variable names (values in `.env.example`): `NODE_ENV`, `PORT`, `PUBLIC_SITE_URL`, `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CSRF_SECRET`, `COOKIE_DOMAIN`, `CORS_ORIGINS`, `STORAGE_DRIVER`, `S3_*` / `CLOUDINARY_*`, `MAIL_DRIVER`, `SMTP_*`, `RESEND_API_KEY`, `MAIL_FROM`, `INQUIRY_NOTIFY_TO`, `TURNSTILE_SECRET` (optional), `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `LOG_LEVEL`.

## 4. Architecture Notes
### Folder structure
- `apps/web/src/entry-client.tsx` — hydrates, restores Query cache from `window.__RQ_STATE__`.
- `apps/web/src/entry-server.tsx` — `render(url, ctx)`: matches routes, runs loaders/prefetch, streams HTML, returns status/redirect + helmet context.
- `apps/web/src/routes/` — public route tree (`/:lang(en|ar)/...`) + lazy `admin` tree.
- `apps/web/src/pages/` — page components (public); `apps/web/src/admin/` — admin app (lazy, client only).
- `apps/web/src/components/` — `ui/` (shadcn primitives), `layout/` (Navbar, Footer, QuoteBand, WhatsAppFab, MobileCtaBar), `sections/` (Home/About blocks), `machinery/` (animated SVG icons, divider), `seo/` (Seo, JsonLd, Breadcrumbs).
- `apps/web/src/hero/` — hero scene, layers, timeline builder; `apps/web/src/config/hero.ts` — swap point.
- `apps/web/src/lib/` — rAF scheduler, motion prefs, device tier, api client wiring, i18n setup.
- `apps/web/src/locales/{en,ar}/` — UI-chrome strings only (buttons, labels). All business content comes from the DB.
- `apps/server/src/app.ts` — Express app (security middleware, API, SSR handler); `src/ssr/` — Vite dev middleware / prod renderer, template injection; `src/modules/<module>/` — router + service + controller per resource; `src/middleware/` — auth, rbac, csrf, validate, error, redirects, rate limits; `src/lib/` — prisma, logger, mailer, storage adapters, seo builders (sitemap, robots, JSON-LD).
- `packages/shared/src/` — `schemas/` (Zod per entity, inquiry, auth, settings, seo), `types/`, `constants/` (locales, emirates, roles, statuses), `api/` (typed fetch client + response envelope).
- `prisma/` — `schema.prisma`, `migrations/`, `seed.ts` (+ `seed-data/` EN+AR JSON).
- `docs/` — `PLAN.md` (architecture plan), `SESSION_ARCHIVE.md` (old session logs).

### SSR flow
1. Request → Express: security headers → redirect middleware (DB `Redirect`, cached) → `/api/*`, `/sitemap.xml`, `/robots.txt`, `/uploads`, static assets → SSR catch-all.
2. SSR handler (public routes only; `/admin*` returns the client-only shell with `noindex`): creates a per-request `QueryClient`, calls `entry-server.render(url)` which resolves the matched route's `prefetch(queryClient, params)` functions **in-process** (calls service layer directly, no HTTP hop).
3. Renders with `renderToPipeableStream` inside `HelmetProvider`; waits for `onAllReady` for bots + first paint consistency, injects helmet head tags, `<html lang dir>`, dehydrated query state, preload links into `index.html` template.
4. Status codes: route `notFound` → 404 (and `NotFoundLog` upsert), loader redirects → 301/302, gone → 410.
5. Client: `hydrateRoot` with the same router + hydrated QueryClient; all `window`/GSAP/Lenis work runs only in effects.

### API overview & auth/RBAC
- Envelope: `{ ok: true, data, meta? }` / `{ ok: false, error: { code, message, details? } }`; pagination `?page&pageSize`, filters per resource; ETag on GETs.
- Public `GET /api/public/{settings,pages/:slug,services,services/:slug,equipment,equipment/:slug,fleet,clients,testimonials,projects,blog,blog/:slug,faqs}`, `POST /api/public/inquiries`, `GET /api/public/track/:id` (stub).
- Admin `/api/admin/*`: auth (`login`, `refresh`, `logout`, `me`), CRUD per module, `media`, `seo/*`, `redirects`, `not-found-log`, `users`, `audit-log`, `inquiries` (+ CSV export).
- Auth: bcrypt hashes; short-lived access JWT (15m) + rotating refresh JWT (7d, hashed in DB) in httpOnly cookies; CSRF double-submit header `x-csrf-token` on mutating requests. RBAC: SUPER_ADMIN all; EDITOR content + media + inquiries; SEO_MANAGER SEO/redirects/robots/sitemap + read content. Every mutation → `AuditLog`.

### Hero animation architecture
- `HeroScene` renders SVG/WebP layers (sky, skyline, port cranes, ground, reach stacker + container, forklift, truck) or a video, selected by `config/hero.ts` (overridable by admin Hero manager setting).
- Intro timeline (~1.8s, GSAP): eyebrow → H1 lines clip-mask rise → CTAs/badges.
- Scroll timeline: pinned section (~300vh), ScrollTrigger `scrub` drives one GSAP timeline (lift → load → depart → pull back). Video mode: single shared rAF loop eases `currentTime` toward the scroll target (`cur += (target - cur) * 0.2`), seeks only when not `seeking`; never play/pause.
- Device tier (`lib/deviceTier.ts`): low tier (≤4 cores, saveData, < 768px) → fewer layers, no parallax, shorter scroll. Reduced motion → static frame + fade.
- H1 is real server-rendered HTML; GSAP/ScrollTrigger dynamically imported in `useEffect`.

### i18n / RTL
- Routes prefixed `/en` and `/ar`; `/` → 302 to default language (admin setting) based on `Accept-Language`.
- `<html lang dir>` set in SSR; Tailwind logical utilities (`ms-/me-/ps-/pe-/start-/end-`), `rtl:` variants for mirrored icons/animations (direction multiplier `dir === 'rtl' ? -1 : 1` passed to GSAP).
- Content stored per locale in DB (`content` JSON keyed `{ en: {...}, ar: {...} }`, validated by shared Zod); UI chrome strings in `locales/*.json`; hreflang en/ar/x-default on every public page.

## 5. Design System
- **Colours (CSS vars, admin-editable)**: `--navy #0B1B3A` (primary dark), `--yellow #FFC62B` (CTA/accent), `--blue #2F63FF` (secondary), `--offwhite #F4F7FB`, `--ink #0A0B0C`; derived tints via Tailwind `rgb(var(--x) / <alpha>)`.
- **Fonts (self-hosted woff2, `font-display: swap`, preloaded)**: Display = Anton (uppercase, tight tracking); Body = Inter; Arabic = IBM Plex Sans Arabic (display + body in AR).
- **Spacing**: 8px grid; container max-width 1280px; section padding 96–160px desktop, 64px mobile.
- **Radius**: cards 24px (`rounded-3xl`), hero frame/large containers 32px; pills fully rounded.
- **Buttons**: primary = yellow pill + navy text + chevron icon (chevron mirrors in RTL); secondary = glass/outline pill; focus ring 2px blue offset.
- **Cards**: soft shadow, image cards with gradient overlay, big condensed heading, pill CTA at the bottom; equipment cards on soft gradient with hover tilt (transform only).
- **Surfaces**: navy sections with blueprint grid / topographic SVG accents; floating glass pill navbar.
- **Animation rules**: animate only `transform` and `opacity`; `will-change` only during animation, removed after; one shared rAF loop for scroll-linked work; passive listeners, throttled resize, batched reads/writes; reveals run once via IntersectionObserver and stay; only subtle ambient loops; `prefers-reduced-motion` → fades only, Lenis off.
- Breakpoints tested: 360, 768, 1024, 1440, 1920.

## 6. Coding Conventions
- TypeScript strict everywhere; no `any` (use `unknown` + Zod). Shared request/response types come from `packages/shared` only.
- Naming: components `PascalCase.tsx`, hooks `useX.ts`, utils `camelCase.ts`, Zod schemas `xSchema` + inferred `type X`. Server files `x.router.ts`, `x.service.ts`, `x.controller.ts`.
- Imports: `@shared/*` (packages/shared), `@/` (apps/web/src), `@server/*` (apps/server/src).
- Comments only where non-obvious (animation math, SSR quirks, security choices).
- **Add a public page**: create `pages/X.tsx` + route entry with `prefetch()` + Seo usage (route key) → add SEO defaults in seed → add to sitemap builder.
- **Add an API route**: Zod schema in `packages/shared/src/schemas` → `modules/x/x.service.ts` (Prisma) → `x.router.ts` with `validate()` + `requireRole()` → register in `api/index.ts` → document in OpenAPI registry → add typed client fn.
- **Add a Prisma model**: edit `prisma/schema.prisma` (portable types only: no native enums/arrays — use `String` + shared constants, `Json` for localized content) → `npm run db:migrate -- --name x` → seed data → shared schema.
- **Add an admin module**: shared schema → server CRUD module → `admin/modules/x/` (List with TanStack Table, Form with RHF + Zod, EN/AR tabs) → nav entry with allowed roles.
- Never hard-code content the admin should control; UI chrome strings go in locale files.

## 7. Progress Tracker
Status: [ ] not started / [~] in progress / [x] done (runs, typechecks, builds)

- [x] **Step 1: Monorepo, DB, auth, design system** (2026-11-19)
  - [x] npm workspaces, tsconfig base, ESLint 9 flat config/Prettier, scripts
  - [x] Prisma schema + first migration `init` (SQLite dev; Postgres schema generator ready, not yet run against a real Postgres)
  - [x] Seed script (EN + AR demo data, admin from env, SEO defaults for 41 entities × 2 locales), idempotent
  - [x] Auth (login/refresh/logout/me/csrf, bcrypt, JWT access cookie + rotating opaque refresh, CSRF, RBAC), 13 tests passing
  - [x] Tailwind tokens, self-hosted fonts, Button + Container/Section/Heading/Card/GlassCard, dev styleguide checked at 1440 + 360, EN + AR
- [x] **Step 2: Express API + SSR pipeline (proven on one page)** (2026-11-20)
  - [x] Security middleware (helmet CSP/HSTS/frame-deny/referrer, cors allow-list, compression br/gzip, hpp, pino-http), error handler, envelope, strong ETag + 304
  - [x] Public API endpoints (all listed in brief §10) incl. inquiries POST (honeypot + rate limit + Zod) and tracking stub
  - [x] Vite SSR dev (middleware) + prod (built bundle) renderer, Query dehydration, Helmet head injection, theme CSS vars from DB
  - [x] Status codes: 404 (unknown/invalid-lang routes, logged to NotFoundLog), 301/302/410 from DB redirects, `/` → 302 by Accept-Language
  - [x] Swagger `/api/docs` (+ `/api/docs.json`)
- [x] **Step 3: Layout, navbar, footer** (2026-11-20): react-i18next per request, glass pill navbar (hide on scroll via shared rAF loop) + EN/AR switcher + Radix mobile menu, footer with quote band/wordmark/branches/hours/licence/TRN, WhatsApp FAB, mobile CTA bar, cookie consent (analytics only after consent), CSS-only preloader (session cookie `pl`), Lenis smooth scroll
- [x] **Step 4: Hero animation** (2026-11-20): layered SVG scene (`apps/web/src/hero/HeroScene.tsx`), CSS intro (clip-mask line rise, ≤1.8 s, no JS), GSAP ScrollTrigger pinned scrub (hoist → travel → load → truck departs → pull back, parallax on high tier), scroll-scrubbed video mode (eased currentTime in the shared rAF loop), device tiers, reduced motion = static frame + fades. Swap point `apps/web/src/config/hero.ts`; QA override `?motion=force`
- [x] **Step 5: Pages** (2026-11-20; photos pending, see Known Issues)
  - [x] Home (hero, client marquee, services, divider, featured equipment, logistics/courier split, why-us stats count-up, process, projects, testimonials carousel, FAQ + FAQPage JSON-LD)
  - [x] About (story, mission/vision, stats, values, milestones, team)
  - [x] Services index + detail (features, use cases, related equipment, FAQs, Service JSON-LD, quote form)
  - [x] Equipment catalog (URL-driven filters, SSR) + detail (spec table, gallery, Product/Offer JSON-LD, quote pre-fill)
  - [x] Logistics & Courier (fleet types, schematic UAE/GCC lanes map, booking form, tracking widget)
  - [x] Contact (multipart inquiry form with file upload, WhatsApp/phone, offices, hours, embedded map)
  - [x] Projects / Clients (index + case study)
  - [x] Blog index + post (Article JSON-LD, sanitised HTML)
  - [x] Legal (privacy, terms), credits page, 404
- [x] **Step 6: Admin panel** (2026-11-20) at `/admin` (client-only, noindex, own lazy chunk)
  - [x] Login + shell + RBAC-aware nav (Super Admin / Editor / SEO Manager), silent token refresh
  - [x] Dashboard (new inquiries, quotes 30d, latest inquiries, recent activity, SEO health)
  - [x] Company information (names/tagline/about EN+AR, logos, favicon, phones, WhatsApp, emails, branches + coords, hours, social, licence/TRN, default language), theme colours, navbar + footer
  - [x] Page/content editor (title/intro per page; sections as EN/AR JSON with draft → publish)
  - [x] Hero manager (mode vector/video, video URLs, poster, background photo, headline lines, CTAs, badges, intensity)
  - [x] CRUD via one generic factory + field configs: Services, Equipment (+ gallery), Equipment categories, Fleet, Clients, Testimonials, Projects, Team, FAQs, Blog (TipTap, sanitised), Redirects
  - [x] Media library (sharp → WebP + AVIF at 480/960/1600/max, metadata stripped, alt text required EN+AR, SVG rejected)
  - [x] Inquiries inbox (filters, status, notes, CSV export with formula-injection guard, private attachment download)
  - [x] Users & roles (create, role change, deactivate, reset password; sessions revoked on change; no self-demotion)
  - [x] Audit log (every write, with before/after on updates)
  - **SEO Manager**
  - [x] Per-page/item meta (title, description with live counters, focus keyword, canonical, robots, OG, Twitter) per language
  - [x] Live Google preview (desktop/mobile) + social share preview
  - [x] SEO score/checklist (keyword in title/H1/first paragraph/URL/description, lengths, H1, headings, alt coverage, internal links, word count, readability) with fix hints
  - [x] JSON-LD: automatic per page type + manual override field
  - [x] sitemap.xml (both languages, hreflang en-AE/ar-AE/x-default, lastmod; noindex + unpublished excluded) + robots.txt from the admin setting with the sitemap line appended
  - [x] Redirect manager (301/302/410, hit counts, cache invalidation) + 404 log with closest-path suggestions and one-click redirect
  - [x] Global SEO settings (title template, default OG image, Google/Bing verification, GA4/GTM/Pixel IDs, custom head/body code with warning)
  - [x] Bulk SEO table with inline title/description editing and re-score
- [x] **Step 7: SEO/technical pass** (2026-11-20): dynamic `/sitemap.xml` + `/robots.txt`; JSON-LD per page type (Organization/LocalBusiness + AggregateRating, WebSite, BreadcrumbList, Service, Product/Offer, FAQPage, Article) + manual override; per-item OG image picker; favicon from settings (`apps/web/public/favicon.svg` fallback); latin font preloads in prod SSR; CSP allows GA4/GTM/Meta/Turnstile origins (scripts load only after consent); custom head/body code injected only after consent; optional Cloudflare Turnstile (`TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET`)
- [x] **Step 8: Performance and accessibility audit** (2026-11-20): Lighthouse 100/100/100 (Accessibility/Best Practices/SEO) on home EN (mobile + desktop), home AR, contact, equipment detail; LCP 378 ms / CLS 0.00 (local, unthrottled trace); fixed contrast (WhatsApp green, footer wordmark), link names, label/name mismatch; README + `deploy/` (PM2, Nginx)

## 8. Current Status
- All 8 steps done and pushed to GitHub (`origin` = github.com/Mehtab-Shah21/Hafeez, branch `main`).
- Public site (EN + AR, SSR, animated hero, every page), admin panel + SEO Manager, sitemap/robots, 35 API tests, Lighthouse 100 on a11y/best-practices/SEO.
- Remaining work is content and launch: real company details, photos/video, PostgreSQL + mail + storage in production (see Next Steps).

## 9. Next Steps
1. Enter real company details in Admin → Company & site (name EN/AR, logos, phones, WhatsApp, branches, licence/TRN) and review every seeded `[Placeholder]` text.
2. Run `npm run photos:import` on a machine with internet (or upload your own photos), then review each stand-in in Admin → Media.
3. Production: PostgreSQL (`db:deploy:pg` + generate the client from `prisma/postgres/schema.prisma`), SMTP/Resend, `STORAGE_DRIVER=s3|cloudinary`, real `PUBLIC_SITE_URL`; verify Postgres migrations on a real instance (untested so far).
4. Run Lighthouse Performance on the deployed site with mobile throttling (local trace only so far) and check INP on real devices.
5. Optional: replace the vector hero with a rendered scroll video; add Search Console + GA4 IDs in Admin → Global SEO.
6. Delete `apps/web/src/dev/Styleguide.tsx` before launch (dev-only already).

## 10. Decisions Log
| Date | Decision | Reason |
|---|---|---|
| 2026-11-17 | Localized content stored as `content` JSON `{en,ar}` per row, validated by shared Zod | Fewer tables than per-entity translation tables; easy EN/AR tab editing; adding a locale needs no migration |
| 2026-11-17 | SEO stored in separate `SeoMeta` rows (entityType + entityId + locale) | Spec requires per-entity + per-locale SEO; enables bulk SEO table |
| 2026-11-17 | Portable Prisma types only (no native enums / scalar lists); enums as `String` + shared constants | Same schema works on SQLite (dev) and PostgreSQL (prod) |
| 2026-11-17 | Fonts via `@fontsource` packages (Anton, Inter, IBM Plex Sans Arabic), woff2 bundled by Vite | Self-hosted, hashed, preloadable, no Google Fonts request |
| 2026-11-17 | SSR prefetch calls the service layer in-process (not HTTP) | No extra network hop; single source of data logic |
| 2026-11-17 | CSRF via double-submit cookie + `x-csrf-token` header | `csurf` is deprecated; works with cookie-based JWT |
| 2026-11-17 | Project design skills installed in `.claude/skills/`: emilkowalski/skills (20 skills, @64eb3de), impeccable (@d41d986), taste-skill `design-taste-frontend` (@f6b7657) | User requested; use for UI/animation work. Where they conflict with the brief, the brief wins, except for photography (see next row). Impeccable's launcher downloads a checksum-verified engine binary on first run; its repo hooks/settings were not installed |
| 2026-11-17 | **Real stand-in photographs instead of SVG placeholders** (user decision), sourced with taste-skill `scripts/photos.mjs search` from Wikimedia Commons (CC0 / CC BY / CC BY-SA / public domain only, ≥1600px). Each is checked full size: no readable brand names or logos, no identifiable faces presented as staff or customers. Downloaded and self-hosted (sharp → AVIF/WebP), never hotlinked. One footer credit line + `/credits` page. Every stand-in is listed in §12 | User asked for real photographs per taste-skill; licensed + credited keeps the brief's "no copyrighted images" rule |
| 2026-11-17 | Hero = animated vector machinery (crane, container, forklift, truck) layered over a real port/skyline photo background | User choice; keeps the scroll storytelling and adds photographic realism |
| 2026-11-19 | Versions: React 18.3, Vite 6, TS 5.6, Tailwind 3.4, Prisma 6, Express 4.21, Zod 3, ESLint 9 | Stable, match the brief (Tailwind 3 keeps `tailwind.config.ts`) |
| 2026-11-19 | bcryptjs instead of native bcrypt | No native build step on Windows/CI; same hash format |
| 2026-11-19 | Refresh tokens are opaque random strings (SHA-256 hashed in DB), not JWTs; rotation with family revocation on reuse | They are looked up in the DB anyway; a DB leak cannot be replayed |
| 2026-11-19 | Login also requires CSRF (client calls `GET /api/admin/auth/csrf` first); login rotates the CSRF token and returns it as `csrfToken` | Prevents login CSRF; rotate on privilege change |
| 2026-11-19 | Postgres via generated `prisma/postgres/schema.prisma` (+ own migrations) from the SQLite schema | Prisma cannot switch provider by env; one source of truth |
| 2026-11-19 | Custom CSS classes never start with `bg-`/`text-` etc. (e.g. `blueprint-grid`) | tailwind-merge treats them as utilities and drops real ones (bug found: navy bg vanished) |
| 2026-11-19 | Numbers with suffixes (350+) render inside `dir="ltr"` in RTL | Otherwise bidi shows "+350" in Arabic |
| 2026-11-19 | Brief overrides impeccable defaults for the hero eyebrow and the glass navbar | User's brief explicitly asks for both |
| 2026-11-20 | Locale tags `en-AE` / `ar-AE` for `<html lang>`, hreflang and og:locale; URL prefixes stay `/en` and `/ar` | User asked for English + Arabic (UAE) |
| 2026-11-20 | One `PublicDataSource` contract (shared): server implements it in-process for SSR, browser over HTTP; same TanStack Query keys | SSR without an HTTP hop; hydration reuses the cache (verified: no API calls after load) |
| 2026-11-20 | Loaders only `ensureQueryData` and return null; SSR waits for `onAllReady` and renders to a buffer before sending | Crawlers always get complete HTML; Helmet head must be known before the response starts |
| 2026-11-20 | SSR state in `<script type="application/json" id="__STATE__">` (escaped), router hydration data passed manually; no inline JS | Prod CSP is `script-src 'self'` with no nonces needed |
| 2026-11-20 | Admin URLs get a client-only shell with `noindex,nofollow` | Brief: admin is CSR-only and not indexed |
| 2026-11-20 | `react-helmet-async` bundled into the SSR build (`ssr.noExternal`) | Its CommonJS build breaks Node ESM named imports |
| 2026-11-20 | Tailwind config path and `content.relative` set explicitly | In dev, Vite runs inside Express with cwd = repo root |
| 2026-11-20 | Git author for this repo = `Mehtab-Shah21 <Mehtab-Shah21@users.noreply.github.com>` (repo-local config); `.claude/settings.local.json` git-ignored | Keeps the user's personal email out of public commits; local hook settings are machine-specific |
| 2026-11-20 | Preloader is pure CSS, server-rendered only when session cookie `pl` is absent | Works without JS, never hides SSR content from crawlers, no inline script for sessionStorage checks |
| 2026-11-20 | Language switch uses a full document load (`reloadDocument`) | Re-creates i18n, dir and SSR head cleanly in the other language |
| 2026-11-20 | Hero intro in CSS keyframes, scroll storytelling in GSAP (lazy) | Intro starts at first paint without JS and never flashes; GSAP stays out of the critical path |
| 2026-11-20 | RTL hero mirrors the whole SVG (`rtl:-scale-x-100`) | Movement direction mirrors automatically; no per-tween direction maths |
| 2026-11-20 | Section reveals use IntersectionObserver + CSS transitions; Framer Motion (LazyMotion/domAnimation) only for the testimonial carousel | Keeps the home bundle small; SSR HTML stays visible without JS |
| 2026-11-20 | Equipment filters live in the URL (`?category&min&max&operator`) | Filtered views are shareable and server-rendered with the same query keys |
| 2026-11-20 | Inquiry attachments stored in `uploads-private/` (never served), downloaded via the admin API | Customer files are not public |
| 2026-11-20 | Cards without photos render a machinery illustration on a gradient | No broken/empty images while stock or client photos are pending |
| 2026-11-20 | Admin CRUD = one server factory (`crudRouter`) + one client form renderer driven by per-module field configs validated by the shared Zod schemas | 12 modules with identical behaviour, validation and auditing; adding a module is a config entry |
| 2026-11-20 | Section content edited as EN/AR JSON with draft/publish | Sections have different shapes per type; JSON keeps every section editable without a bespoke form each |
| 2026-11-20 | Public pages are lazy route chunks (React Router `lazy`), matched chunks resolved before `hydrateRoot` | Home route JS dropped from 223 kB to ~176 kB gzip |
| 2026-11-20 | Push to GitHub after every completed step (user instruction) | — |
| 2026-11-19 | GateGuard (ECC plugin) exempted for `apps/**, packages/**, prisma/**, scripts/**, docs/**` via `.claude/settings.local.json` env | User approved; it was blocking every first file write. Destructive-shell checks stay on |

## 11. Known Issues / TODO
- Photos: none imported yet (sandbox blocks Wikimedia). Run `npm run photos:import` (added in Step 6) on a machine with internet, or upload photos in Admin → Media. Until then cards show machinery illustrations.
- Photo fetching needs network access to `commons.wikimedia.org` and `upload.wikimedia.org`. The sandboxed shell currently can't reach them, so the user must allow it before Step 5, or supply photos themselves.
- Company name, tagline, city, licence/TRN, phone, addresses are placeholders until supplied (seeded into DB, editable in admin).
- Courier tracking (`GET /api/public/track/:id`) will be a stub returning demo data.
- Watch mode restart loop: `tsx watch` / `node --watch` restart the server every 1–2 s on this Windows machine (cause not found), so `npm run dev` runs without watch. `npm run dev:watch` exists but may loop. Web/SSR code is reloaded by Vite regardless.
- The styleguide (`apps/web/src/dev/`, route `/__styleguide`) is dev-only (tree-shaken in prod); delete it before launch.
- UI chrome strings live in `apps/web/src/locales/ui.ts` until react-i18next is set up in Step 3.
- Inquiry email: wired (SMTP or Resend via `MAIL_DRIVER`); without mail settings it logs instead of sending.
- Custom head/body code from the admin runs after consent, but inline `<script>` blocks are stopped by the CSP (`script-src 'self'` + listed vendors). Vendors that need inline snippets must be added to the CSP in `apps/server/src/app.ts`.
- Prod CSP has no analytics/Maps script origins yet (Step 7, after cookie consent).
- Postgres path (`db:migrate:pg`) is untested until a Postgres instance is available.
- Seed testimonials, team members and company details are clearly marked placeholders (`[Name]`, `[COMPANY NAME]`, `+971 … 0000`).
- Inter's woff2 ships all subsets (latin-ext, cyrillic, greek, vietnamese); browsers only download what a page uses (unicode-range), but trim the imports in Step 8 if Lighthouse flags it.

## 12. Assets to Replace
- Hero: `apps/web/src/hero/HeroScene.tsx` is a placeholder vector scene. Replace with a rendered video (`config/hero.ts` → `video.src/srcMobile/poster`, or admin Hero manager) and/or a real port/skyline photo (`backgroundImage`).
- Logo mark: placeholder SVG in `apps/web/src/components/layout/Logo.tsx` until a logo is uploaded in the admin.
_Filled as placeholders are created. Licensed Wikimedia Commons stand-in photos will be listed here one by one (file, licence, author, the shot to take instead). Expected:_
- Hero video (MP4/WebM 1080p + 720p) + poster, or real PNG/WebP layers → `apps/web/src/config/hero.ts` / admin Hero manager.
- Company logos (light/dark), favicon, OG default image.
- Equipment cutout photos (12+), fleet/truck photos (6), project photos (4), team photos, testimonial avatars.
- Client/partner logos (12 placeholders "Client 1…12").
- Certification badges (only real, held certifications).
- All demo copy, addresses, phone numbers, Trade Licence / TRN.

## 13. Audit Results
- **2026-11-20 (Step 8, prod build, Lighthouse via Chrome DevTools MCP):**
  - Accessibility / Best Practices / SEO = 100 / 100 / 100 on `/en` (mobile + desktop), `/ar` (mobile), `/en/contact` (mobile), `/en/equipment/mobile-crane-50t` (mobile).
  - Performance trace (local, no throttling): LCP 378 ms (TTFB 69 ms), CLS 0.00. The Lighthouse Performance category was not available in this tool; re-run on the deployed site with mobile throttling.
  - Bundles (gzip): entry JS 139.5 kB + Home chunk 33.0 kB + shared 3.3 kB ≈ 176 kB for the home route (budget 180 kB); CSS 10.7 kB; admin chunk 41.9 kB (+ TipTap 109 kB only in the blog editor), never loaded on public pages.
  - Tests 35/35, typecheck ✓, lint ✓, build ✓.
- **2026-11-20 (Step 2, prod build on :3100, checked with fetch from the browser because the sandbox blocks curl to localhost):**
  - `/` → 302 by Accept-Language. `/en` 200, 25 kB HTML, exactly 1 H1 "Moving the weight of the UAE forward", title "Crane Rental Dubai, Logistics & Courier UAE | [COMPANY NAME]"; description, canonical, hreflang en-AE/ar-AE/x-default, og:*, JSON-LD (Organization+LocalBusiness, WebSite), theme `<style>` and `__STATE__` all present in raw HTML.
  - `/ar` → `<html lang="ar-AE" dir="rtl">`, Arabic title and canonical `/ar`.
  - 404: `/en/does-not-exist`, `/xx`, `/fr/about`, `/api/nope`. `/admin` 200 with `noindex,nofollow`.
  - Headers: CSP `script-src 'self'`, HSTS (prod), X-Frame-Options DENY, Referrer-Policy strict-origin-when-cross-origin, `Content-Encoding: br`, HTML `no-cache`, hashed assets `max-age=31536000, immutable`, API `max-age=60, stale-while-revalidate=600` + ETag (304 tested).
  - Client JS 359.9 kB (113.1 kB gzip) incl. React, Router, Query, Helmet: under the 180 kB budget. No hydration warnings; no API refetch after load.
  - Tests 24/24, typecheck ✓, lint ✓, build ✓.
- **2026-11-19 (Step 1 baseline):** typecheck ✓, lint ✓ (0 problems), build ✓, tests 13/13 ✓. Web bundle (styleguide stripped in prod): JS 143.6 kB (46.1 kB gzip, mostly React), CSS 20.1 kB (5.0 kB gzip). Built server answers `/healthz` 200 and `/api/admin/auth/me` 401. No Lighthouse/SSR checks yet (Step 2+).

## 14. Session Log
- **2026-11-20** — Step 8 done: Lighthouse audits and fixes (contrast, link names, accessible names), README, `deploy/ecosystem.config.cjs`, `deploy/nginx.conf`. All steps complete; see Next Steps for launch tasks.
- **2026-11-20** — Step 7 done: `apps/server/src/modules/seo/seo-files.router.ts`, CSP update in `app.ts`, OG image resolution in `public.service.ts`/`mappers.ts`, Turnstile (server + `InquiryForm`), consent-gated custom code (`CookieConsent.tsx`), favicon, AggregateRating, font preloads (`ssr.ts`). Checked on the prod build: sitemap 68 URLs with alternates, robots, preloads, JSON-LD types per page.
- **2026-11-20** — Step 6 done: server `apps/server/src/modules/admin/*` (crud factory, content, settings, media/sharp, inquiries/users/audit/dashboard, SEO with `lib/seo/{entities,score}.ts`), `apps/server/scripts/import-photos.ts` (`npm run photos:import`); web `apps/web/src/admin/*`. Route-level code splitting (React Router `lazy`, resolved before hydration). 35 tests pass; admin checked in browser (login, dashboard, service + SEO panel save, company settings save, equipment save).
- **2026-11-20** — Step 5 done: pages (`apps/web/src/pages/{About,Services,Equipment,Logistics,Contact,Content}.tsx`, Home rebuilt), `components/{cards,Testimonials,logistics}.tsx`, `components/forms/InquiryForm.tsx`, `components/ui/blocks.tsx`, `components/machinery/icons.tsx`; server: team/credits endpoints, multipart inquiries (private `uploads-private/`), Nodemailer/Resend mailer, storage adapter (local/S3/Cloudinary), sanitize-html. 26 tests pass; every page SSR-checked (1 H1, title, JSON-LD, 404s).
- **2026-11-20** — Step 4 done: `hero/{Hero,HeroScene,useHeroScroll,useScrollVideo}.tsx`, `config/hero.ts`, hero CSS keyframes; Vite HMR now shares the app port (`createSsrHost(httpServer)`). Verified pin + sequence at 1440 with `?motion=force` (the browser pane runs with reduced motion on).
- **2026-11-20** — Step 3 done: `apps/web/src/locales/{en,ar}.ts`, `lib/{i18n,raf,motion,links}.ts`, `data/request.tsx`, `components/layout/*`, `components/motion/SmoothScroll.tsx`, LangLayout, entries, SSR preloader cookie. Checked desktop EN + mobile AR (menu, CTA bar).
- **2026-11-20** — Step 2 built, verified and pushed. Pushed Step 1 first (commit `991ed98`). Files: `packages/shared/src/api/public.ts` (DTOs, PublicDataSource, SSR contract, LOCALE_TAGS), `apps/server/src/{app.ts,index.ts}`, `modules/public/*`, `middleware/redirects.ts`, `ssr/ssr.ts`, `openapi/docs.ts`, `test/public.test.ts`, `apps/web/src/{entry-client,entry-server,routes}.tsx`, `data/*`, `lib/api.ts`, `pages/*`, `components/seo/*`, `locales/ui.ts`, vite/postcss/tailwind config tweaks, `.claude/launch.json`. Left: Step 3 onward.
- **2026-11-19** — Step 1 built and verified. Files: root config (`package.json`, `tsconfig.base.json`, `eslint.config.js`, `.env.example`, `.gitignore`, `.prettierrc`), `packages/shared/src/**` (constants, Zod schemas, envelope), `prisma/schema.prisma` + `migrations/` + `seed.ts` + `seed-data/*`, `scripts/prisma-postgres.mjs`, `apps/server/src/**` (env, prisma, logger, errors, middleware auth/rbac/csrf/validate/errorHandler, modules auth + users, `createApp`), `apps/server/test/**`, `apps/web/**` (vite, tailwind, globals.css, Button, primitives, dev styleguide), `.claude/launch.json`. `git init` done, nothing committed. Left: Step 2 onward.
- **2026-11-19** — Ran `npx impeccable install` (user request). Updated the impeccable skill to v4.10.0, added 5 agents in `.claude/agents/impeccable-*`, put the engine binary v0.1.27 in `~/.impeccable/bin/`, and added design-check hooks in `.claude/settings.local.json` (SessionStart, PostToolUse on Edit/Write, Stop deep pass).
- **2026-11-17** — Switched imagery to licensed, credited real stand-in photos (Wikimedia Commons, via taste-skill). A test search failed because the sandbox has no network access, so the downloads are deferred to page building.
- **2026-11-17** — Installed design skills into `.claude/skills/` (emilkowalski/skills, impeccable, taste-skill) from their GitHub repos after checking their contents. Left: plan confirmation, then Step 1.
- **2026-11-17** — Created `CLAUDE.md` (sections 1–14) and `docs/PLAN.md` (architecture plan). Files: `CLAUDE.md`, `docs/PLAN.md`. Left: everything from Step 1 onward, pending plan confirmation.
