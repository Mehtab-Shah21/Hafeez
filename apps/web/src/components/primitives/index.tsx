import { createElement, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** 1280px max-width container with the standard side gutters (16px on phones). */
export function Container({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mx-auto w-full max-w-content px-4 sm:px-6 lg:px-8', className)} {...props} />;
}

type Tone = 'light' | 'white' | 'navy';
const toneClass: Record<Tone, string> = {
  light: 'bg-offwhite text-ink',
  white: 'bg-white text-ink',
  navy: 'surface-dark bg-navy text-offwhite',
};

/** Page section with the vertical rhythm from the design system (64px mobile, up to 160px desktop). */
export function Section({
  tone = 'light',
  blueprint = false,
  className,
  children,
  ...props
}: HTMLAttributes<HTMLElement> & { tone?: Tone; blueprint?: boolean }) {
  return (
    <section
      className={cn('relative py-16 md:py-24 lg:py-32', toneClass[tone], blueprint && tone === 'navy' && 'blueprint-grid', className)}
      {...props}
    >
      {children}
    </section>
  );
}

type Level = 1 | 2 | 3;
const levelSize: Record<Level, string> = {
  1: 'text-display-xl',
  2: 'text-display-lg',
  3: 'text-display-md',
};

/** Condensed uppercase display heading (Anton). In Arabic it switches to bold Plex Sans Arabic, no uppercase. */
export function Heading({
  level = 2,
  size,
  className,
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement> & { level?: Level; size?: Level; children: ReactNode }) {
  return createElement(
    `h${level}`,
    {
      className: cn(
        'font-display uppercase rtl:font-bold rtl:normal-case rtl:leading-[1.15]',
        levelSize[size ?? level],
        className,
      ),
      ...props,
    },
    children,
  );
}

/** Rounded 24px card with the soft two-layer shadow. */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-3xl bg-white p-6 shadow-card md:p-8', className)} {...props} />;
}

/** Translucent card for content over navy or photographic surfaces. */
export function GlassCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-3xl border border-white/15 bg-white/[0.07] p-6 text-offwhite backdrop-blur-md md:p-8', className)}
      {...props}
    />
  );
}
