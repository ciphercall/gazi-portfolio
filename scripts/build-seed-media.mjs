// build-seed-media.mjs — one-time (re-runnable) importer for portfolio-render-lab screenshots.
//
// Reads <source>/catalog/projects.json, copies each project's webp screenshots
// into <out>/<slug>/<view>.webp and writes <out>/manifest.json consumed by
// prisma/seed.ts.
//
// Usage:
//   node scripts/build-seed-media.mjs
//   node scripts/build-seed-media.mjs --source C:/path/to/portfolio-render-lab --out ./seed-media

import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { existsSync } from "node:fs";

const args = process.argv.slice(2);
function arg(name, fallback) {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return fallback;
  return args[i + 1] ?? fallback;
}

const source = path.resolve(arg("source", "C:/Users/ciphe/Documents/GitHub/portfolio-render-lab"));
const out = path.resolve(arg("out", path.join(process.cwd(), "seed-media")));

const catalogPath = path.join(source, "catalog", "projects.json");
const catalog = JSON.parse(await readFile(catalogPath, "utf8"));

function humanize(view) {
  return view
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

let projectCount = 0;
let viewCount = 0;
const manifest = {};

for (const project of catalog.projects) {
  const slug = project.slug;
  const kind = project.kind; // web | desktop | mobile | cli
  const srcDir = path.join(source, "screenshots", kind, slug);
  const outDir = path.join(out, slug);
  await mkdir(outDir, { recursive: true });

  // Order: 'main' first, then the rest in catalog order.
  const viewIds = [...project.views.map((v) => v.id)];
  const ordered = viewIds.includes("main")
    ? ["main", ...viewIds.filter((v) => v !== "main")]
    : viewIds;

  const images = [];
  for (const view of ordered) {
    const webpSrc = path.join(srcDir, `${view}.webp`);
    const pngSrc = path.join(srcDir, `${view}.png`);
    const srcFile = existsSync(webpSrc) ? webpSrc : existsSync(pngSrc) ? pngSrc : null;
    if (!srcFile) {
      console.warn(`  MISSING screenshot: ${kind}/${slug}/${view}`);
      continue;
    }
    const ext = path.extname(srcFile);
    const outName = `${view}.webp`;
    // If source was png, still write .webp name? Better keep original ext.
    const finalName = `${view}${ext}`;
    const outPath = path.join(outDir, finalName);
    await copyFile(srcFile, outPath);

    // dimensions from meta.json
    let width = 0;
    let height = 0;
    const metaPath = path.join(srcDir, `${view}.meta.json`);
    if (existsSync(metaPath)) {
      try {
        const meta = JSON.parse(await readFile(metaPath, "utf8"));
        width = meta.width ?? 0;
        height = meta.height ?? 0;
      } catch {
        // ignore
      }
    }

    const relativePath = `projects/seed/${slug}/${finalName}`;
    const alt = `${project.title} — ${view}`;
    const caption = view === "main" ? "Main view" : humanize(view);

    images.push({ view, relativePath, alt, caption, width, height });
    viewCount++;
  }

  if (images.length === 0) continue;

  const coverImage = images.find((i) => i.view === "main") ?? images[0];
  manifest[slug] = {
    cover: coverImage.relativePath,
    images,
  };
  projectCount++;
  console.log(`  ${slug}: ${images.length} views`);
}

await writeFile(path.join(out, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
console.log(`\nDone: ${projectCount} projects, ${viewCount} views -> ${out}`);
console.log(`Manifest: ${path.join(out, "manifest.json")}`);
