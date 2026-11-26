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

The page body is a bento system, not a stack of full-width bands:

- `Hero` is a 12-column grid: identity card `lg:col-span-6`, portrait
  `lg:col-span-3`, current roles + focus + quick links `lg:col-span-3`, a
  four-cell stats ribbon `lg:col-span-12` and a technology marquee
  `lg:col-span-12`.
- `Section` accepts a `rail` prop. On `lg+` it renders the heading in a
  `col-span-3` column (sticky from `xl`) and the content in `col-span-9`; below
  `lg` it stacks. Home, Projects, Experience, Skills, Apps, Education and Contact
  all use it.
- `SectionHeading` never splits into inner columns — it is used inside the rail,
  where a two-column split collapsed the title to one word per line.
- The projects index is `sm:grid-cols-2 lg:grid-cols-3`; its technology filter
  collapses to 14 chips with an `All N technologies` toggle (active filter always
  stays visible).
- Featured case studies use a scroll-pinned horizontal rail (`FeaturedRail`) that
  measures the real overflow distance, with a plain grid fallback below `lg` and
  for reduced motion.
- Contact tiles are a flex-wrap row whose items grow, so the last row fills the
  width instead of leaving empty slots.

Image `sizes` values in each grid match the column widths so the optimiser does
not over-fetch. `TimelineChart` scales to its container and keeps its
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

## Living background — “field of practice”

`AmbientBackground` mounts one inert canvas (`LivingBackground`) plus the grid
overlay. The canvas is `aria-hidden`, `pointer-events: none`, capped at DPR 1.5,
and pauses its rAF loop when the tab is hidden.

**Shapes.** Eight industry silhouettes — database, document, monitor, phone,
cloud, shield, chip, code — are authored as polygons in
`src/lib/background/glyph-shapes.ts`, resampled to equal 48-point rings and
centred. Equal point counts are what allow one shape to morph into the next.

**Motion.** Six glyphs at fixed anchors drift on two sine channels with a small
rotation. Each one holds a silhouette for 11 s, then morphs into the next over
3 s with a per-point wobble. The schedule and pointer maths live in
`src/lib/background/field.ts`; `field.test.ts` covers the ring bounds, morph
endpoints, pointer falloff and drift determinism.

**Icon reveal.** When a shape settles, the renderer draws that element's real
downloaded icon — the Lucide SVGs in `public/icons/field` (`database`,
`file-text`, `monitor`, `smartphone`, `cloud`, `shield`, `cpu`, `code-xml`;
ISC, see the LICENSE there). Each file is loaded once, rasterised at 256 px into
an offscreen canvas and gradient-tinted with the element's `ICON_TONES` pair, so
the actual stroke artwork is what the visitor sees. `iconAlpha()` in `field.ts`
keeps the icon at 1 through the hold, fades it to 0 in the first 18 % of a morph,
and brings the destination icon back over the last 28 %. The morph silhouette
itself is outline-only: no fill colour is ever painted. Covered by
`field.test.ts` (alpha boundaries, 1→0→1 cycle, one asset per motif).

**Content surfaces.** Every public band is wrapped by `Section` in a
`.glass-section` surface (blurred, bordered, canvas-tinted), and `.field-veil`
sits between the canvas and the page at 42 % canvas opacity. Dark
`--c-panel`/`--c-panel-strong` are 10 %/15 % white and `--c-muted`/`--c-faint`
were raised to `#a9b7c9`/`#8595a9`, so body copy, pills and metadata outrank the
animation even before a section's frost is drawn. Under reduced motion the field
is static but the same frost and contrast remain.

**Interaction.** The pointer is eased into the field; glyphs within ~34 % of the
shortest viewport side are pulled toward it and light up. A click adds a ripple
that expands over 1.2 s. Pointer listeners are on `window` (the canvas is inert),
and all interaction is skipped under `prefers-reduced-motion`, which paints one
static frame instead — with every glyph resting on its visible icon.

**Colour.** Accent stops are read from `--c-teal` / `--c-cyan` / `--c-violet` /
`--c-rose` at runtime and refreshed through a `MutationObserver` on
`<html class>`, so the canvas follows the light/dark toggle without a reload.

## Portrait

The portrait uses `profile.avatarPath` in the hero only — the About band used to
repeat it and now carries the at-a-glance panel instead. `ImageFrame` falls back
to deterministic monogram art when the field is empty or the image fails, and the
hero image carries a short `sizes` hint. Locally, the Docker media volume must
contain the uploaded file *and* the `profile.avatarPath` row must point at it —
a media file alone is not enough.

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
- The living canvas drops its fill/stroke alphas (`.06` / `.11` versus `.08` /
  `.16` in dark), and the grain to `.02` — the atmosphere stays, without washing
  contrast out of body text.
- `.glass` gains a soft shadow so cards read as surfaces on cream.
- `.label-mono` is 11 px / weight 600 / `.12em` tracking in both themes.

Component text that previously leaned on opacity (`text-ink/90` in the hero and
stats, `text-ink/85` in the image fallback monogram, the footer summary in
`text-faint`) now uses the solid tokens.

Dark mode tokens and its look are unchanged.

## Apps download links

`src/lib/app-releases.ts` maps an app-link slug to its rocket-launcher OTA
manifest (`portfolio-android` → `ota/gazi-portfolio`, `studio-android` →
`ota/studio-app`). `getAppLinks()` resolves Android entries on the server with
`fetch(..., { next: { revalidate: 300 } })`, copies the newest `apks` URL
(preferring arm64, then armeabi-v7a) over the stored `href`, and attaches the
published `versionName`/`versionCode`, which the card renders as
`Download APK · v0.3.6 (109)`. The admin-managed `href` remains the fallback
when the manifest cannot be read, so `/admin/app-links` needs no extra field and
keeps full control. `pickLatestApk()` is unit-tested in
`src/lib/app-releases.test.ts`.

---

## Verification used for this pass

Run inside the Docker stack, never on the host:

```powershell
powershell -ExecutionPolicy Bypass -File .\portfolio-deploy.ps1 -Action up -Build
powershell -ExecutionPolicy Bypass -File .\portfolio-deploy.ps1 -Action verify
cd gazi-portfolio\deploy
docker compose --env-file .env exec -T app sh -c "npm run typecheck && npm run lint && npm run test"
```

The suite is now five files / 49 tests: timeline, formatting, ATS PDF, the
background field maths (including icon-alpha timing and one asset per motif),
and the OTA-manifest release parser.

Browser checks at `http://127.0.0.1:8023` (`localhost` can resolve to a local
gatekeeper listener on `::8023`): every public route at 1440 and 1920 with no
horizontal overflow; carousel autoplay/pause/stop/play, thumbnails, keyboard,
touch swipe; lightbox at 2× with pan and Escape focus return; light-mode contrast
on canvas and glass; admin gallery reorder/alt/caption round-trip reflected in the
public slideshow; the living canvas animates (two pixel samples differ), reacts to
pointer movement and clicks, and is static under reduced motion. Each settled glyph
shows the real Lucide icon during the hold (checked in both themes at 1440), the
frosted sections keep copy readable over the field, the portrait appears exactly
once on `/`, and the Android download links resolve to the newest published
build with its version in the label.
