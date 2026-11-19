import { useEffect } from 'react';
import { subscribeFrame } from '@/lib/raf';

/**
 * Lenis smooth scrolling, created client-side only and only when motion is allowed and the device
 * is not a touch phone (native momentum is better there). Driven by the shared rAF loop and
 * wired to ScrollTrigger when the hero loads it (see hero/useHeroTimeline.ts).
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    let stop = () => {};
    let cancelled = false;
    void import('lenis').then(({ default: Lenis }) => {
      if (cancelled) return;
      const lenis = new Lenis({ duration: 1.05, easing: (t: number) => 1 - Math.pow(1 - t, 4) });
      (window as unknown as { __lenis?: unknown }).__lenis = lenis;
      const unsub = subscribeFrame((time) => lenis.raf(time));
      stop = () => {
        unsub();
        lenis.destroy();
        delete (window as unknown as { __lenis?: unknown }).__lenis;
      };
    });
    return () => {
      cancelled = true;
      stop();
    };
  }, []);
  return null;
}
