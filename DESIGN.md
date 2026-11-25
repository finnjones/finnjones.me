# Design notes for finnjones.me

Read this before changing how the site looks or reads. `npm run check`
enforces the parts of it a script can test.

## What the site is for

Someone arrives from a job application, a GitHub profile or a link to one
project. On the first screen they should see who Finn is and every project
he has built, and something should already be moving. They should leave
remembering one thing: the site is a station.

## Where the look comes from

Finn designed TransitTracker as a "pocket platform": a station indicator
board drawn like a 16-bit game, with his own pixel vehicles as its moving
parts. The site is that board at full size. It borrows the app's sprites,
its four pixel typefaces, its Night colours and its rules:

- **Whole dots.** Sprites are drawn into a canvas at one pixel per art dot
  and scaled up without smoothing. Borders are whole dots too.
- **Flat colour.** No gradients, shadows, blur or texture.
- **Square corners.** Nothing on the site is rounded.
- **Type.** Pixelify (the app's patched copy, "TT Pixelify") for names and
  titles, Doto for the clock, Silkscreen for small labels, Jersey 15 for
  numerals. Long reading text falls back to Schibsted Grotesk, as the app
  falls back to a system face for long text.

Studied before choosing this, from the Awwwards developer winners and other
award sites (notes in the redesign conversation): every winner is built
around one literal object, puts the work on the first screen, stages its
first few seconds, keeps something moving with no input, and answers the
pointer. A big name over a paragraph has none of those.

## The parts

1. **The board.** The first screen, on sky blue. Finn's name, the live
   Sydney time, one line about him, then every project as a service row
   with its line badge and year. The lit row's screenshot and summary sit
   beside the list. A bar fills under the lit row and the board moves on to
   the next service; pointing at a row lights it at once.
2. **The platform.** Under the board, hanging from its posts. The lit
   service's vehicle pulls in, stops with its doors open, and leaves when
   the next one is called. Each project runs a different TransitTracker
   vehicle, and the ground changes with it: rails, a road, an overhead wire,
   water. The walking figure on the platform walks to where you point.
3. **Stations.** Each `lead` project gets a full screen in its line colour.
   On a tall enough screen it pins while its vehicle pulls in along the
   foot of the screen, stops, and leaves as the next station slides over.
4. **About.** A stopping pattern: roles as stops on a vertical line, as on
   the app's service screen, with the current one lit.
5. **The harbour.** The footer on every page: contact details, then the
   ferry crossing a strip of sea.

A project page opens with a band in the project's line colour and ends with
a band in the next project's colour. Page changes use the browser's
cross-page view transition, so the screenshot travels from the board to the
project page.

## Colour

| Name | Value | Used for |
| --- | --- | --- |
| Board | `#0c0c0a` | The board, the ground, outlines (the app's Night screen) |
| Board text | `#f3ecd8` | Text on the board, the lit row |
| Board secondary | `#a3a092`, divider `#3d3d38` | Years, labels, dashed rules |
| Sky | `#6cb6ff` | The first screen and the footer |
| Sun | `#ffd23f` | About, 404 |
| Sea | `#3f8fe8` | Water under the ferry |
| Paper | `#ffffff` | Reading sections on project pages |

Each project has a line colour (`color`) and a text colour that reads on it
(`ink`) in `data/profile.json`, taken from the Sydney network's line
colours. The livery of its vehicle is tinted in that colour at run time,
from the sprite's livery mask.

## Motion

What moves, and why it may:

- the vehicles and the walking figure, drawn frame by frame from the sprite
  sheets, with wheels that turn by the distance travelled;
- the board's refresh: its text flickers into place once per visit, as an
  indicator does, and the screenshot panel redraws top to bottom in steps;
- the bar under the lit row, and the clock;
- the ferry in the footer;
- the cross-page view transition.

Under `prefers-reduced-motion` the board does not cycle or flicker, the
vehicles stand at the platform, and pointing at a row swaps the vehicle
without it moving. Without JavaScript the board lists every project and a
train stands at the platform. Nothing fades in when scrolled to, and no
content is hidden until an animation shows it.

## Patterns that are ruled out

The list is "20 AI Design Slop Indicators" by Charles Liu
(@charles.unemployed). The right-hand column is what this site does instead.

| # | Ruled out | Instead |
| --- | --- | --- |
| 1 | Arrows on buttons and links | Link text says where it goes: `aforecite.com.au`, `Source on GitHub`, `How it works` |
| 2 | Dots between words | Commas in lists, space between links |
| 3 | Eyebrow labels above headings | A heading is the only label a section gets |
| 4 | Cream backgrounds | White, or a saturated colour |
| 5 | One italic word in a headline | Headings are one weight, upright. `<em>` is for titles of works in prose |
| 6 | Sparkle icons | No icons. The only pictures are screenshots, the photo and Finn's sprites |
| 7 | Everything in a card | Full-width fields of colour and ruled rows. Nothing sits in a box |
| 8 | The word "quiet" | Not used |
| 9 | Numbered sections | Sections have names. Numbers appear only where they are data: a year, the time |
| 10 | Pulsing green dots | No status indicators. The board says nothing is "live" |
| 11 | Blurry glows behind the hero | Flat colour only |
| 12 | Instrument Serif | TransitTracker's pixel faces, and Schibsted Grotesk for long text |
| 13 | Coloured left borders | Rules run the full width, in ink |
| 14 | Three icon cards in a row | Each project is shown at a size that follows its importance |
| 15 | Pills above the headline | No pills or tags, and no rounded corners. The only badges are square line codes, as on a real board |
| 16 | The word "real" | Not used |
| 17 | Made-up stats | No stat tiles or counters. A number appears in a sentence, and only if it can be checked |
| 18 | Two-word sentences | Full sentences in body copy |
| 19 | Sections fading in on scroll | Nothing reveals on scroll. Scrolling moves a vehicle; the content is already there |
| 20 | Dithering | Photos and screenshots are shown unfiltered. The sprites are Finn's own drawings, scaled by whole dots |

Also ruled out, from Anthropic's `frontend-design` skill, Impeccable and
`taste-skill`: gradient text, glass panels, monospace used for decoration,
hero statistics, marquees, em dashes, and
marketing words (seamless, powerful, robust, elevate, unlock).

## Writing

- Say what the thing does. "Fixes every AGLC4 footnote in a law essay" is
  the model: a verb, an object, no adjectives.
- First person on the home and About pages.
- Every figure must be one Finn can back up. If in doubt, leave it out.
- Australian spelling.
- Alt text describes what the screenshot shows.

## When adding something new

The vehicles are the one playful thing. Do not add a second mascot, an
illustration style or an icon set, and do not draw new sprites: use the ones
TransitTracker has. If a new section needs to stand out, give it a field of
colour and large type. A new project needs a line colour, a two-letter
code and a vehicle in `data/profile.json`.
