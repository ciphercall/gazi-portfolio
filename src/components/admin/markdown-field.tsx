"use client";

import { Eye, FileText } from "lucide-react";
import { useId } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Markdown body editor with a live preview.
 *
 * The preview renders with the same `prose-aurora` styles the public project
 * page uses, so what the owner sees here is what the page will show. It is
 * deliberately read-only and scrolls inside its own panel — a long body must not
 * be able to push the Save bar off screen.
 */
export function MarkdownField({
  label,
  value,
  onChange,
  error,
  hint,
  rows = 16,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  error?: string;
  hint?: string;
  rows?: number;
}) {
  const textareaId = useId();

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={textareaId} className="flex items-center gap-1.5 text-xs font-medium text-muted">
          <FileText aria-hidden className="size-3.5 text-faint" />
          {label}
        </label>
        <span className="font-mono text-[11px] text-faint">{value.length} characters</span>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <textarea
            id={textareaId}
            value={value}
            rows={rows}
            spellCheck={false}
            onChange={(event) => onChange(event.target.value)}
            placeholder={"## What it does\n\n- A bullet\n- Another bullet\n\n[Link text](https://example.com)"}
            className={
              "w-full resize-y rounded-control border bg-canvas-2/50 px-3 py-2 font-mono text-xs leading-relaxed text-ink placeholder:text-faint " +
              (error ? "border-rose/70 focus:border-rose" : "border-line focus:border-teal")
            }
          />
          <p className="text-[11px] text-faint">
            Markdown with GFM tables and task lists. Headings start at ### for a tidy outline.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted">
            <Eye aria-hidden className="size-3.5 text-faint" />
            Live preview
          </span>
          <div className="max-h-[32rem] min-h-40 overflow-y-auto rounded-control border border-line bg-canvas-2/30 px-4 py-3 text-sm text-muted">
            {value.trim().length === 0 ? (
              <p className="text-faint">Nothing to preview yet.</p>
            ) : (
              <div className="prose-aurora">
                <Markdown remarkPlugins={[remarkGfm]}>{value}</Markdown>
              </div>
            )}
          </div>
        </div>
      </div>

      {hint ? <p className="text-xs text-faint">{hint}</p> : null}
      {error ? (
        <p role="alert" className="text-xs text-rose">
          {error}
        </p>
      ) : null}
    </div>
  );
}
