# Design notes for finnjones.me

Read this before changing how the site looks or reads. `npm run check`
enforces the parts of it a script can test.

## What the site is for

Someone arrives from a job application, a GitHub profile or a link to one
project. Within a screen they should know who Finn is, and by the second
screen they should be looking at something he built. They should also leave
remembering one thing about the site: the train.

## Where the look comes from

Finn drew a set of pixel sprites for TransitTracker: a Sydney double-deck
train, a harbour ferry, a bus. The site borrows two of them and takes its
visual rules from how they are drawn.

- **Flat colour.** Each section is one solid field. No gradients, shadows,
  blur or texture.
- **Ink outlines.** The sprites have a hard black outline, so screenshots get a
  3px ink border and lists are divided by 3px ink rules.
- **Square corners.** Nothing on the site is rounded.
- **Heavy type at a large size.** Schibsted Grotesk at weight 800 for names and
  titles, 450 to 650 for text. One family, no monospace, no serif.

Reference sites studied for structure, not copied: Dennis Snellenberg (a name
set at full width), Rauno Freiberg (flat colour and very large type), Robb
Owen and Adham Dannaway (one idea that could only belong to that person),
Brittany Chiang (work reachable in one scroll).

## The parts

1. **The line.** A black rail is fixed to the top of every page. The train
   starts at the left and its position is how far down the page you are.
   This is CSS only (`animation-timeline: scroll()`); in a browser without it,
   or with reduced motion set, the train stays parked at the left.
2. **The hero.** Yellow. Two short paragraphs, the photo, and the name at the
   full width of the page.
3. **Stages.** The three `lead` projects each get a full screen in their own
   colour: the title very large, one sentence, the stack, links and a
   screenshot. On a tall enough screen each stage pins under the rail and the
   next slides over it.
4. **Earlier work.** Large rows on white. A row fills with the project's
   colour when pointed at.
5. **About.** One paragraph and the list of roles.
6. **The harbour.** The footer on every page: contact details on sky blue,
   then the ferry crossing a strip of sea.

A project page opens with a band in that project's colour and ends with a
band in the next project's colour. Page changes use the browser's own
cross-page view transition, so a screenshot and title travel from the home
page to the project page.

## Colour

| Name | Value | Used for |
| --- | --- | --- |
| Ink | `#0d0d0d` | Text, outlines, the rail, TransitTracker's stage |
| Paper | `#ffffff` | Reading sections |
| Sun | `#ffd23f` | Hero, About, 404 |
| Sky | `#6cb6ff` | Footer (the sprites' water colour) |
| Sea | `#3f8fe8` | The strip the ferry sails on |
| Cream | `#f3ecd8` | Text on ink, and inside the sprites. Never a background |

Each project also has its own `color` and `ink` in `data/profile.json`. A new
project needs a colour no other project uses, and `ink` must reach 4.5:1
against it.

There is no accent colour and no dark mode. Links are the text colour with a
thick underline, and the two colours swap on hover.

## Motion

Three things move, and nothing else should:

- the train, driven by scrolling;
- the ferry, slowly, in the footer;
- the cross-page view transition.

All three stop under `prefers-reduced-motion`. Nothing fades or slides in
when it scrolls into view, and nothing is hidden until an animation shows it.

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
| 6 | Sparkle icons | No icons. The only pictures are screenshots, the photo and the two sprites |
| 7 | Everything in a card | Full-width fields of colour and ruled rows. Nothing sits in a box |
| 8 | The word "quiet" | Not used |
| 9 | Numbered sections | Sections have names. Numbers appear only where they are data, such as a year |
| 10 | Pulsing green dots | No status indicators |
| 11 | Blurry glows behind the hero | Flat colour only |
| 12 | Instrument Serif | Schibsted Grotesk only |
| 13 | Coloured left borders | Rules run the full width, in ink |
| 14 | Three icon cards in a row | Each project is shown at a size that follows its importance |
| 15 | Pills above the headline | No pills, badges or tags, and no rounded corners |
| 16 | The word "real" | Not used |
| 17 | Made-up stats | No stat tiles or counters. A number appears in a sentence, and only if it can be checked |
| 18 | Two-word sentences | Full sentences in body copy |
| 19 | Sections fading in on scroll | See Motion |
| 20 | Dithering | Photos and screenshots are shown unfiltered. The sprites are drawn pixel by pixel and scaled with `image-rendering: pixelated` |

Also ruled out, from Anthropic's `frontend-design` skill, Impeccable and
`taste-skill`: gradient text, glass panels, monospace used for decoration,
uppercase letterspaced labels, hero statistics, marquees, em dashes, and
marketing words (seamless, powerful, robust, elevate, unlock).

## Writing

- Say what the thing does. "Fixes every AGLC4 footnote in a law essay" is
  the model: a verb, an object, no adjectives.
- First person on the home and About pages.
- Every figure must be one Finn can back up. If in doubt, leave it out.
- Australian spelling.
- Alt text describes what the screenshot shows.

## When adding something new

The sprites are the one playful thing. Do not add a second mascot, an
illustration style, an icon set or another animated element. If a new section
needs to stand out, give it a field of colour and large type.
