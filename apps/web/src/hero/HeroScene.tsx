import { forwardRef } from 'react';

/**
 * Placeholder vector scene (replaceable: see config/hero.ts). Every animated part is its own <g>
 * with an id so GSAP can drive it with transforms only. Geometry is in a 1600×900 viewBox; the
 * starting pose is the "loaded on the ground" frame, which is also the static SSR / reduced-motion frame.
 *
 * Layers, back to front: sky, sun, skyline (parallax far), port cranes (parallax mid), quay, container
 * stacks, gantry crane with trolley/cable/load, flatbed truck, forklift, haze.
 */
export const HeroScene = forwardRef<SVGSVGElement, { showSky: boolean; lowTier: boolean }>(function HeroScene({ showSky, lowTier }, ref) {
  return (
    <svg
      ref={ref}
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMaxYMax slice"
      className="absolute inset-0 h-full w-full rtl:-scale-x-100"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="hs-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0B1B3A" />
          <stop offset="0.45" stopColor="#3B3A5E" />
          <stop offset="0.72" stopColor="#C46A4A" />
          <stop offset="0.86" stopColor="#F2A65A" />
          <stop offset="1" stopColor="#FFD58A" />
        </linearGradient>
        <radialGradient id="hs-sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFE7A8" />
          <stop offset="0.5" stopColor="#FFC62B" stopOpacity="0.8" />
          <stop offset="1" stopColor="#FFC62B" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hs-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1B2A4A" />
          <stop offset="1" stopColor="#0A1430" />
        </linearGradient>
        <linearGradient id="hs-beam" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FFF3C4" stopOpacity="0.55" />
          <stop offset="1" stopColor="#FFF3C4" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="hs-container" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2F63FF" />
          <stop offset="1" stopColor="#1E46C8" />
        </linearGradient>
      </defs>

      {/* Sky + sun (hidden when a background photo is set) */}
      {showSky && (
        <g id="hs-sky-layer">
          <rect width="1600" height="900" fill="url(#hs-sky)" />
          <circle cx="1240" cy="560" r="150" fill="url(#hs-sun)" />
          <circle cx="1240" cy="560" r="52" fill="#FFE7A8" />
        </g>
      )}

      {/* Far skyline: generic towers (no real landmarks). */}
      <g id="hs-skyline" fill="#24335A" opacity="0.9">
        <path d="M600 640V470h40v-40h30v210zM690 640V380l22-60 22 60v260zM760 640V500h60v140zM840 640V430h34l12-30 12 30h22v210zM930 640V520h50v120zM1000 640V300l14-90 14 90v340zM1050 640V460h70v180zM1140 640V540h40v100zM1200 640V410h28v-30h28v260zM1280 640V480h60v160zM1360 640V350l18-40 18 40v290zM1420 640V500h70v140zM1500 640V450h40v190z" />
        <path d="M1014 210v-60" stroke="#24335A" strokeWidth="4" />
      </g>

      {/* Port gantry cranes (mid distance) */}
      {!lowTier && (
        <g id="hs-portcranes" fill="none" stroke="#33466F" strokeWidth="8" strokeLinejoin="round">
          <path d="M1110 660V470h120v190M1100 470h220l-20-40h-180zM1170 470l-40-60M1230 470v-40" />
          <path d="M1330 660V490h100v170M1320 490h190l-18-36h-155zM1380 490l-34-50" />
          <path d="M1480 660V500h90v160M1470 500h130" />
        </g>
      )}

      {/* Quay */}
      <g id="hs-ground">
        <rect y="660" width="1600" height="240" fill="url(#hs-ground)" />
        <path d="M0 660h1600" stroke="#FFC62B" strokeOpacity="0.5" strokeWidth="3" />
        <path d="M0 790h1600" stroke="#FFFFFF" strokeOpacity="0.08" strokeWidth="4" strokeDasharray="60 40" />
      </g>

      {/* Machinery stage: shifted right so the headline side stays calm. */}
      <g id="hs-stage" transform="translate(300 0)">
      {/* Static container stacks */}
      <g id="hs-stacks">
        <rect x="40" y="570" width="200" height="90" rx="4" fill="#C2410C" />
        <rect x="40" y="480" width="200" height="90" rx="4" fill="#0E7490" />
        <rect x="250" y="570" width="200" height="90" rx="4" fill="#4D5B7C" />
        <path d="M60 495v60M90 495v60M120 495v60M150 495v60M180 495v60M210 495v60M60 585v60M90 585v60M120 585v60M150 585v60M180 585v60M210 585v60M270 585v60M300 585v60M330 585v60M360 585v60M390 585v60M420 585v60" stroke="#000" strokeOpacity="0.18" strokeWidth="5" />
      </g>

      {/* Gantry crane: legs + girder are static; the trolley and load move. */}
      <g id="hs-crane">
        <path d="M470 660V250M500 660V250M1010 660V250M1040 660V250" stroke="#FFC62B" strokeWidth="14" />
        <path d="M470 330l30 60M500 390l-30 60M470 450l30 60M500 510l-30 60M1010 330l30 60M1040 390l-30 60M1010 450l30 60M1040 510l-30 60" stroke="#E0A800" strokeWidth="6" />
        <rect x="430" y="226" width="660" height="30" rx="4" fill="#FFC62B" />
        <path d="M440 232h640" stroke="#E0A800" strokeWidth="4" />
        <rect x="440" y="196" width="80" height="30" rx="4" fill="#0B1B3A" stroke="#FFC62B" strokeWidth="3" />
        <rect x="458" y="204" width="44" height="12" rx="2" fill="#7FB0FF" />
      </g>

      {/* Trolley, cable and hook. Cable is scaled in Y from its top (transform-origin set in GSAP). */}
      <g id="hs-trolley">
        <rect x="560" y="252" width="80" height="22" rx="3" fill="#0B1B3A" stroke="#FFC62B" strokeWidth="3" />
        <rect id="hs-cable" x="597" y="274" width="6" height="326" fill="#C9D3E6" />
        <g id="hs-hook">
          <path d="M580 600h40l-6-14h-28z" fill="#FFC62B" />
        </g>
      </g>

      {/* Load: the container that is lifted onto the truck. Starts on the ground (y 570–660). */}
      <g id="hs-load">
        <rect x="490" y="600" width="220" height="60" rx="4" fill="url(#hs-container)" />
        <path d="M512 608v44M540 608v44M568 608v44M596 608v44M624 608v44M652 608v44M680 608v44" stroke="#0B1B3A" strokeOpacity="0.25" strokeWidth="5" />
        <rect x="490" y="600" width="220" height="8" fill="#FFFFFF" fillOpacity="0.15" />
      </g>

      {/* Flatbed truck facing right (drives right; whole scene mirrors in RTL). */}
      <g id="hs-truck">
        <g id="hs-truck-body">
          <path id="hs-beam" d="M1236 650L1600 610V720L1236 676z" fill="url(#hs-beam)" opacity="0" />
          <rect x="700" y="660" width="380" height="16" rx="3" fill="#E8EDF5" />
          <rect x="700" y="676" width="380" height="10" fill="#9AA6BD" />
          <path d="M1080 600h90l40 40 26 8v40h-156z" fill="#FFC62B" />
          <path d="M1092 612h66l28 28h-94z" fill="#7FB0FF" fillOpacity="0.85" />
          <rect x="1226" y="652" width="12" height="10" rx="2" fill="#FFF3C4" />
          <rect x="1080" y="668" width="160" height="20" fill="#0B1B3A" />
        </g>
        {[760, 812, 1010, 1180].map((cx) => (
          <g key={cx} className="hs-wheel">
            <circle cx={cx} cy="694" r="24" fill="#0A0B0C" />
            <circle cx={cx} cy="694" r="11" fill="#9AA6BD" />
            <path d={`M${cx - 11} 694h22M${cx} 683v22`} stroke="#0A0B0C" strokeWidth="4" />
          </g>
        ))}
      </g>

      {/* Forklift shuttling pallets in the mid-ground */}
      <g id="hs-forklift">
        <path d="M70 664V560" stroke="#E8EDF5" strokeWidth="6" />
        <g id="hs-forks">
          <path d="M70 650h46" stroke="#E8EDF5" strokeWidth="5" />
          <rect x="74" y="616" width="40" height="30" rx="2" fill="#C2410C" />
          <rect x="74" y="612" width="40" height="6" fill="#8A2E08" />
        </g>
        <path d="M74 662h0" />
        <path d="M-6 620h70v44H-14v-30z" fill="#FFC62B" />
        <path d="M2 590h40l12 30H2z" fill="none" stroke="#E8EDF5" strokeWidth="5" />
        <circle cx="6" cy="668" r="13" fill="#0A0B0C" />
        <circle cx="50" cy="668" r="13" fill="#0A0B0C" />
      </g>

      </g>

      {/* Heat haze over the quay (opacity only, subtle ambient loop in CSS). */}
      <rect id="hs-haze" className="hero-haze" y="630" width="1600" height="60" fill="#FFD58A" opacity="0.06" />
    </svg>
  );
});
