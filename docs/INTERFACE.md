# Interface — layout, gallery, light mode

The public site is dark-first, but its layout width, gallery behaviour and both
themes are defined once here so a future change does not have to rediscover them.

---

## Layout shell

Every public surface shares a single container width, declared in
`src/app/globals.css`:

```css
:root {
  --shell-max: 92rem; /* 1472px */
}
```

Consumers use `max-w-[var(--shell-max)]` — there is no second page width and no
per-page maximum:

| Surface | Container |
|---------|-----------|
| `Section` (all bands on home, projects, project detail, experience, contact) | `max-w-[var(--shell-max)]`, `px-4 sm:px-6 lg:px-8` |
| `Hero` | same shell, grid `lg:grid-cols-[1.5fr_0.8fr]` when current roles exist |
| `SiteNav`, `SiteFooter` | same shell |
| `/cv` | same shell |

Text stays readable at that width: prose paragraphs keep their own `max-w-2xl` /
`max-w-3xl` caps, and `SectionHeading` moves its lead paragraph beside the title
from `xl` up:

```
xl: grid-cols-[minmax(0,1.05fr) minmax(0,0.95fr)], items-end, gap-14
```

Below `xl` the heading and lead stack exactly as before. `align="center"` keeps
the old single centred column.

Grids consume the extra width rather than stretching cards: the projects index is
`sm:grid-cols-2 lg:grid-cols-3`, and the landing page's featured band is
`lg:grid-cols-2 2xl:grid-cols-3`. Image `sizes` values in those grids match the
new column widths so the optimiser does not over-fetch.

`TimelineChart` is unchanged: it scales to its container and keeps its
`min-w-[44rem]` horizontal-scroll fallback on small screens.

---

## Project gallery

`src/components/site/ProjectGallery.tsx` renders a slideshow, not a grid. It is a
client component and receives the project's `ProjectImageDto[]` exactly as
`getProjectBySlug()` returns it.

### Slide order

Array order is the order the admin panel saves. In `/admin/projects/[id]` the
gallery editor (`components/admin/gallery-editor.tsx`) owns that array: uploads
append, Move up / Move down reorder, Remove image deletes, and the project's
single Save writes the whole ordered list. A reorder in the panel is therefore a
reorder in the slideshow, with no separate gallery state to drift.

`alt` and `caption` are rendered as typed. An empty `alt` falls back to
`"<project title> — screenshot N"`; an empty caption falls back to
`"Screenshot N"`. Removing every image hides the gallery band on the project page
(the page only renders the section when `project.images.length > 0`).

### Controls

| Interaction | Behaviour |
|-------------|-----------|
| Autoplay | Advances every 5 s **only** while the pointer and keyboard focus are outside the image stage and the tab is visible |
| Hover / focus on the image stage | Pauses autoplay; leaving the stage resumes it (unless autoplay was stopped manually) |
| Any manual navigation | Stops autoplay permanently until Play is pressed |
| Play / Pause | Labelled pill, `aria-pressed`; disabled when there is one image or reduced motion is on |
| Previous / Next | Labelled pills on the stage and in the toolbar |
| Thumbnails | Jump to a slide; active one carries `aria-current` and a teal ring |
| Keyboard | ArrowLeft / ArrowRight while the gallery region has focus |
| Pointer | Drag the stage sideways (60 px threshold) |
| Enlarge / stage click | Opens `ImageLightbox` at the current slide |

The region is announced as a carousel (`aria-roledescription="carousel"`) with a
polite counter. `prefers-reduced-motion` disables autoplay entirely and sets
every slide transition to zero duration.

### Lightbox

`src/components/site/ImageLightbox.tsx` fills the viewport minus a small gutter
(`p-2 sm:p-4`), with a header (caption, counter, zoom, close), a flexible image
stage and a footer (caption, keyboard hint, navigation).

- Image is `object-contain` at `quality={90}`, `sizes` up to 1700 px; `/media/*`
  stays `unoptimized` because nginx serves those files.
- Click the image (or **Zoom 2×**) to scale to 2×; at 2× the image is draggable
  to pan. **Fit** returns to 1×. Slide change and close reset the zoom.
- Keyboard: Escape closes, ArrowLeft/ArrowRight step, Tab is trapped, and focus
  returns to the control that opened it.
- Body scroll is locked while the dialog is open and restored on close.
- The dialog is rendered with `createPortal` into `<body>`. The gallery lives inside
  a `Section`, which is `isolate`; without the portal the fixed dialog is trapped in
  that stacking context and the sticky header paints over it.

`ImageFrame` gained a `fit` prop for this: `cover` (default — cards, thumbnails)
and `contain` (gallery stage, so a screenshot never loses an edge to cropping).

---

## Light mode — warm paper

Both themes live in `src/app/globals.css`. Dark is the default
(`ThemeProvider`, `defaultTheme="dark"`); `.light` on `<html>` flips the semantic
tokens and nothing in a component hard-codes a colour.

| Token | Dark | Light |
|-------|------|-------|
| `--c-canvas` | `#060910` | `#fbf9f5` |
| `--c-canvas-2` | `#0b1220` | `#f4f0e9` |
| `--c-panel` | `rgba(255,255,255,.04)` | `rgba(255,255,255,.88)` |
| `--c-panel-strong` | `rgba(255,255,255,.07)` | `#ffffff` |
| `--c-line` | `rgba(255,255,255,.08)` | `rgba(23,19,16,.14)` |
| `--c-line-strong` | `rgba(255,255,255,.16)` | `rgba(23,19,16,.26)` |
| `--c-ink` | `#f8fafc` | `#171310` |
| `--c-muted` | `#94a3b8` | `#443c34` |
| `--c-faint` | `#64748b` | `#5c534a` |
| `--c-teal` | `#17c7b7` | `#0b6d66` |
| `--c-cyan` | `#2ad6ff` | `#076083` |
| `--c-violet` | `#a37ee1` | `#5b3e9c` |
| `--c-rose` | `#ff7ab6` | `#a63a6c` |

In light mode:

- `--c-muted` and `--c-faint` sit around 9:1 and 7:1 against the canvas, so small
  meta text is readable rather than decorative.
- The ambient aurora drops to `opacity: .18`, the glyphs to `.05` and the grain to
  `.02` — the atmosphere stays, without washing contrast out of body text.
- `.glass` gains a soft shadow so cards read as surfaces on cream.
- `.label-mono` is 12 px / weight 500 / `.12em` tracking in both themes.

Component text that previously leaned on opacity (`text-ink/90` in the hero and
stats, `text-ink/85` in the image fallback monogram, the footer summary in
`text-faint`) now uses the solid tokens.

Dark mode tokens and its look are unchanged.

---

## Verification used for this pass

Run inside the Docker stack, never on the host:

```powershell
powershell -ExecutionPolicy Bypass -File .\portfolio-deploy.ps1 -Action up -Build
powershell -ExecutionPolicy Bypass -File .\portfolio-deploy.ps1 -Action verify
docker compose -f gazi-portfolio\deploy\docker-compose.yml --env-file gazi-portfolio\deploy\.env exec -T app npm run typecheck
docker compose -f gazi-portfolio\deploy\docker-compose.yml --env-file gazi-portfolio\deploy\.env exec -T app npm run lint
docker compose -f gazi-portfolio\deploy\docker-compose.yml --env-file gazi-portfolio\deploy\.env exec -T app npm run test
```

Browser checks at `http://localhost:8023`: every public route at 1440 and 1920 with
no horizontal overflow; carousel autoplay/pause/stop/play, thumbnails, keyboard,
touch swipe; lightbox at 2× with pan and Escape focus return; light-mode contrast
on canvas and glass; admin gallery reorder/alt/caption round-trip reflected in the
public slideshow.
