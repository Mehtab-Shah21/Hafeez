import { useEffect, type RefObject } from 'react';
import { heroConfig } from '@/config/hero';
import type { DeviceTier } from '@/lib/motion';

interface Options {
  section: RefObject<HTMLElement>;
  scene: RefObject<SVGSVGElement>;
  copy: RefObject<HTMLElement>;
  tier: DeviceTier;
  intensity: number;
  enabled: boolean;
}

/**
 * Scroll storytelling for the vector hero: the section pins for ~2.6 viewports (1.4 on low tier)
 * and one GSAP timeline is scrubbed by scroll: crane hoists the container → trolley travels →
 * container lands on the flatbed → truck departs (wheels spin, slight bounce) → camera pulls back.
 * Scrolling up reverses it. Transforms and opacity only; GSAP is loaded lazily after hydration.
 */
export function useHeroScroll({ section, scene, copy, tier, intensity, enabled }: Options) {
  useEffect(() => {
    if (!enabled || !section.current || !scene.current) return;
    let ctx: { revert: () => void } | undefined;
    let cancelled = false;

    void Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (cancelled || !section.current || !scene.current) return;
      gsap.registerPlugin(ScrollTrigger);

      // Keep ScrollTrigger in sync with Lenis smooth scrolling when it is active.
      const lenis = (window as unknown as { __lenis?: { on: (e: string, fn: () => void) => void } }).__lenis;
      lenis?.on('scroll', ScrollTrigger.update);

      const svg = scene.current;
      const q = (id: string) => svg.querySelector<SVGGElement>(`#${id}`);
      const trolley = q('hs-trolley');
      const cable = q('hs-cable');
      const hook = q('hs-hook');
      const load = q('hs-load');
      const truck = q('hs-truck');
      const wheels = svg.querySelectorAll<SVGGElement>('.hs-wheel');
      const forks = q('hs-forks');
      const forklift = q('hs-forklift');
      const beam = q('hs-beam');
      const skyline = q('hs-skyline');
      const portcranes = q('hs-portcranes');

      const lift = -200 * intensity;
      const travel = 290; // trolley centre 600 → flatbed centre 890 (fixed geometry, not scaled)
      const cableLen = 326;
      const lengthVh = tier === 'low' ? heroConfig.scrollLength.low : heroConfig.scrollLength.high;

      ctx = gsap.context(() => {
        gsap.set(cable, { transformOrigin: '50% 0%' });
        gsap.set(wheels, { transformOrigin: '50% 50%', transformBox: 'fill-box' });
        gsap.set(svg, { transformOrigin: '70% 80%', scale: 1.06 });

        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: section.current,
            start: 'top top',
            end: `+=${Math.round(lengthVh * 100)}%`,
            pin: true,
            scrub: 0.6,
            anticipatePin: 1,
            // will-change only while the pinned sequence is active.
            onToggle: (self) => {
              const v = self.isActive ? 'transform' : 'auto';
              [svg, load, truck, trolley].forEach((el) => el && (el.style.willChange = v));
            },
          },
        });

        // 0 → 1: hoist
        tl.to(load, { y: lift, duration: 1, ease: 'power1.inOut' }, 0)
          .to(hook, { y: lift, duration: 1, ease: 'power1.inOut' }, 0)
          .to(cable, { scaleY: (cableLen + lift) / cableLen, duration: 1, ease: 'power1.inOut' }, 0)
          .to(forklift, { x: 160, duration: 1.2, ease: 'sine.inOut' }, 0)
          .to(forks, { y: -26, duration: 0.6 }, 0.2)
          // 1 → 2: trolley travels over the truck
          .to([trolley, load], { x: travel, duration: 1, ease: 'power2.inOut' }, 1)
          .to(forklift, { x: 0, duration: 1.2, ease: 'sine.inOut' }, 1.3)
          .to(forks, { y: 0, duration: 0.6 }, 1.6)
          // 2 → 2.8: lower onto the flatbed
          .to(load, { y: 0, duration: 0.8, ease: 'power2.out' }, 2)
          .to(hook, { y: 0, duration: 0.8, ease: 'power2.out' }, 2)
          .to(cable, { scaleY: 1, duration: 0.8, ease: 'power2.out' }, 2)
          // 2.8 → 3.2: hook releases and retracts
          .to(hook, { y: lift * 0.9, duration: 0.4 }, 2.8)
          .to(cable, { scaleY: (cableLen + lift * 0.9) / cableLen, duration: 0.4 }, 2.8)
          // 3.2 → 4.6: truck departs with its load, headlights on, slight suspension bounce
          .to(beam, { opacity: 1, duration: 0.3 }, 3.1)
          .to([truck, load], { x: `+=${1100}`, duration: 1.4, ease: 'power2.in' }, 3.2)
          .to(wheels, { rotation: 900, duration: 1.4, ease: 'power2.in' }, 3.2)
          .to([truck, load], { y: -3, duration: 0.12, repeat: 9, yoyo: true, ease: 'sine.inOut' }, 3.2)
          // 4.2 → 5: camera pulls back and the copy steps aside for the next section
          .to(svg, { scale: 1, duration: 0.8, ease: 'power1.out' }, 4.2);
        if (copy.current) tl.to(copy.current, { y: -40, opacity: 0, duration: 0.6 }, 4.4);

        // Parallax depth (high tier only): far layers drift less than near ones.
        if (tier === 'high') {
          if (skyline) tl.to(skyline, { x: -60 * intensity, duration: 5 }, 0);
          if (portcranes) tl.to(portcranes, { x: -120 * intensity, duration: 5 }, 0);
        }
      }, section);
    });

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [section, scene, copy, tier, intensity, enabled]);
}
