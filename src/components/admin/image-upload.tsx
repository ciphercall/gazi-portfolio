"use client";

import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { ActionButton } from "@/components/admin/action-button";
import { FieldShell } from "@/components/admin/fields";
import type { AdminMediaSubfolder, UploadedImage } from "@/lib/admin/types";

/**
 * Client half of `/api/admin/upload`.
 *
 * The server decides what an image is; this only carries the bytes and reports
 * the outcome. Uploads are always multi-file: the gallery drops twenty at once,
 * and one-at-a-time would be twenty round trips for no benefit.
 */

const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";

export async function uploadImages(
  files: File[],
  subfolder: AdminMediaSubfolder,
): Promise<UploadedImage[]> {
  if (files.length === 0) return [];

  const form = new FormData();
  form.set("subfolder", subfolder);
  for (const file of files) form.append("files", file);

  const response = await fetch("/api/admin/upload", { method: "POST", body: form });
  const payload = (await response.json().catch(() => null)) as
    | { ok?: boolean; message?: string; files?: UploadedImage[] }
    | null;

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.message ?? `Upload failed (${response.status}).`);
  }

  return payload.files ?? [];
}

/** Hidden native picker triggered by a labelled button — no icon-only controls. */
function FilePicker({
  label,
  multiple,
  disabled,
  onFiles,
  variant = "secondary",
  size = "sm",
  pending = false,
}: {
  label: string;
  multiple?: boolean;
  disabled?: boolean;
  onFiles: (files: File[]) => void;
  variant?: "primary" | "secondary";
  size?: "sm" | "md";
  pending?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple={multiple}
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          // Reset first: picking the same file twice must still fire onChange.
          event.target.value = "";
          if (files.length > 0) onFiles(files);
        }}
      />
      <ActionButton
        icon={multiple ? ImagePlus : Upload}
        label={label}
        variant={variant}
        size={size}
        disabled={disabled}
        pending={pending}
        pendingLabel="Uploading…"
        onClick={() => inputRef.current?.click()}
      />
    </>
  );
}

/**
 * Single image (avatar, project cover).
 *
 * The stored value is the WebP's public path; the preview reads from the media
 * volume through nginx, which is why this is a plain `<img>` — routing a private
 * admin thumbnail through the on-demand image optimiser buys nothing.
 */
export function ImagePicker({
  label,
  value,
  onChange,
  subfolder,
  hint,
  error,
  required,
  aspect = "square",
}: {
  label: string;
  value: string | null;
  onChange: (next: string | null) => void;
  subfolder: AdminMediaSubfolder;
  hint?: string;
  error?: string;
  required?: boolean;
  aspect?: "square" | "wide";
}) {
  const [pending, setPending] = useState(false);

  const pick = async (files: File[]) => {
    setPending(true);
    try {
      const uploaded = await uploadImages(files, subfolder);
      const first = uploaded[0];
      if (!first) {
        toast.error("The upload returned no file.");
        return;
      }
      onChange(first.path);
      toast.success(`Uploaded ${first.width}×${first.height} WebP. Save the form to keep it.`);
    } catch (uploadError) {
      toast.error(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setPending(false);
    }
  };

  return (
    <FieldShell
      label={label}
      hint={hint}
      error={error}
      required={required}
      accessory={
        value ? (
          <span className="font-mono text-[11px] text-faint">
            {value.split("/").pop()}
          </span>
        ) : null
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div
          className={
            aspect === "square"
              ? "relative size-24 shrink-0 overflow-hidden rounded-control border border-line bg-canvas-2/50"
              : "relative h-24 w-40 shrink-0 overflow-hidden rounded-control border border-line bg-canvas-2/50"
          }
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element -- media volume asset, not a Next-optimised route
            <img src={value} alt="" className="size-full object-cover" />
          ) : (
            <span className="flex size-full items-center justify-center">
              <ImagePlus aria-hidden className="size-5 text-faint" />
            </span>
          )}
          {pending ? (
            <span className="absolute inset-0 flex items-center justify-center bg-canvas/70">
              <Loader2 aria-hidden className="size-4 animate-spin text-teal" />
            </span>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <FilePicker
              label={value ? "Replace image" : "Upload image"}
              onFiles={pick}
              disabled={pending}
              variant="secondary"
            />
            {value ? (
              <ActionButton
                icon={Trash2}
                label="Remove image"
                size="sm"
                variant="danger"
                disabled={pending}
                onClick={() => onChange(null)}
              />
            ) : null}
          </div>

          <p className="break-all text-[11px] text-faint">
            {value ?? "No image set. JPEG, PNG, WebP or AVIF up to 10 MB — converted to WebP."}
          </p>
        </div>
      </div>
    </FieldShell>
  );
}
