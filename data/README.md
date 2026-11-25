# Keeping the site up to date

All the content on finnjones.me lives in **`data/profile.json`**. The site is
built with [Astro](https://astro.build): at build time every page is rendered
from this one file. To update the site, edit `data/profile.json`, commit, and
push to `main`. GitHub Actions builds and deploys it (see
`.github/workflows/deploy.yml`).

## What each field drives

| Field | Where it appears |
| --- | --- |
| `intro` | Home: the large opening paragraphs |
| `description` | The meta description search engines and link previews show |
| `headline` | Job title in the structured data for search engines |
| `about` | `/about`: the paragraphs beside the photo |
| `experience` | Home (role and company) and `/about` (with highlights) |
| `education` | Home and `/about` |
| `capabilities` | `/about`: the Skills rows |
| `projects` | Home, and one `/work/<slug>` page per project |
| `socials` | Contact section on Home and `/about` |
| `email` | Contact section |

## The `projects` schema

```jsonc
{
  "slug": "liftlink",          // URL: /work/liftlink (unique, kebab-case)
  "title": "LiftLink",
  "year": "2025",
  "role": "Creator",
  "summary": "One sentence saying what it does.",
  "tech": ["React", "Node.js"],
  "problem": "What problem it solves.",
  "approach": "How it works.",
  "outcome": "Where it is now.",
  "link": "https://example.com",   // live URL, or null
  "repo": "https://github.com/finnjones/LiftLink", // source, or null
  "image": "liftlink.png",     // file in src/assets/work/, or null
  "imageAlt": "What the screenshot shows, for screen readers.",
  "lead": false,               // true shows it full width on the home page
  "gallery": [                 // optional extra screenshots on the project page
    { "image": "app-home.png", "caption": "What it shows.", "frame": "phone" } // frame: "wide" (default) or "phone"
  ]
}
```

- **Order in the file is the order on the site**, and sets Previous and Next
  on project pages.
- **`lead`** projects come first on the home page at full width. Keep it to
  two. The rest sit in pairs beneath them.
- **A project with no `image`** is listed as a text row under the screenshots.
  Add a screenshot of the running software and it joins the pairs. Do not
  draw a placeholder cover for it.
- **Images** go in `src/assets/work/` and are referenced by filename. Astro
  resizes them and converts them to WebP. The photo of Finn is
  `src/assets/portrait/finn.jpg`.

> **Dates.** Experience and education entries marked `"datesPlaceholder": true`
> are best guesses. Replace them with the correct years and remove the flag.

## Writing for the site

Read `DESIGN.md` first. In short: say what the thing does in plain sentences,
keep every number checkable, and separate lists with commas.

## Running locally

```bash
npm install
npm run dev      # dev server with hot reload
npm run check    # fails if a pattern DESIGN.md rules out has crept back in
npm run build    # production build into dist/
npm run preview  # preview the built site
```

## Before you push

```bash
python3 -m json.tool data/profile.json > /dev/null   # a syntax error fails the build
npm run check
```
