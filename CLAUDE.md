# finnjones.me

Finn Jones's personal site. Astro, static. The board and the platforms are drawn by a
small hand-written script (`src/scripts/`); every page still reads and works without it.

- Read `DESIGN.md` before changing any markup, CSS or copy. It lists the
  visual and writing patterns this site deliberately avoids.
- All content is in `data/profile.json`. `data/README.md` documents the fields.
- Run `npm run check` and `npm run build` before committing. The check fails
  if a ruled-out pattern has come back.
- Do not add dependencies for animation, icons or fonts. No GSAP, Lenis, three.js or similar.
- The sprites in `public/sprites/` and the fonts in `public/fonts/` come from Finn's TransitTracker app. Do not redraw or add to them.
- Pushing to `main` deploys to GitHub Pages.
