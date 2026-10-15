"use client";

import { ArrowDown, ArrowUp, ImagePlus, Images, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ActionButton } from "@/components/admin/action-button";
import { FieldShell } from "@/components/admin/fields";
import { uploadImages } from "@/components/admin/image-upload";
import type { ProjectImageInput } from "@/lib/admin/types";

/**
 * Project gallery management: upload many, reorder, alt/caption, delete.
 *
 * The whole ordered array is owned by the parent form and persisted by the same
 * "Save project" action that writes the project row — one save for one coherent
 * edit, and no way to save the text without the gallery or vice versa.
 *
 * Deleting a row removes the ProjectImage record; the WebP file stays on the
 * media volume (removing files that a cached page or an Open Graph card might
 * still be pointing at is a worse failure than a few unused kilobytes).
 */
export function GalleryEditor({
  images,
  onChange,
  hint,
  error,
  disabled,
}: {
  images: ProjectImageInput[];
  onChange: (next: ProjectImageInput[]) => void;
  hint?: string;
  error?: string;
  disabled?: boolean;
}) {
  const [pending, setPending] = useState(false);

  const addFiles = async (files: File[]) => {
    setPending(true);
    try {
      const uploaded = await uploadImages(files, "gallery");
      if (uploaded.length === 0) {
        toast.error("The upload returned no files.");
        return;
      }

      onChange([
        ...images,
        ...uploaded.map((image) => ({
          path: image.path,
          alt: "",
          caption: null,
          width: image.width,
          height: image.height,
        })),
      ]);

      toast.success(
        `Added ${uploaded.length} image${uploaded.length === 1 ? "" : "s"} — add alt text, then save.`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setPending(false);
    }
  };

  const update = (index: number, patch: Partial<ProjectImageInput>) => {
    onChange(images.map((image, position) => (position === index ? { ...image, ...patch } : image)));
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    const [moved] = next.splice(index, 1);
    if (moved === undefined) return;
    next.splice(target, 0, moved);
    onChange(next);
  };

  const missingAlt = images.filter((image) => image.alt.trim().length === 0).length;

  return (
    <FieldShell
      label="Gallery"
      hint={hint}
      error={error}
      accessory={
        <span className="font-mono text-[11px] text-faint">
          {images.length} image{images.length === 1 ? "" : "s"}
          {missingAlt > 0 ? ` · ${missingAlt} without alt text` : ""}
        </span>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <FileUploadButton onFiles={addFiles} pending={pending} disabled={disabled} />
          {images.length > 0 ? (
            <ActionButton
              icon={Trash2}
              label="Remove all"
              size="sm"
              variant="danger"
              disabled={pending || disabled}
              onClick={() => onChange([])}
            />
          ) : null}
        </div>

        {images.length === 0 ? (
          <p className="flex items-center gap-2 rounded-control border border-dashed border-line bg-canvas-2/25 px-3 py-3 text-xs text-faint">
            <Images aria-hidden className="size-4" />
            No gallery images yet. Uploads are converted to WebP and capped at 1920 px.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {images.map((image, index) => (
              <li
                key={`${image.path}-${index}`}
                className="flex flex-col gap-3 rounded-card border border-line bg-canvas-2/40 p-3 sm:flex-row"
              >
                <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-control border border-line bg-canvas-2/60 sm:h-20 sm:w-32">
                  {/* eslint-disable-next-line @next/next/no-img-element -- media volume asset, not a Next-optimised route */}
                  <img src={image.path} alt={image.alt} className="size-full object-cover" />
                  <span className="absolute left-1 top-1 rounded-full bg-canvas/80 px-1.5 py-0.5 font-mono text-[10px] text-muted">
                    {index + 1}
                  </span>
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <label className="flex flex-col gap-1">
                      <span className="text-[11px] text-muted">Alt text</span>
                      <input
                        value={image.alt}
                        onChange={(event) => update(index, { alt: event.target.value })}
                        placeholder="Describe the screenshot for screen readers"
                        className="w-full rounded-control border border-line bg-canvas-2/50 px-2.5 py-1.5 text-xs text-ink placeholder:text-faint focus:border-teal"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[11px] text-muted">Caption</span>
                      <input
                        value={image.caption ?? ""}
                        onChange={(event) =>
                          update(index, {
                            caption: event.target.value.length > 0 ? event.target.value : null,
                          })
                        }
                        placeholder="Optional caption shown under the image"
                        className="w-full rounded-control border border-line bg-canvas-2/50 px-2.5 py-1.5 text-xs text-ink placeholder:text-faint focus:border-teal"
                      />
                    </label>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="break-all font-mono text-[10px] text-faint">
                      {image.width}×{image.height} · {image.path}
                    </span>
                    <span className="flex flex-wrap items-center gap-1.5">
                      <ActionButton
                        icon={ArrowUp}
                        label="Move up"
                        size="sm"
                        variant="ghost"
                        disabled={index === 0}
                        onClick={() => move(index, -1)}
                      />
                      <ActionButton
                        icon={ArrowDown}
                        label="Move down"
                        size="sm"
                        variant="ghost"
                        disabled={index === images.length - 1}
                        onClick={() => move(index, 1)}
                      />
                      <ActionButton
                        icon={Trash2}
                        label="Remove image"
                        size="sm"
                        variant="danger"
                        onClick={() => onChange(images.filter((_, position) => position !== index))}
                      />
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </FieldShell>
  );
}

function FileUploadButton({
  onFiles,
  pending,
  disabled,
}: {
  onFiles: (files: File[]) => void;
  pending: boolean;
  disabled?: boolean;
}) {
  return (
    <label
      className={
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-control border border-line-strong bg-panel px-3 py-1.5 text-xs font-medium text-ink transition hover:border-teal/60 hover:bg-teal/10" +
        (disabled || pending ? " pointer-events-none opacity-55" : "")
      }
    >
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        className="sr-only"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = "";
          if (files.length > 0) onFiles(files);
        }}
      />
      <ImagePlus aria-hidden className="size-4" />
      <span>{pending ? "Uploading…" : "Upload images"}</span>
    </label>
  );
}
