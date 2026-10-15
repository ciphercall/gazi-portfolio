# CV PDF pipeline

Two CVs ship from the same content. They are different documents, not one document in two colours.

---

## The two variants

### Designed — `/api/cv/designed`

The site's own design language, printed to A4 by headless Chromium.

- Source: `src/app/render/cv/designed/page.tsx` + `CvDocument.tsx` + `print.css`
- Renderer: `src/lib/pdf/designed.ts` using `playwright-core` against the system Chromium
  (`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`, default `/usr/bin/chromium-browser`)
- Chromium launch flags include `--no-sandbox` and `--disable-dev-shm-usage`, which are required
  in a container; the renderer only ever loads this project's own markup
- Uses the Midnight Aurora palette, so the PDF and the site are visibly the same product

### ATS-friendly — `/api/cv/ats`

A deliberately plain document, and the one that matters to an applicant-tracking system.

- Source: `src/lib/pdf/ats.tsx`, built with `@react-pdf/renderer` as **structured data, not HTML**
- The rules it follows, each of which exists to keep a parser happy:
  - strict single column — no columns, no tables, no sidebars
  - no images, no icons, no graphics, no text baked into shapes
  - built-in **Helvetica** families only (base-14, not embedded)
  - real selectable text, no letter-spacing tricks
  - conventional headings in a fixed order: `Professional Summary`, `Experience`, `Education`,
    `Skills`, `Certifications`, `Projects`
  - dates as `Month YYYY`, positions and companies on their own lines
  - plain hyphen bullets, one fact per line

## Why the ATS variant is tested rather than trusted

`src/lib/pdf/ats.test.ts` constructs the PDF, extracts **its own text layer** with `pdfjs-dist`, and
asserts:

- every required section heading is present, in the right relative order
- every expected job title and company appears
- dates match the `Month YYYY` format
- the document contains no image XObjects
- the extracted text is substantial (i.e. the text is genuinely text)

Run it with:

```powershell
npx vitest run src/lib/pdf
```

A change that makes the PDF prettier but unparseable fails this test, which is the entire point.

## How "updated" is guaranteed

Every generated file is recorded in the `GeneratedAsset` table alongside a `sourceHash` — a
fingerprint of **all** CV-relevant content (profile, experiences, education, skills,
certifications, projects).

1. An admin saves anything (`touchContent()` in `src/lib/cache.ts`).
2. `after()` schedules `regenerateAllCvAssets()` — after the HTTP response has been sent, so the
   save is never blocked by a multi-second Chromium run.
3. Each variant is re-rendered, and its `sourceHash` and `sha256` are recorded.
4. `ensureCvAsset()` — used by the download routes — compares the stored hash against the current
   content and regenerates on mismatch.

So the file a visitor downloads is current by construction, not by anyone remembering to press a
button. If a background regeneration fails, the failure is stored on the row, the previous file is
left in place, and the next save retries.

`/admin/cv` shows both variants with their timestamp, size, stored hash and whether the cache is
currently stale, plus a **Regenerate now** button that forces it.

## Endpoints

| Endpoint | Result |
|----------|--------|
| `GET /api/cv/designed` | The designed PDF, `Content-Disposition: attachment` |
| `GET /api/cv/ats` | The ATS PDF, `Content-Disposition: attachment` |
| `GET /api/cv/<kind>?inline=1` | Same file, `Content-Disposition: inline` (used by the Android app for in-app preview) |

Both set a long-lived `Cache-Control` and are served off the media volume by nginx rather than
through the Node process.

## Internal render surfaces

`/render/cv/designed` and `/render/cv/ats` exist only so Chromium can print them. They are gated by
a short-lived HMAC token (`signRenderToken()` / `verifyRenderToken()` in `src/lib/crypto.ts`) and
return 404 without a valid one, and they carry `X-Robots-Tag: noindex` from `next.config.ts`.

## Adding or reordering content

Both variants read `getCvSource()` in `src/lib/queries.ts`. Anything added to that function's return
value is automatically:

- included in the `sourceHash`, so edits invalidate the cached PDFs
- available to both generators

Add a field there and in the two generators; there is no third place to update.
