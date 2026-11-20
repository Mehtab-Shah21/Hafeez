import { useEffect, type RefObject } from 'react';
import { heroConfig } from '@/config/hero';
import type { DeviceTier } from '@/lib/motion';
import { HERO_GEOMETRY as G } from './HeroScene';

interface Options {
  section: RefObject<HTMLElement>;
  scene: RefObject<SVGSVGElement>;
  copy: RefObject<HTMLElement>;
  tier: DeviceTier;
  intensity: number;
  enabled: boolean;
}

/**
 * Scroll storytelling for the port hero. The section pins and one scrubbed GSAP timeline plays:
 * trolley runs out over the ship → spreader drops onto the blue container → hoist → trolley
 * runs back over the truck → container lands on the chassis → spreader lifts clear → truck
 * drives off (towards the road that continues down the page). Scrolling up reverses it.
 *
 * The crane parts are driven from one state object rendered into SVG transforms in the
 * timeline's onUpdate, so the container stays locked to the spreader while it is carried.
 * GSAP is loaded lazily after hydration.
 */
export function useHeroScroll({ section, scene, copy, tier, intensity, enabled }: Options) {
  useEffect(() => {
    if (!enabled || !section.current || !scene.current) return;
    let ctx: { revert: () => void } | undefined;
    let cancelled = false;

    void Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (cancelled || !section.current || !scene.current) return;
      gsap.registerPlugin(ScrollTrigger);
      const lenis = (window as unknown as { __lenis?: { on: (e: string, fn: () => void) => void } }).__lenis;
      lenis?.on('scroll', ScrollTrigger.update);

      const svg = scene.current;
      const q = (id: string) => svg.querySelector<SVGGElement>(`#${id}`);
      const trolley = q('hs-trolley');
      const ropes = q('hs-ropes');
      const spreader = q('hs-spreader');
      const load = q('hs-load');
      const truck = q('hs-truck');
      const beam = q('hs-beam');
      const skyline = q('hs-skyline');
      const wheels = svg.querySelectorAll<SVGGElement>('#hs-truck .hs-wheel-spin');

      // Spreader y is its top edge; it is 10 units tall, so a carried box's top = spreader + 10.
      const s = { tx: G.trolleyRest, sy: G.spreaderRest, bx: G.box.x, by: G.box.top };
      const render = () => {
        trolley?.setAttribute('transform', `translate(${s.tx} 0)`);
        ropes?.setAttribute('transform', `translate(0 ${G.trolleyY}) scale(1 ${(s.sy - G.trolleyY) / 100}) translate(0 ${-G.trolleyY})`);
        spreader?.setAttribute('transform', `translate(0 ${s.sy})`);
        load?.setAttribute('transform', `translate(${s.bx} ${s.by})`);
      };

      const lengthVh = tier === 'low' ? heroConfig.scrollLength.low : heroConfig.scrollLength.high;
      const hoistTop = 330;
      const drive = -1350; // truck + box leave the frame to the left
      const truckX = G.trolleyRest; // container centre on the chassis

      ctx = gsap.context(() => {
        gsap.set(wheels, { transformOrigin: '50% 50%' });
        const tl = gsap.timeline({
          defaults: { ease: 'power1.inOut' },
          onUpdate: render,
          scrollTrigger: {
            trigger: section.current,
            start: 'top top',
            end: `+=${Math.round(lengthVh * 100)}%`,
            pin: true,
            scrub: 0.6,
            anticipatePin: 1,
            onToggle: (self) => {
              const v = self.isActive ? 'transform' : 'auto';
              [load, truck, trolley].forEach((el) => el && (el.style.willChange = v));
            },
          },
        });

        tl.to(s, { tx: G.box.x, duration: 1 }, 0)
          .to(s, { sy: G.box.top - 10, duration: 0.8 }, 1)
          .to(s, { sy: hoistTop - 10, by: hoistTop, duration: 0.9 }, 1.8)
          .to(s, { tx: truckX, bx: truckX, duration: 1 }, 2.7)
          .to(s, { sy: G.chassisTop - 10, by: G.chassisTop, duration: 0.9, ease: 'power2.out' }, 3.7)
          .to(s, { sy: G.spreaderRest, duration: 0.5 }, 4.6)
          .to(beam, { opacity: 1, duration: 0.3 }, 4.8)
          .to(truck, { x: drive, duration: 1.5, ease: 'power2.in' }, 5.1)
          .to(s, { bx: truckX + drive, duration: 1.5, ease: 'power2.in' }, 5.1)
          .to(wheels, { rotation: (drive / (44 * 0.42)) * (180 / Math.PI), duration: 1.5, ease: 'power2.in' }, 5.1);
        if (copy.current) tl.to(copy.current, { y: -40, opacity: 0, duration: 0.6 }, 5.6);
        if (tier === 'high' && skyline) tl.to(skyline, { x: 50 * intensity, duration: 6.6, ease: 'none' }, 0);
      }, section);
    });

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [section, scene, copy, tier, intensity, enabled]);
}
