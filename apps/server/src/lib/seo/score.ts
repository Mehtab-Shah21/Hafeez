import type { SeoEntity } from './entities.js';

export type CheckStatus = 'good' | 'warn' | 'bad';
export interface SeoCheck {
  id: string;
  status: CheckStatus;
  label: string;
  hint: string;
}

interface MetaLike {
  title: string;
  description: string;
  focusKeyword: string;
}

const has = (hay: string, needle: string) => !!needle && hay.toLowerCase().includes(needle.toLowerCase());
const slugHas = (path: string, kw: string) => {
  const parts = kw.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  return parts.length > 0 && parts.some((w) => path.toLowerCase().includes(w));
};

/** Rough sentence-length readability (works for EN and AR): average words per sentence. */
function readability(text: string): number {
  const sentences = text.split(/[.!?؟]+/).filter((s) => s.trim().length > 0);
  const words = text.split(/\s+/).filter(Boolean).length;
  return sentences.length ? words / sentences.length : 0;
}

/**
 * SEO checklist + 0–100 score for one entity/locale. Rules follow the brief: keyword placement,
 * title 50–60 and description 150–160 characters, single H1, image alt coverage, internal links,
 * word count and readability. Each failing check carries a plain-language fix hint.
 */
export function scoreSeo(meta: MetaLike, e: SeoEntity): { score: number; checks: SeoCheck[] } {
  const kw = meta.focusKeyword.trim();
  const words = e.bodyText.split(/\s+/).filter(Boolean).length;
  const minWords = e.type === 'blog' ? 300 : e.type === 'page' ? 120 : 80;
  const t = meta.title.length;
  const d = meta.description.length;
  const altCovered = e.images.length ? e.images.filter((i) => i.alt.trim()).length / e.images.length : 1;
  const avgSentence = readability(e.bodyText);

  const checks: SeoCheck[] = [
    { id: 'kw-set', status: kw ? 'good' : 'warn', label: 'Focus keyword set', hint: 'Add the main phrase people search for, e.g. "crane rental Dubai".' },
    { id: 'kw-title', status: !kw ? 'warn' : has(meta.title, kw) ? 'good' : 'bad', label: 'Keyword in meta title', hint: 'Put the focus keyword near the start of the meta title.' },
    { id: 'kw-h1', status: !kw ? 'warn' : has(e.h1, kw) ? 'good' : 'warn', label: 'Keyword in H1', hint: 'Use the keyword (or a close variant) in the page heading.' },
    { id: 'kw-first', status: !kw ? 'warn' : has(e.firstParagraph, kw) ? 'good' : 'warn', label: 'Keyword in first paragraph', hint: 'Mention the keyword naturally in the opening paragraph.' },
    { id: 'kw-url', status: !kw ? 'warn' : slugHas(e.path, kw) ? 'good' : 'warn', label: 'Keyword in URL', hint: 'Use a short slug that contains the main words of the keyword.' },
    { id: 'kw-desc', status: !kw ? 'warn' : has(meta.description, kw) ? 'good' : 'warn', label: 'Keyword in meta description', hint: 'Include the keyword once in the description; Google bolds it in results.' },
    { id: 'title-len', status: t >= 50 && t <= 60 ? 'good' : t >= 30 && t <= 65 ? 'warn' : 'bad', label: `Title length ${t}/50–60`, hint: t < 50 ? 'Make the title a little longer and more specific.' : 'Shorten the title so it is not cut off in results.' },
    { id: 'desc-len', status: d >= 150 && d <= 160 ? 'good' : d >= 110 && d <= 170 ? 'warn' : 'bad', label: `Description length ${d}/150–160`, hint: d < 150 ? 'Add a benefit or a call to action to reach about 155 characters.' : 'Trim the description to under 160 characters.' },
    { id: 'h1-single', status: e.h1.trim() ? 'good' : 'bad', label: 'Single H1', hint: 'Every page renders exactly one H1 from its title; make sure the title is filled in.' },
    { id: 'headings', status: e.type === 'blog' ? (e.bodyText && /<h2|##/i.test(e.bodyText) ? 'good' : 'warn') : 'good', label: 'Heading hierarchy', hint: 'Break long articles into sections with H2 headings (H3 under them).' },
    { id: 'alt', status: altCovered === 1 ? 'good' : altCovered >= 0.5 ? 'warn' : 'bad', label: `Image alt text ${Math.round(altCovered * 100)}%`, hint: 'Describe every image in Admin → Media (both languages).' },
    { id: 'links', status: e.internalLinks >= 2 ? 'good' : 'warn', label: 'Internal links', hint: 'Link to related services, equipment or posts.' },
    { id: 'words', status: words >= minWords ? 'good' : words >= minWords / 2 ? 'warn' : 'bad', label: `Word count ${words}/${minWords}+`, hint: 'Add useful detail: specs, use cases, FAQs, locations served.' },
    { id: 'readability', status: avgSentence === 0 ? 'warn' : avgSentence <= 22 ? 'good' : avgSentence <= 30 ? 'warn' : 'bad', label: 'Readability (sentence length)', hint: 'Split long sentences; aim for under 20 words per sentence.' },
  ];
  const weight: Record<CheckStatus, number> = { good: 1, warn: 0.5, bad: 0 };
  const score = Math.round((checks.reduce((n, c) => n + weight[c.status], 0) / checks.length) * 100);
  return { score, checks };
}
