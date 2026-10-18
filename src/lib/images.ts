import type { ImageMetadata } from 'astro';

/**
 * Project images live in src/assets/work/ and are referenced by filename in
 * data/profile.json. Astro needs a static glob to optimize them, so we map
 * every file eagerly and look it up by basename at build time.
 */
const workImages = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/work/*.{png,jpg,jpeg,webp,avif}',
  { eager: true }
);

export function workImage(filename: string | null | undefined): ImageMetadata | undefined {
  if (!filename) return undefined;
  const entry = Object.entries(workImages).find(([path]) => path.endsWith('/' + filename));
  return entry?.[1].default;
}

import portrait from '../assets/portrait/finn.jpg';
export const portraitImage = portrait;
