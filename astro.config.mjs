// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://finnjones.me',
  trailingSlash: 'ignore',
  integrations: [sitemap()],
  // Keep old links alive after the Astro migration.
  redirects: {
    '/about.html': '/about',
    '/contact.html': '/#contact',
  },
  build: {
    inlineStylesheets: 'auto',
  },
  vite: {
    build: {
      cssMinify: 'lightningcss',
    },
  },
});
