# Keeping the site up to date

All changeable content on finnjones.me lives in **`data/profile.json`**. The site
is built with [Astro](https://astro.build): at build time every page is
pre-rendered from this one file, so the content is real HTML (good for SEO and
speed) while you still edit a single JSON file. To update the site, edit
`data/profile.json`, commit, and push to `main` — GitHub Actions builds and
deploys automatically (see `.github/workflows/deploy.yml`).

## What each field drives

| Field | Where it appears |
| --- | --- |
| `positioning` | Hero + about — the "speaks finance" line |
| `subheadline` | Hero — paragraph under the name |
| `headline` | SEO title, JSON-LD, status pill |
| `status` | Top-bar status pill (`available`, `label`, `detail`) |
| `about` | Home profile block + `/about` intro |
| `metrics` | Home — the animated counters (`value` counts up; `text` shows as-is) |
| `skills` | Home — the stock-style ticker (`symbol`, `name`, `trend`) |
| `capabilities` | Home — the capabilities matrix |
| `experience` | Home `03` + `/about` — role ledger |
| `education` | Home `03` + `/about` — education ledger |
| `projects` | Home `01` ledger index **and** each `/work/<slug>` case study |
| `socials` | Footer + contact section |
| `email` | Contact — the giant click-to-copy email |

## The `projects` schema

Each project is one case study. Fields:

```jsonc
{
  "slug": "liftlink",          // URL: /work/liftlink  (unique, kebab-case)
  "symbol": "LIFT",            // ticker shown in the ledger
  "title": "LiftLink",
  "year": "2025",
  "role": "Creator",
  "summary": "One-line description.",
  "tech": ["JavaScript", "Node.js"],   // first 3–4 show in the index
  "problem": "What problem it solves.",
  "approach": "How it works.",
  "outcome": "The result.",
  "metrics": [ { "value": "OAuth", "label": "Strava connect" } ],
  "link": "https://…",         // live URL, or null
  "repo": "https://github.com/…", // source, or null
  "image": "liftlink.png",     // file in src/assets/work/, or null
  "cover": "signal",           // "image" | "code" | "chart" | "signal"
  "featured": true
}
```

- **`cover`** picks the card artwork. Use `"image"` with an `image` file for a
  real screenshot; otherwise a generated cover is drawn: `"code"` (terminal),
  `"chart"` (candlesticks), or `"signal"` (activity waves).
- **Images** go in `src/assets/work/` and are referenced by filename. Astro
  optimizes them automatically (resizes + webp). The portrait is
  `src/assets/portrait/finn.jpg`.
- **Order in the file = order on the site**, and drives prev/next on case pages.

> **Note:** experience/education dates marked `"datesPlaceholder": true` are
> best-effort placeholders — replace them with your real dates and drop the flag.

## Running locally

```bash
npm install
npm run dev      # dev server with hot reload
npm run build    # production build into dist/
npm run preview  # preview the built site
```

## Before you push

Validate the JSON — a syntax error will fail the build:

```bash
python3 -m json.tool data/profile.json
```
