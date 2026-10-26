# Project image placeholders

Project cover/gallery images are managed media stored under `/media/projects/...webp`
(see `src/lib/media/storage.ts` and `src/lib/media/webp.ts`). Until real screenshots
are uploaded through the admin panel, each project's `coverPath` stays `null` and the
public site renders a deterministic per-project placeholder plate (see
`src/components/ui/ImageFrame.tsx` — aurora gradient + monogram derived from the slug).

## Replacing a placeholder with a real screenshot

1. Open the admin panel → Projects → edit the project.
2. Upload the screenshot in the "Cover" / "Gallery" section. It is converted to WebP
   (max 1920px, quality 80) and stored as `/media/projects/YYYY/MM/<uuid>.webp`.
3. Save. `coverPath` becomes the new media URL and is preserved across re-seeds
   (the seed never overwrites `coverPath` or `ProjectImage` rows).

## Conventions

- Preferred aspect ratio: 16:9 (1920x1080) for covers; 4:3 or 16:9 for gallery.
- Keep file size under 10 MB before upload (enforced by the media pipeline).
- `sample.svg` in this folder is only a reference; do not reference it from the DB.
