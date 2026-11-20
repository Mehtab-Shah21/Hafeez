import { forwardRef } from 'react';
import { TruckArt, TruckDefs } from './scene/Truck';

/**
 * Port of Dubai, side view (1600 × 900 viewBox, quay surface at y = 700). A ship-to-shore crane
 * lifts a 20 ft container off the ship onto a container chassis; then the truck drives off
 * towards the road that runs down the page. Every moving part has an id for useHeroScroll.
 * The initial transforms are the static SSR / reduced-motion frame.
 *
 * Layout: ≥1024px the scene fills the frame (text on the start side). Below that it fills the
 * bottom 44% of the frame; `slice` anchored bottom-right then fits the full height and shows the
 * crane, truck and ship half (x ≈ 650–1600) under the headline.
 * The skyline comes from the shared sprite (journey/SkylineSprite).
 */
export const HERO_GEOMETRY = {
  trolleyRest: 1000,
  trolleyY: 274,
  spreaderRest: 400,
  box: { x: 1312.5, top: 456, w: 165, h: 97 },
  /** Chassis deck (local y 250 × 0.42 + 553) minus the 97-unit container height. */
  chassisTop: 561,
} as const;

export const HeroScene = forwardRef<SVGSVGElement, { showSky: boolean; lowTier: boolean }>(function HeroScene({ showSky, lowTier }, ref) {
  const g = HERO_GEOMETRY;
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[44%] lg:inset-0 lg:h-auto rtl:-scale-x-100">
      <svg
        ref={ref}
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMaxYMax slice"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id="hs-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0B1B3A" />
            <stop offset="0.42" stopColor="#3B3A5E" />
            <stop offset="0.66" stopColor="#B4607A" />
            <stop offset="0.8" stopColor="#F08A4B" />
            <stop offset="0.9" stopColor="#FFD58A" />
          </linearGradient>
          <radialGradient id="hs-sun" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#FFE7A8" />
            <stop offset="0.5" stopColor="#FFC62B" stopOpacity="0.7" />
            <stop offset="1" stopColor="#FFC62B" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="hs-sea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3E5F8A" />
            <stop offset="1" stopColor="#0E2346" />
          </linearGradient>
          <linearGradient id="hs-quay" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#4B5568" />
            <stop offset="0.08" stopColor="#2F3747" />
            <stop offset="1" stopColor="#141B2B" />
          </linearGradient>
          <linearGradient id="hs-box" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3B72FF" />
            <stop offset="1" stopColor="#1E46C8" />
          </linearGradient>
          <pattern id="hs-rib" width="9" height="10" patternUnits="userSpaceOnUse">
            <rect width="3" height="10" fill="#000" opacity="0.14" />
          </pattern>
          <TruckDefs />
        </defs>

        {showSky && (
          <g>
            <rect width="1600" height="900" fill="url(#hs-sky)" />
            <circle cx="1380" cy="640" r="170" fill="url(#hs-sun)" />
            <circle cx="1380" cy="640" r="48" fill="#FFE7A8" />
          </g>
        )}

        {/* Dubai skyline across the water (shared sprite) */}
        <g id="hs-skyline" opacity="0.92">
          <use href="#hs-skyline-art" transform="translate(-132 306) scale(0.6)" />
        </g>

        {/* Sea + ship */}
        <rect x="1120" y="688" width="520" height="212" fill="url(#hs-sea)" />
        <path d="M1150 720h120M1300 742h160M1180 770h90M1420 790h140M1250 820h120" stroke="#FFD58A" strokeOpacity="0.25" strokeWidth="3" strokeLinecap="round" />
        <g id="hs-ship">
          <path d="M1176 650H1660V752H1214Q1190 712 1176 650Z" fill="#1B2A4A" />
          <path d="M1188 708H1660V752H1214Q1198 732 1188 708Z" fill="#9B2C2C" />
          <path d="M1180 664H1660" stroke="#FFFFFF" strokeOpacity="0.35" strokeWidth="3" />
          <rect x="1560" y="520" width="70" height="130" fill="#E8EDF5" />
          <rect x="1552" y="512" width="86" height="12" fill="#C9D3E6" />
          {[540, 566, 592, 618].map((y) => (
            <rect key={y} x="1568" y={y} width="54" height="9" fill="#2B3A5C" />
          ))}
          <rect x="1590" y="470" width="10" height="42" fill="#9AA6BD" />
          {/* deck containers; the blue one (hs-load) sits at tier 2, left */}
          <rect x="1230" y="553" width="165" height="97" fill="#C2410C" />
          <rect x="1398" y="553" width="160" height="97" fill="#0E7490" />
          <rect x="1398" y="456" width="160" height="97" fill="#4D5B7C" />
          <rect x="1230" y="553" width="328" height="97" fill="url(#hs-rib)" />
          <rect x="1398" y="456" width="160" height="97" fill="url(#hs-rib)" />
        </g>

        {/* Quay */}
        <rect x="-100" y="688" width="1236" height="212" fill="url(#hs-quay)" />
        <path d="M-100 690H1136" stroke="#FFC62B" strokeOpacity="0.55" strokeWidth="3" />
        <path d="M-100 820H1136" stroke="#FFFFFF" strokeOpacity="0.08" strokeWidth="4" strokeDasharray="60 40" />
        <rect x="1110" y="676" width="12" height="14" rx="3" fill="#2B2F38" />

        {/* Ship-to-shore gantry crane */}
        <g fill="none" stroke="#FFC62B" strokeLinejoin="round">
          <path d="M880 700V262M1100 700V262" strokeWidth="16" />
          <path d="M880 420H1100M880 300H1100" strokeWidth="9" />
          <path d="M880 420L1100 300M880 300L1100 420" strokeWidth="5" stroke="#E0A800" />
          <rect x="760" y="246" width="840" height="20" fill="#FFC62B" stroke="none" />
          <path d="M760 266H1600" strokeWidth="3" stroke="#E0A800" />
          <path d="M990 246L1000 120L1010 246M1000 120L1590 246M1000 120L770 246" strokeWidth="4" stroke="#E0A800" />
          <rect x="780" y="206" width="110" height="40" rx="3" fill="#E8EDF5" stroke="none" />
          <rect x="792" y="216" width="86" height="8" fill="#9AA6BD" stroke="none" />
          {[880, 1100].map((x) => (
            <rect key={x} x={x - 22} y="690" width="44" height="12" rx="3" fill="#2B2F38" stroke="none" />
          ))}
        </g>

        {/* Trolley, hoist ropes and spreader (ropes scale from the trolley down) */}
        <g id="hs-trolley" transform={`translate(${g.trolleyRest} 0)`}>
          <rect x="-34" y="262" width="68" height="14" rx="3" fill="#0B1B3A" stroke="#FFC62B" strokeWidth="3" />
          <g id="hs-ropes" transform={`translate(0 ${g.trolleyY}) scale(1 ${(g.spreaderRest - g.trolleyY) / 100}) translate(0 ${-g.trolleyY})`}>
            <rect x="-62" y={g.trolleyY} width="3" height="100" fill="#C9D3E6" />
            <rect x="59" y={g.trolleyY} width="3" height="100" fill="#C9D3E6" />
          </g>
          <g id="hs-spreader" transform={`translate(0 ${g.spreaderRest})`}>
            <rect x="-88" y="0" width="176" height="10" rx="2" fill="#FFC62B" />
            <rect x="-88" y="0" width="176" height="3" fill="#FFF3C4" opacity="0.6" />
          </g>
        </g>

        {/* Container chassis truck, facing left (mirrored art), parked under the crane */}
        <g id="hs-truck">
          <g transform="translate(1180.6 553) scale(-0.42 0.42)">
            <TruckArt variant="chassis" />
          </g>
        </g>

        {/* The 20 ft container that is lifted (origin = top centre) */}
        <g id="hs-load" transform={`translate(${g.box.x} ${g.box.top})`}>
          <rect x={-g.box.w / 2} y="0" width={g.box.w} height={g.box.h} fill="url(#hs-box)" />
          <rect x={-g.box.w / 2} y="0" width={g.box.w} height={g.box.h} fill="url(#hs-rib)" />
          <rect x={-g.box.w / 2} y="0" width={g.box.w} height="5" fill="#FFFFFF" opacity="0.25" />
          <rect x={-g.box.w / 2 + 10} y="36" width="58" height="22" rx="3" fill="#0B1B3A" opacity="0.55" />
          <rect x={-g.box.w / 2 + 16} y="44" width="46" height="6" rx="2" fill="#FFC62B" />
        </g>

        {!lowTier && <rect className="hero-haze" y="660" width="1600" height="50" fill="#FFD58A" opacity="0.06" />}
      </svg>
    </div>
  );
});
