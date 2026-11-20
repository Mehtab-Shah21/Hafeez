import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import type { Locale, PublicSettingsDTO } from '@app/shared';
import { Button } from '@/components/ui/button';
import { heroConfig } from '@/config/hero';
import { localePath } from '@/lib/links';
import { useDeviceTier, usePrefersReducedMotion } from '@/lib/motion';
import { HeroScene } from './HeroScene';
import { useHeroScroll } from './useHeroScroll';
import { useScrollVideo } from './useScrollVideo';

/**
 * Full-viewport framed hero. The <h1> is real server-rendered text (never baked into media).
 * Intro (~1.8 s) is pure CSS (hero-* classes in globals.css) so it starts at first paint with no
 * JS and never flashes; scroll storytelling loads GSAP after hydration.
 */
/**
 * backdrop="scene": the hero draws its own framed scene (vector or video).
 * backdrop="world": transparent hero over the home page's fixed 3D world (journey3d).
 */
export function Hero({ settings, lang, backdrop = 'scene' }: { settings: PublicSettingsDTO; lang: Locale; backdrop?: 'scene' | 'world' }) {
  const hero = settings.hero;
  const section = useRef<HTMLElement>(null);
  const scene = useRef<SVGSVGElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const reduced = usePrefersReducedMotion();
  const tier = useDeviceTier();

  const videoSrc = hero.videoUrl || heroConfig.video.src;
  const videoMobile = hero.videoUrlMobile || heroConfig.video.srcMobile || videoSrc;
  const mode = hero.mode === 'video' && videoSrc ? 'video' : heroConfig.mode === 'video' && videoSrc ? 'video' : 'vector';
  const bg = hero.background?.src || heroConfig.backgroundImage;
  const intensity = heroConfig.intensity[hero.intensity];

  useHeroScroll({ section, scene, copy, tier, intensity, enabled: backdrop === 'scene' && mode === 'vector' && !reduced });
  useScrollVideo(section, video, tier, backdrop === 'scene' && mode === 'video' && !reduced);

  return (
    <section ref={section} aria-labelledby="hero-title" className={backdrop === 'world' ? 'relative h-[100svh] min-h-[620px]' : 'relative h-[100svh] min-h-[620px] bg-navy p-2 sm:p-3'}>
      <div className={backdrop === 'world' ? 'surface-dark relative h-full overflow-hidden' : 'surface-dark relative h-full overflow-hidden rounded-4xl bg-navy-900'}>
        {backdrop === 'world' ? null : mode === 'video' ? (
          <video
            ref={video}
            className="absolute inset-0 h-full w-full object-cover"
            muted
            playsInline
            preload="auto"
            poster={hero.poster?.src || heroConfig.video.poster || undefined}
            aria-hidden="true"
          >
            <source src={videoMobile} type={heroConfig.video.type} media="(max-width: 899px)" />
            <source src={videoSrc} type={heroConfig.video.type} />
          </video>
        ) : (
          <>
            {bg && (
              <img
                src={bg}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                fetchPriority="high"
                decoding="async"
                width={hero.background?.width ?? 1920}
                height={hero.background?.height ?? 1080}
              />
            )}
            <HeroScene ref={scene} showSky={!bg} lowTier={tier === 'low'} />
          </>
        )}

        {/* Legibility wash on the text side only (start edge), so the machinery stays vivid. */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-navy-900/90 via-navy-900/50 to-transparent md:bg-gradient-to-r md:from-navy-900/95 md:via-navy-900/60 md:to-transparent md:via-35% rtl:md:bg-gradient-to-l" />

        <div ref={copy} className="relative z-10 flex h-full flex-col justify-start px-5 pt-24 sm:px-10 lg:justify-center lg:px-16 lg:pt-20">
          <div className="max-w-[40rem]">
            <p className="hero-fade-up text-sm font-semibold tracking-wide text-yellow">{hero.eyebrow}</p>
            <h1 id="hero-title" className="mt-4 font-display text-[2.6rem] uppercase leading-[0.92] text-white sm:text-display-xl lg:mt-5 rtl:font-bold rtl:normal-case rtl:leading-[1.15]">
              {hero.lines.map((line, i) => (
                <span key={line} className="block overflow-hidden pb-[0.04em]">
                  <span className="hero-line block" style={{ animationDelay: `${0.25 + i * 0.12}s` }}>
                    {line}
                  </span>
                </span>
              ))}
            </h1>
            <p className="hero-fade-up mt-4 max-w-md text-base text-offwhite/85 sm:text-lg lg:mt-6 [animation-delay:0.9s]">{hero.subtitle}</p>
            <div className="hero-fade-up mt-6 flex flex-wrap gap-3 lg:mt-8 [animation-delay:1.1s]">
              <Button asChild size="lg">
                <Link to={localePath(lang, settings.navbar.ctaHref)}>{hero.primaryCta}</Link>
              </Button>
              <Button asChild variant="glass" size="lg" chevron={false}>
                <Link to={localePath(lang, '/equipment')}>{hero.secondaryCta}</Link>
              </Button>
            </div>
            <ul className="hero-fade-up mt-8 hidden flex-wrap sm:flex gap-x-5 gap-y-2 text-sm text-offwhite/85 [animation-delay:1.3s]">
              {hero.badges.map((b) => (
                <li key={b} className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-yellow" aria-hidden="true" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
