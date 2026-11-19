import { useEffect, type RefObject } from 'react';
import { heroConfig } from '@/config/hero';
import type { DeviceTier } from '@/lib/motion';
import { subscribeFrame } from '@/lib/raf';

/**
 * Video mode: scroll progress sets a target time; the shared rAF loop eases `currentTime` toward it
 * (`cur += (target - cur) * 0.2`) and only seeks when the previous seek has finished. The video is
 * never played or paused, only seeked, so it stays frame-accurate in both scroll directions.
 */
export function useScrollVideo(section: RefObject<HTMLElement>, video: RefObject<HTMLVideoElement>, tier: DeviceTier, enabled: boolean) {
  useEffect(() => {
    const v = video.current;
    if (!enabled || !section.current || !v) return;
    let target = 0;
    let cur = 0;
    let ctx: { revert: () => void } | undefined;
    let cancelled = false;

    void Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (cancelled || !section.current) return;
      gsap.registerPlugin(ScrollTrigger);
      const lengthVh = tier === 'low' ? heroConfig.scrollLength.low : heroConfig.scrollLength.high;
      ctx = gsap.context(() => {
        ScrollTrigger.create({
          trigger: section.current,
          start: 'top top',
          end: `+=${Math.round(lengthVh * 100)}%`,
          pin: true,
          onUpdate: (self) => {
            if (Number.isFinite(v.duration)) target = self.progress * v.duration;
          },
        });
      }, section);
    });

    const unsub = subscribeFrame(() => {
      const delta = target - cur;
      if (Math.abs(delta) < 0.001) return;
      cur += delta * 0.2;
      if (!v.seeking) v.currentTime = cur;
    });

    return () => {
      cancelled = true;
      unsub();
      ctx?.revert();
    };
  }, [section, video, tier, enabled]);
}
