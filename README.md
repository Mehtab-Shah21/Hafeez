# UAE Heavy Equipment, Logistics & Courier Website

Bilingual (English + Arabic, UAE) marketing site with server-side rendering, a cinematic animated hero, and a full admin panel with an SEO manager. One Node process serves the API, the server-rendered pages and the static assets.

- **Frontend:** React 18, TypeScript, Vite, Tailwind, React Router (data routers), TanStack Query, react-i18next, GSAP + ScrollTrigger, Lenis, Framer Motion, React Hook Form + Zod, TipTap (admin)
- **Backend:** Express, Prisma (SQLite for development, PostgreSQL for production), JWT cookie auth with CSRF and roles, sharp image pipeline, Nodemailer/Resend
- **Layout:** `apps/web` (site + admin), `apps/server` (API + SSR host), `packages/shared` (Zod schemas, types, constants), `prisma` (schema, migrations, seed)

Project memory, decisions and progress live in [`CLAUDE.md`](CLAUDE.md).

## Quick start (development)

Requirements: Node 20+ (tested on 24), npm 10+.

```bash
npm install
cp .env.example .env        # then fill in the secrets (see below)
npm run db:migrate -- --name init   # creates prisma/dev.db and seeds it
npm run dev                 # http://localhost:3000  → redirects to /en or /ar
```

Fill in `.env` before migrating:

- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CSRF_SECRET`: 32+ random characters each. Generate with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
- `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` (12+ characters): the first Super Admin account. There is no default password.

Then sign in at **http://localhost:3000/admin**.

| Command | What it does |
|---|---|
| `npm run dev` | Express + Vite middleware (SSR in dev). Web code reloads per request; restart after server code changes (or `npm run dev:watch`). |
| `npm run build` | Builds shared → web (client + SSR bundles) → server |
| `npm start` | Runs the production server (`NODE_ENV=production`) |
| `npm test` | API tests (Vitest + Supertest) on a throwaway SQLite DB |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript across the monorepo |
| `npm run seed` | Re-runs the idempotent seed (never overwrites admin edits) |
| `npm run photos:import` | Imports licensed stand-in photos from Wikimedia Commons (needs internet) |
| `npm run db:migrate:pg` / `db:deploy:pg` | PostgreSQL migrations (schema generated from the SQLite one) |

## Editing content (no code needed)

Everything visible on the site comes from the database and is edited at `/admin`:

- **Company & site:** name, tagline, logos, favicon, phones, WhatsApp, emails, branches with map coordinates, working hours, social links, Trade Licence/TRN, theme colours, menu and footer. All text is in English and Arabic.
- **Pages:** titles, intros and sections (EN/AR). Section edits are saved as drafts; press **Publish** to go live.
- **Hero:** headline lines, subtitle, buttons, badges, animation intensity, background photo, or a scroll-scrubbed video.
- **Content:**
  - Services, equipment (with photo gallery and spec table), categories and fleet
  - Clients, testimonials, projects, team and FAQs
  - Blog (rich text editor)
- **Media:** uploads are converted to WebP + AVIF in several sizes. Alt text is required in both languages.
- **Inquiries:** every form submission with status, notes, attachments and CSV export. New inquiries are also emailed to `INQUIRY_NOTIFY_TO`.
- **SEO:**
  - Per page/item: title, description, keyword, canonical, robots, Open Graph, with Google and social previews and a scored checklist
  - Bulk SEO table, redirects (301/302/410) and a 404 log
  - Global SEO settings, analytics IDs (load only after cookie consent) and `robots.txt`
- **Users & roles:** Super Admin (everything), Editor (content, media, inquiries), SEO Manager (SEO, redirects, robots; read-only content). Every change is recorded in the **Audit log**.

## Swapping the hero assets

The hero works out of the box with an animated vector scene. To use real media:

1. **Background photo:** Admin → Hero → *Background photo* (or `backgroundImage` in `apps/web/src/config/hero.ts`).
2. **Scroll video:** export a muted MP4 with frequent keyframes so seeking is instant, plus a 720p version for phones and a poster image:
   ```bash
   ffmpeg -i hero.mov -an -c:v libx264 -crf 22 -g 5 -keyint_min 5 -movflags +faststart hero-1080.mp4
   ```
   Put the files on a CDN or in `apps/web/public/media/hero/`. Then set Admin → Hero → *Mode: video* and fill in the URLs (or set the defaults in `config/hero.ts`).
3. **Vector layers:** the placeholder scene is `apps/web/src/hero/HeroScene.tsx`. Every moving part is an SVG group with an id that `useHeroScroll.ts` animates, so a designer can redraw them and keep the ids.

## Assets to replace

All placeholders are listed in `CLAUDE.md` §12. In short:

- Company name, logos, favicon, addresses, phone numbers, Trade Licence/TRN, social links (Admin → Company)
- Hero scene or video, and the background photo
- Equipment, fleet, project, team and blog photos. Until then, cards show machinery illustrations.
- Client logos ("Client 1…12"): only use logos you have permission to show
- Testimonials, team members, story, milestones and legal texts (marked `[Placeholder]`)
- Any stand-in photo imported by `photos:import`: listed in Admin → Media (source "stand-in") and credited on `/credits`

## Deployment

### VPS (Ubuntu) with PM2 + Nginx

```bash
git clone https://github.com/<you>/<repo>.git site && cd site
npm ci
cp .env.example .env    # NODE_ENV=production, PUBLIC_SITE_URL=https://your-domain, DATABASE_URL=postgresql://…, secrets, mail
npm run db:deploy:pg                                          # PostgreSQL migrations
npx prisma generate --schema prisma/postgres/schema.prisma    # Postgres client
npx tsx prisma/seed.ts                                        # first deploy only (uses SEED_ADMIN_* from .env)
npm run build
pm2 start deploy/ecosystem.config.cjs && pm2 save
```

Use `deploy/nginx.conf` as the site config (TLS via certbot). Nginx terminates HTTPS and proxies to port 3000; the app already sets HSTS, CSP, compression and caching headers. If you run more than one server, set `STORAGE_DRIVER` to `s3` or `cloudinary`. With `local`, keep `uploads/` and `uploads-private/` on persistent disk and back them up.

### Railway / Render

- **Build command:** `npm ci && npx prisma generate --schema prisma/postgres/schema.prisma || true && npm run db:deploy:pg && npm run build`
- **Start command:** `npm start`
- Add a PostgreSQL service and set `DATABASE_URL`, `NODE_ENV=production`, `PUBLIC_SITE_URL` and the secrets.
- Set `STORAGE_DRIVER=s3` (or `cloudinary`), because the container disk is ephemeral.

### Using PostgreSQL

`prisma/schema.prisma` is the source of truth (SQLite provider for development). `npm run db:pg:schema` writes `prisma/postgres/schema.prisma` with the PostgreSQL provider. The `:pg` scripts migrate with it; generate the Prisma client from it before building for production.

## Security notes

- Auth: bcrypt, 15-minute access cookie plus a rotating refresh cookie (reuse revokes the whole session family). All cookies are httpOnly, `secure` in production and SameSite=strict. CSRF double-submit token on every write. Login is rate-limited.
- Forms: Zod validation (shared with the client), honeypot, per-IP rate limit, HTML stripping and optional Cloudflare Turnstile (`TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET`).
- Inquiry attachments are stored outside the public folder and downloadable only from the admin.
- CSP allows scripts from the site itself plus Google Tag Manager/Analytics, Meta Pixel and Turnstile. No inline scripts are needed.
- Secrets live only in `.env`, which is git-ignored.
