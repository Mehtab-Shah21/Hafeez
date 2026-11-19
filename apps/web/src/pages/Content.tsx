import { useSuspenseQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { EMIRATES, LOCALE_TAGS } from '@app/shared';
import { BlogCard, ProjectCard } from '@/components/cards';
import { Container, Section } from '@/components/primitives';
import { Seo } from '@/components/seo/Seo';
import { MediaImage, PageHeader, Reveal, SectionHeading } from '@/components/ui/blocks';
import { Button } from '@/components/ui/button';
import { useLang, useQueries } from '@/data/context';

export function ProjectsIndex() {
  const lang = useLang();
  const { t } = useTranslation();
  const q = useQueries();
  const { data: settings } = useSuspenseQuery(q.settings(lang));
  const { data: page } = useSuspenseQuery(q.page('projects', lang));
  const { data: projects } = useSuspenseQuery(q.projects(lang));
  const { data: clients } = useSuspenseQuery(q.clients(lang));
  const title = page?.title ?? t('sections.projects');
  return (
    <>
      <Seo lang={lang} settings={settings} path="/projects" seo={page?.seo ?? null} fallbackTitle={title} />
      <PageHeader title={title} intro={page?.intro} crumbs={[{ label: title }]} lang={lang} siteUrl={settings.siteUrl} />
      <Section tone="light">
        <Container>
          <ul className="grid gap-6 md:grid-cols-2">
            {projects.map((p, i) => (
              <Reveal as="li" key={p.id} delay={(i % 2) * 80}>
                <ProjectCard p={p} lang={lang} />
              </Reveal>
            ))}
          </ul>
        </Container>
      </Section>
      {clients.length > 0 && (
        <Section tone="white">
          <Container>
            <SectionHeading title={t('sections.clients')} />
            <ul className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {clients.map((c) => (
                <li key={c.id} className="grid h-20 place-items-center rounded-2xl bg-offwhite px-4 text-center font-semibold text-steel">
                  {c.logo ? <img src={c.logo.src} alt={c.logo.alt || c.name} width={c.logo.width} height={c.logo.height} loading="lazy" className="max-h-10 w-auto" /> : c.name}
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      )}
    </>
  );
}

export function ProjectDetail() {
  const lang = useLang();
  const { slug = '' } = useParams();
  const { t } = useTranslation();
  const q = useQueries();
  const { data: settings } = useSuspenseQuery(q.settings(lang));
  const { data: p } = useSuspenseQuery(q.project(slug, lang));
  if (!p) return null;
  const emirate = EMIRATES.find((e) => e.key === p.emirate)?.[lang] ?? p.emirate;
  return (
    <>
      <Seo lang={lang} settings={settings} path={`/projects/${p.slug}`} seo={p.seo} fallbackTitle={p.title} fallbackDescription={p.summary} />
      <PageHeader title={p.title} intro={p.summary} crumbs={[{ label: t('sections.projects'), href: `/${lang}/projects` }, { label: p.title }]} lang={lang} siteUrl={settings.siteUrl}>
        <dl className="mt-8 flex flex-wrap gap-6 text-sm">
          <div>
            <dt className="text-offwhite/60">{t('project.location')}</dt>
            <dd className="font-semibold text-white">{emirate}</dd>
          </div>
          <div>
            <dt className="text-offwhite/60">{t('project.year')}</dt>
            <dd className="tabular font-semibold text-white">
              <bdi>{p.year}</bdi>
            </dd>
          </div>
        </dl>
      </PageHeader>
      <Section tone="light">
        <Container className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-10">
            <MediaImage media={p.cover} icon="crane" priority className="aspect-[16/9] rounded-4xl" sizes="(min-width: 1024px) 60vw, 100vw" />
            <div>
              <h2 className="text-2xl font-semibold text-navy">{t('sections.challenge')}</h2>
              <p className="mt-3 max-w-prose text-lg text-steel">{p.challenge}</p>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-navy">{t('sections.solution')}</h2>
              <p className="mt-3 max-w-prose text-lg text-steel">{p.solution}</p>
            </div>
          </div>
          <aside className="h-fit rounded-4xl bg-navy p-8 text-white">
            <h2 className="text-xl font-semibold">{t('sections.results')}</h2>
            <ul className="mt-5 space-y-4">
              {p.results.map((r) => (
                <li key={r} className="border-b border-white/10 pb-4 text-lg font-semibold text-yellow last:border-0">
                  {r}
                </li>
              ))}
            </ul>
            <Button asChild className="mt-8 w-full">
              <Link to={`/${lang}/contact?type=quote`}>{t('cta.requestQuote')}</Link>
            </Button>
          </aside>
        </Container>
      </Section>
    </>
  );
}

export function BlogIndex() {
  const lang = useLang();
  const { t } = useTranslation();
  const q = useQueries();
  const { data: settings } = useSuspenseQuery(q.settings(lang));
  const { data: page } = useSuspenseQuery(q.page('blog', lang));
  const { data: posts } = useSuspenseQuery(q.blog(lang, 1));
  const title = page?.title ?? t('sections.latest');
  return (
    <>
      <Seo lang={lang} settings={settings} path="/blog" seo={page?.seo ?? null} fallbackTitle={title} />
      <PageHeader title={title} intro={page?.intro} crumbs={[{ label: title }]} lang={lang} siteUrl={settings.siteUrl} />
      <Section tone="light">
        <Container>
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.items.map((b, i) => (
              <Reveal as="li" key={b.id} delay={(i % 3) * 60}>
                <BlogCard b={b} lang={lang} />
              </Reveal>
            ))}
          </ul>
        </Container>
      </Section>
    </>
  );
}

export function BlogPost() {
  const lang = useLang();
  const { slug = '' } = useParams();
  const { t } = useTranslation();
  const q = useQueries();
  const { data: settings } = useSuspenseQuery(q.settings(lang));
  const { data: b } = useSuspenseQuery(q.blogPost(slug, lang));
  if (!b) return null;
  const base = settings.siteUrl.replace(/\/$/, '');
  const words = b.bodyHtml.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  const date = b.publishedAt ? new Intl.DateTimeFormat(LOCALE_TAGS[lang], { dateStyle: 'long', timeZone: 'Asia/Dubai' }).format(new Date(b.publishedAt)) : '';
  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: b.title,
    description: b.excerpt,
    datePublished: b.publishedAt,
    dateModified: b.updatedAt,
    inLanguage: LOCALE_TAGS[lang],
    author: { '@type': 'Organization', name: settings.company.name },
    publisher: { '@id': `${base}/#organization` },
    mainEntityOfPage: `${base}/${lang}/blog/${b.slug}`,
    ...(b.cover ? { image: base + b.cover.src } : {}),
  };
  return (
    <>
      <Seo lang={lang} settings={settings} path={`/blog/${b.slug}`} seo={b.seo} fallbackTitle={b.title} fallbackDescription={b.excerpt} jsonLd={[articleLd]} />
      <PageHeader title={b.title} intro={b.excerpt} crumbs={[{ label: t('sections.latest'), href: `/${lang}/blog` }, { label: b.title }]} lang={lang} siteUrl={settings.siteUrl}>
        <p className="mt-6 text-sm text-offwhite/70">
          <time dateTime={b.publishedAt ?? undefined}>{date}</time> · {t('blog.min', { n: Math.max(1, Math.round(words / 200)) })}
        </p>
      </PageHeader>
      <Section tone="white">
        <Container>
          {b.cover && <MediaImage media={b.cover} priority className="mx-auto mb-12 aspect-[16/9] max-w-4xl rounded-4xl" />}
          {/* Sanitised server-side (sanitize-html allow-list) before it reaches the page. */}
          <div className="prose-site mx-auto max-w-prose" dangerouslySetInnerHTML={{ __html: b.bodyHtml }} />
          <div className="mx-auto mt-12 max-w-prose">
            <Button asChild>
              <Link to={`/${lang}/contact?type=quote`}>{t('cta.requestQuote')}</Link>
            </Button>
          </div>
        </Container>
      </Section>
    </>
  );
}

/** Privacy / Terms: text managed in Admin → Pages (intro field holds the body). */
export function Legal({ pageKey }: { pageKey: 'privacy' | 'terms' }) {
  const lang = useLang();
  const q = useQueries();
  const { data: settings } = useSuspenseQuery(q.settings(lang));
  const { data: page } = useSuspenseQuery(q.page(pageKey, lang));
  const title = page?.title ?? pageKey;
  return (
    <>
      <Seo lang={lang} settings={settings} path={`/${pageKey}`} seo={page?.seo ?? null} fallbackTitle={title} />
      <PageHeader title={title} crumbs={[{ label: title }]} lang={lang} siteUrl={settings.siteUrl} />
      <Section tone="white">
        <Container>
          <div className="prose-site max-w-prose whitespace-pre-line">{page?.intro}</div>
        </Container>
      </Section>
    </>
  );
}

/** Licence credits for stand-in photographs (CC BY / BY-SA require attribution). */
export function Credits() {
  const lang = useLang();
  const { t } = useTranslation();
  const q = useQueries();
  const { data: settings } = useSuspenseQuery(q.settings(lang));
  const { data: credits } = useSuspenseQuery(q.credits(lang));
  const title = t('footer.credits');
  return (
    <>
      <Seo lang={lang} settings={settings} path="/credits" seo={null} fallbackTitle={title} noindex />
      <PageHeader title={title} crumbs={[{ label: title }]} lang={lang} siteUrl={settings.siteUrl} />
      <Section tone="white">
        <Container>
          {credits.length === 0 ? (
            <p className="text-steel">{lang === 'ar' ? 'لا توجد صور تتطلب الإسناد حاليًا.' : 'No photographs currently require attribution.'}</p>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {credits.map((c) => (
                <li key={c.id} className="flex gap-4 rounded-2xl bg-offwhite p-4">
                  <img src={c.src} alt={c.alt} width={96} height={64} loading="lazy" className="h-16 w-24 rounded-xl object-cover" />
                  <p className="text-sm text-steel">
                    {c.credit.author} ·{' '}
                    <a href={c.credit.licenceUrl} className="text-blue underline" rel="noopener noreferrer license" target="_blank">
                      {c.credit.licence}
                    </a>{' '}
                    ·{' '}
                    <a href={c.credit.sourceUrl} className="text-blue underline" rel="noopener noreferrer" target="_blank">
                      Source
                    </a>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </Section>
    </>
  );
}

export const Privacy = () => <Legal pageKey="privacy" />;
export const Terms = () => <Legal pageKey="terms" />;
