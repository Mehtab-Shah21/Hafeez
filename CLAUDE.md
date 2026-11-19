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
_Verified 2026-11-19 (Step 1). `npm run dev` becomes Express + Vite SSR in Step 2; today it runs the API only._
- Requirements: Node ≥ 20 (dev machine has Node 24.13, npm 11.5), PostgreSQL 15+ for prod (SQLite file for dev).
- First run: `npm install` → copy `.env.example` to `.env` and fill the secrets + `SEED_ADMIN_PASSWORD` (12+ chars) → `npm run db:migrate -- --name init` (also seeds) → `npm run seed` (idempotent; safe to re-run).
- Dev: `npm run dev` (API on :3000) · `npm run dev:web` (Vite on :5173, dev-only styleguide). In the desktop app: preview configs `api` / `web` in `.claude/launch.json`.
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
- [ ] **Step 2: Express API + SSR pipeline (proven on one page)**
  - [ ] Security middleware, error handler, logging, envelope, ETag
  - [ ] Public API endpoints
  - [ ] Vite SSR dev + prod renderer, Query dehydration, Helmet head injection
  - [ ] Status codes (404/301/302/410), redirects middleware
  - [ ] Swagger `/api/docs`
- [ ] **Step 3: Layout, navbar, footer** (glass navbar + EN/AR switcher, footer + wordmark + quote band, WhatsApp FAB, mobile CTA bar, cookie consent, preloader)
- [ ] **Step 4: Hero animation** (vector layers, intro timeline, pinned scroll scrub, video mode, device tiers, reduced motion)
- [ ] **Step 5: Pages**
  - [ ] Home
  - [ ] About
  - [ ] Services index + detail
  - [ ] Equipment catalog + detail
  - [ ] Logistics & Courier (truck types, UAE/GCC map, booking form, tracking UI)
  - [ ] Contact
  - [ ] Projects / Clients
  - [ ] Blog index + post
  - [ ] Legal (privacy, terms) + 404
- [ ] **Step 6: Admin panel**
  - [ ] Login + shell + RBAC-aware nav
  - [ ] Dashboard
  - [ ] Company information (global settings)
  - [ ] Page/content editor (draft/publish)
  - [ ] Hero manager
  - [ ] Services CRUD
  - [ ] Equipment CRUD (+ categories)
  - [ ] Fleet CRUD
  - [ ] Clients/Partners CRUD
  - [ ] Testimonials CRUD
  - [ ] Projects CRUD
  - [ ] Team CRUD
  - [ ] FAQs CRUD
  - [ ] Blog CRUD (TipTap)
  - [ ] Media library (compress, WebP/AVIF, required alt)
  - [ ] Inquiries inbox (status, notes, CSV, email)
  - [ ] Users & roles
  - [ ] Audit log
  - **SEO Manager**
  - [ ] Per-page/item meta fields with counters (EN/AR)
  - [ ] Live SERP preview (desktop/mobile) + social preview
  - [ ] SEO score/checklist with fix hints
  - [ ] JSON-LD auto-gen + manual override
  - [ ] sitemap.xml + editable robots.txt
  - [ ] Redirect manager + 404 log with suggestions
  - [ ] Global SEO settings (title template, verification, GA4/GTM, Pixel, custom scripts)
  - [ ] Bulk SEO table with inline editing
- [ ] **Step 7: SEO/technical pass**
- [ ] **Step 8: Performance and accessibility audit**

## 8. Current Status
- Step 1 done: workspace installs, migrates, seeds, typechecks, lints, builds; 13 auth tests pass.
- Server is a minimal Express app (`apps/server/src/app.ts` `createApp()`): health, auth, users list. No public API, SSR or full security stack yet.
- Web is a Vite app with the design system and a dev-only styleguide (`apps/web/src/dev/Styleguide.tsx`, entry `src/main.tsx`), no routes/SSR yet.

## 9. Next Steps
1. Step 2: full middleware stack in `createApp()`: helmet CSP/HSTS, cors, compression, hpp, ETag, pino-http, redirects middleware.
2. Public API modules (`/api/public/*`) with service layer + envelope + pagination; inquiry POST with honeypot + rate limit.
3. Vite SSR: replace `apps/web/src/main.tsx` with `entry-client.tsx` / `entry-server.tsx`, React Router data router with `/:lang` routes, TanStack Query dehydration, Helmet head injection, theme CSS vars injected from the `theme` setting.
4. Prove SSR on Home with `curl` (H1, meta, canonical, hreflang, JSON-LD in raw HTML); 404/301/302/410 statuses.
5. Swagger `/api/docs`; then Step 3 (layout, navbar, footer).

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
| 2026-11-19 | GateGuard (ECC plugin) exempted for `apps/**, packages/**, prisma/**, scripts/**, docs/**` via `.claude/settings.local.json` env | User approved; it was blocking every first file write. Destructive-shell checks stay on |

## 11. Known Issues / TODO
- Photo fetching needs network access to `commons.wikimedia.org` and `upload.wikimedia.org`. The sandboxed shell currently can't reach them, so the user must allow it before Step 5, or supply photos themselves.
- Company name, tagline, city, licence/TRN, phone, addresses are placeholders until supplied (seeded into DB, editable in admin).
- Courier tracking (`GET /api/public/track/:id`) will be a stub returning demo data.
- `apps/web/src/main.tsx` is a temporary Step 1 entry (styleguide only in dev); replaced by SSR entries in Step 2. The styleguide (`src/dev/`) must stay dev-only.
- Postgres path (`db:migrate:pg`) is untested until a Postgres instance is available.
- Seed testimonials, team members and company details are clearly marked placeholders (`[Name]`, `[COMPANY NAME]`, `+971 … 0000`).
- Inter's woff2 ships all subsets (latin-ext, cyrillic, greek, vietnamese); browsers only download what a page uses (unicode-range), but trim the imports in Step 8 if Lighthouse flags it.

## 12. Assets to Replace
_Filled as placeholders are created. Licensed Wikimedia Commons stand-in photos will be listed here one by one (file, licence, author, the shot to take instead). Expected:_
- Hero video (MP4/WebM 1080p + 720p) + poster, or real PNG/WebP layers → `apps/web/src/config/hero.ts` / admin Hero manager.
- Company logos (light/dark), favicon, OG default image.
- Equipment cutout photos (12+), fleet/truck photos (6), project photos (4), team photos, testimonial avatars.
- Client/partner logos (12 placeholders "Client 1…12").
- Certification badges (only real, held certifications).
- All demo copy, addresses, phone numbers, Trade Licence / TRN.

## 13. Audit Results
- **2026-11-19 (Step 1 baseline):** typecheck ✓, lint ✓ (0 problems), build ✓, tests 13/13 ✓. Web bundle (styleguide stripped in prod): JS 143.6 kB (46.1 kB gzip, mostly React), CSS 20.1 kB (5.0 kB gzip). Built server answers `/healthz` 200 and `/api/admin/auth/me` 401. No Lighthouse/SSR checks yet (Step 2+).

## 14. Session Log
- **2026-11-19** — Step 1 built and verified. Files: root config (`package.json`, `tsconfig.base.json`, `eslint.config.js`, `.env.example`, `.gitignore`, `.prettierrc`), `packages/shared/src/**` (constants, Zod schemas, envelope), `prisma/schema.prisma` + `migrations/` + `seed.ts` + `seed-data/*`, `scripts/prisma-postgres.mjs`, `apps/server/src/**` (env, prisma, logger, errors, middleware auth/rbac/csrf/validate/errorHandler, modules auth + users, `createApp`), `apps/server/test/**`, `apps/web/**` (vite, tailwind, globals.css, Button, primitives, dev styleguide), `.claude/launch.json`. `git init` done, nothing committed. Left: Step 2 onward.
- **2026-11-19** — Ran `npx impeccable install` (user request). Updated the impeccable skill to v4.10.0, added 5 agents in `.claude/agents/impeccable-*`, put the engine binary v0.1.27 in `~/.impeccable/bin/`, and added design-check hooks in `.claude/settings.local.json` (SessionStart, PostToolUse on Edit/Write, Stop deep pass).
- **2026-11-17** — Switched imagery to licensed, credited real stand-in photos (Wikimedia Commons, via taste-skill). A test search failed because the sandbox has no network access, so the downloads are deferred to page building.
- **2026-11-17** — Installed design skills into `.claude/skills/` (emilkowalski/skills, impeccable, taste-skill) from their GitHub repos after checking their contents. Left: plan confirmation, then Step 1.
- **2026-11-17** — Created `CLAUDE.md` (sections 1–14) and `docs/PLAN.md` (architecture plan). Files: `CLAUDE.md`, `docs/PLAN.md`. Left: everything from Step 1 onward, pending plan confirmation.
