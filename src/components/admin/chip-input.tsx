"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";

import { ActionButton } from "@/components/admin/action-button";
import { FieldShell } from "@/components/admin/fields";

/**
 * Chip input for free-form lists (tags, tech stack).
 *
 * Enter or the "Add" button commits the draft; duplicates are ignored rather
 * than rejected, because a tag list is a set and telling someone off for typing
 * "Laravel" twice is noise.
 */
export function ChipInput({
  label,
  value,
  onChange,
  hint,
  error,
  placeholder = "Type and press Enter",
  required,
  emptyNote = "Nothing added yet.",
}: {
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
  hint?: string;
  error?: string;
  placeholder?: string;
  required?: boolean;
  emptyNote?: string;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const next = draft.trim();
    if (!next) return;
    if (!value.some((item) => item.toLowerCase() === next.toLowerCase())) {
      onChange([...value, next]);
    }
    setDraft("");
  };

  return (
    <FieldShell
      label={label}
      hint={hint}
      error={error}
      required={required}
      accessory={<span className="font-mono text-[11px] text-faint">{value.length}</span>}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                add();
              }
            }}
            placeholder={placeholder}
            className="w-full rounded-control border border-line bg-canvas-2/50 px-3 py-2 text-sm text-ink placeholder:text-faint focus:border-teal"
          />
          <ActionButton icon={Plus} label="Add" size="sm" variant="secondary" onClick={add} />
        </div>

        {value.length === 0 ? (
          <p className="text-xs text-faint">{emptyNote}</p>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {value.map((item, index) => (
              <li
                key={`${item}-${index}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-panel py-1 pl-2.5 pr-1 text-xs text-ink"
              >
                <span className="max-w-56 truncate">{item}</span>
                <button
                  type="button"
                  onClick={() => onChange(value.filter((_, position) => position !== index))}
                  className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] text-faint transition hover:bg-rose/15 hover:text-rose"
                >
                  <X aria-hidden className="size-3" />
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </FieldShell>
  );
}
