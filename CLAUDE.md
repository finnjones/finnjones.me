# finnjones.me

Finn Jones's personal site. Astro, static, no client-side JavaScript. All motion is CSS.

- Read `DESIGN.md` before changing any markup, CSS or copy. It lists the
  visual and writing patterns this site deliberately avoids.
- All content is in `data/profile.json`. `data/README.md` documents the fields.
- Run `npm run check` and `npm run build` before committing. The check fails
  if a ruled-out pattern has come back.
- Do not add dependencies for animation, icons or fonts.
- The sprites in `public/sprites/` are composed from Finn's TransitTracker art. Do not redraw or add to them.
- Pushing to `main` deploys to GitHub Pages.
