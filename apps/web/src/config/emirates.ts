import type { Place } from '@/journey/Journey';

/**
 * EMIRATE PHOTO SWAP POINT (home page stop cards).
 *
 * Put licensed photos in apps/web/public/media/emirates/ (WebP, ~1600 px wide, landscape) and list
 * them here. Any place without an entry shows the illustrated skyline card instead.
 * Example:
 *   dubai: { src: '/media/emirates/dubai.webp', alt: 'Burj Khalifa and Downtown Dubai at sunset', credit: 'Photo: …, CC BY-SA 4.0' },
 */
export const EMIRATE_PHOTOS: Partial<Record<Place, { src: string; alt: string; credit?: string }>> = {};
