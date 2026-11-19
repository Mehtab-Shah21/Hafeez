import { useEffect, useState } from 'react';

/** SSR-safe: false on the server and first client render, then the real preference. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    // QA override: ?motion=force previews animations on machines with reduced motion switched on.
    if (new URLSearchParams(location.search).get('motion') === 'force') return;
    setReduced(mq.matches);
    const on = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

export type DeviceTier = 'high' | 'low';

interface NetworkInformationLike {
  saveData?: boolean;
}

/**
 * Low tier: ≤4 CPU cores, Data Saver, or a viewport under 768px. Low tier gets fewer hero layers,
 * no parallax and a shorter scroll sequence. Computed once on the client.
 */
export function detectDeviceTier(): DeviceTier {
  if (typeof window === 'undefined') return 'high';
  const cores = navigator.hardwareConcurrency ?? 8;
  const conn = (navigator as Navigator & { connection?: NetworkInformationLike }).connection;
  if (cores <= 4 || conn?.saveData === true || window.innerWidth < 768) return 'low';
  return 'high';
}

export function useDeviceTier(): DeviceTier {
  const [tier, setTier] = useState<DeviceTier>('high');
  useEffect(() => setTier(detectDeviceTier()), []);
  return tier;
}

/** Throttle to one call per animation frame (resize handlers). */
export function rafThrottle<A extends unknown[]>(fn: (...args: A) => void) {
  let queued = false;
  let last: A;
  return (...args: A) => {
    last = args;
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      fn(...last);
    });
  };
}
