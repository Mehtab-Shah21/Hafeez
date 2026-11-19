/**
 * HERO ASSET SWAP POINT.
 *
 * The hero runs in one of two modes:
 *  - 'vector' (default, works out of the box): layered SVG machinery animated by GSAP, over either
 *    `backgroundImage` (a real port/skyline photo) or the built-in golden-hour sky.
 *  - 'video': a pre-rendered clip scrubbed by scroll. Export keyframe-heavy (e.g. ffmpeg
 *    `-g 1 -keyint_min 1` or `-g 5`) so seeking is instant, muted, no audio track.
 *
 * Everything here is a default: the admin Hero manager (Setting `hero`) overrides mode, video URLs,
 * poster, background photo, headline lines and intensity without a deploy.
 */
export const heroConfig = {
  mode: 'vector' as 'vector' | 'video',
  video: {
    /** 1080p for ≥900px wide screens. Put files in apps/web/public/media/hero/ or upload in the admin. */
    src: '' as string,
    /** 720p variant for screens under 900px (and low-power devices). */
    srcMobile: '' as string,
    poster: '' as string,
    type: 'video/mp4',
  },
  /** Optional real photo behind the vector machinery (e.g. a licensed Jebel Ali skyline at dusk). */
  backgroundImage: '' as string,
  /** Pinned scroll length in viewport heights. */
  scrollLength: { high: 2.6, low: 1.4 },
  /** Scale of the movement, set from the admin `intensity` (subtle | standard | cinematic). */
  intensity: { subtle: 0.6, standard: 1, cinematic: 1.25 },
} as const;
