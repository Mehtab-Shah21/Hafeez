import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { useDeviceTier } from '@/lib/motion';

const World = lazy(() => import('./World'));

/** If WebGL is unavailable or the scene throws, keep the painted sky instead of breaking the page. */
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * Fixed full-screen 3D world behind the home page (journey3d/World). It is client-only: the
 * server renders the painted desert sky below, and three.js loads in its own chunk after
 * hydration, so it never blocks the first paint or the SSR content.
 */
export function JourneyBackdrop() {
  const [mounted, setMounted] = useState(false);
  const tier = useDeviceTier();
  useEffect(() => setMounted(true), []);
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(180deg,#7FA9CC_0%,#BFD5E4_52%,#E6D3B0_53%,#D2A46C_100%)]"
    >
      {mounted && (
        <SceneBoundary>
          <Suspense fallback={null}>
            <World lowTier={tier === 'low'} />
          </Suspense>
        </SceneBoundary>
      )}
    </div>
  );
}
