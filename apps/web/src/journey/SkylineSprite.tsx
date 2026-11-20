import { SkylineArt } from '@/hero/scene/Skyline';

/**
 * Hidden SVG sprite rendered once on the home page. The hero and every emirate postcard place
 * crops of the same skyline art with <use href="#hs-skyline-art">, so the landmarks exist in the
 * DOM only once.
 */
export function SkylineSprite() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="hs-bld" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4A3A6E" />
          <stop offset="1" stopColor="#2B2147" />
        </linearGradient>
        <linearGradient id="hs-mtn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9A7896" />
          <stop offset="1" stopColor="#5A4670" />
        </linearGradient>
        <SkylineArt />
      </defs>
    </svg>
  );
}
