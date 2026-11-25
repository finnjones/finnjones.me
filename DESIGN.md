# Design notes for finnjones.me

Read this before changing how the site looks or reads. `npm run check`
enforces the parts of it a script can test.

## What the site is for

Someone arrives from a job application, a GitHub profile or a link to one
project. Within a screen they should know who Finn is and be looking at
something he built. The site's own interface should be the least memorable
thing on it.

## The four decisions

1. **The screenshots are the only pictures.** No illustration, no generated
   cover art, no background texture, no icons. A project with no screenshot
   is listed as text until it has one.
2. **One typeface.** Schibsted Grotesk, in two weights (400 and 650, with 500
   for the large paragraphs) and five sizes, all defined in
   `src/styles/global.css`. No second family, no monospace.
3. **One colour, and it means "link".** Text is ink on white (or the reverse
   in dark mode, which follows the visitor's system setting). Red is used for
   links and for the keyboard focus ring and for nothing else. Header
   navigation and project titles are links in ink, underlined on hover, so the
   red stays rare.
4. **Nothing moves.** No scroll effects, entrance animation, smooth-scroll
   library, custom cursor, loading screen or page transition. The site ships
   no JavaScript.

## Layout

- A twelve-column grid inside an 84rem page (`.page`, `.grid`).
- Text sections put their heading in the left three columns and their content
  in the next eight (`.side`, `.main`). On phones they stack.
- Home page order: opening paragraphs and photo, Work, Experience, Contact.
- Work: `lead` projects at full width, then the rest in pairs, then any
  project without a screenshot as a text row.
- Structure comes from space and 1px rules. Nothing sits inside a box.
- Screenshots get a 6px corner and a 1px outline so white ones do not
  dissolve into the page. That is the only radius on the site.

## Patterns that are ruled out

The list is "20 AI Design Slop Indicators" by Charles Liu
(@charles.unemployed). The right-hand column is what this site does instead.

| # | Ruled out | Instead |
| --- | --- | --- |
| 1 | Arrows on buttons and links | Link text says where it goes: `aforecite.com.au`, `Source on GitHub`, `More about me` |
| 2 | Dots between words | Commas in lists, space between links |
| 3 | Eyebrow labels above headings | A heading is the only label a section gets |
| 4 | Cream backgrounds | White, or near-black in dark mode |
| 5 | One italic word in a headline | Headings are one weight, upright. `<em>` is for titles of works in prose |
| 6 | Sparkle icons | No icons at all |
| 7 | Everything in a card | No boxes. Rows are separated by a 1px rule |
| 8 | The word "quiet" | Not used |
| 9 | Numbered sections | Sections have names. Numbers appear only where they are data, such as a year |
| 10 | Pulsing green dots | No status indicators |
| 11 | Blurry glows behind the hero | No gradients, blur or shadows |
| 12 | Instrument Serif | Schibsted Grotesk only |
| 13 | Coloured left borders | Rules run the full width, top and bottom, in grey |
| 14 | Three icon cards in a row | Projects are shown as screenshots, at sizes that follow their importance |
| 15 | Pills above the headline | No pills, badges or tags. The only rounded corners are on screenshots |
| 16 | The word "real" | Not used |
| 17 | Made-up stats | No stat tiles or counters. A number appears in a sentence, and only if it can be checked |
| 18 | Two-word sentences | Full sentences |
| 19 | Sections fading in on scroll | Nothing animates |
| 20 | Dithering | Photos and screenshots are shown unfiltered |

Also ruled out, from Anthropic's `frontend-design` skill, Impeccable, and
`taste-skill`: gradient text, glass panels, monospace used for decoration,
uppercase letterspaced labels, hero statistics, marquees and tickers, em
dashes, and marketing words (seamless, powerful, robust, elevate, unlock).

## Writing

- Say what the thing does. "Fixes every AGLC4 footnote in a law essay" is
  the model: a verb, an object, no adjectives.
- First person on the home and About pages.
- Every figure must be one Finn can back up. If in doubt, leave it out.
- Australian spelling.
- Alt text describes what the screenshot shows.

## When adding something new

Ask whether it gives the visitor information. A new project, a better
screenshot, a corrected date or a clearer sentence all do. A new visual
treatment almost never does. If a change needs a new colour, a second font,
an icon or an animation, the answer is to leave it out.
