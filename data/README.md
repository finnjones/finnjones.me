# Keeping the site up to date

All changeable content on finnjones.me lives in **`data/profile.json`**. The three
HTML pages fetch it on load and render it with `js/render.js`. To update the site,
edit that one file, commit, and push — no HTML changes needed.

## What each field drives

| Field | Where it appears |
| --- | --- |
| `subheadline` | Home — hero paragraph under "Finn Jones." |
| `headline` + `location` | Home — "Currently" panel |
| `about` (array of paragraphs) | About — intro text next to the portrait |
| `experience` | About — "Where I've worked" timeline |
| `education` | About — "Where I've studied" timeline |
| `projects` | Home — project rows (title, description, tech tags, image, link) |
| `email` | Contact — the big email link |
| `socials` | Contact cards + footer links on every page |
| `linkedin` | Source-of-truth URL for the sync workflow below |

Notes:

- All strings render **verbatim** — dates are plain display text like `"2024"` /
  `"Present"`, so write them exactly as you want them shown. Empty `start`/`end`
  strings simply hide the date line.
- Project images live in `images/` and are referenced by relative path.
- New experience/education/project entries: copy an existing object in the array
  and edit it. Order in the file = order on the page.

## Syncing from LinkedIn

LinkedIn has no public API, so the sync is a quick assisted workflow. In a Claude
Code session (with the Claude in Chrome extension connected), ask:

> Open my LinkedIn profile (the `linkedin` field in data/profile.json) in my
> browser, compare it with data/profile.json, and update the JSON — experience,
> education, headline — to match. Don't change the schema.

Claude reads your logged-in profile, updates the JSON, and you review the diff
before pushing.

## Testing locally

The pages `fetch()` the JSON, which browsers block on `file://` URLs — so always
use a local server, never open the HTML files directly:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000/index.html.

## Before you push

Validate the JSON — a syntax error (stray comma, missing quote) blanks every
dynamic section on the live site:

```bash
python3 -m json.tool data/profile.json
```
