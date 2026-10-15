"use client";

import { ArrowDown, ArrowUp, ListPlus, Trash2 } from "lucide-react";

import { ActionButton } from "@/components/admin/action-button";
import { FieldShell } from "@/components/admin/fields";

/**
 * Repeatable bullet rows.
 *
 * These become `Experience.bullets` (and the CV's achievement lines), so order
 * matters and is editable in place — the same up/down language as the list
 * pages, one grain finer.
 */
export function BulletListEditor({
  label,
  value,
  onChange,
  hint,
  error,
  placeholder = "Describe one outcome, ideally with a number in it",
}: {
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
  hint?: string;
  error?: string;
  placeholder?: string;
}) {
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    const [moved] = next.splice(index, 1);
    if (moved === undefined) return;
    next.splice(target, 0, moved);
    onChange(next);
  };

  return (
    <FieldShell
      label={label}
      hint={hint}
      error={error}
      accessory={<span className="font-mono text-[11px] text-faint">{value.length}</span>}
    >
      <div className="flex flex-col gap-2">
        {value.length === 0 ? (
          <p className="rounded-control border border-dashed border-line bg-canvas-2/25 px-3 py-2 text-xs text-faint">
            No bullets yet — add the achievements you want on the CV.
          </p>
        ) : null}

        {value.map((bullet, index) => (
          <div key={index} className="flex flex-col gap-1.5 sm:flex-row sm:items-start">
            <span className="label-mono hidden pt-2.5 sm:block">{String(index + 1).padStart(2, "0")}</span>
            <textarea
              value={bullet}
              rows={2}
              aria-label={`Bullet ${index + 1}`}
              placeholder={placeholder}
              onChange={(event) => {
                const next = [...value];
                next[index] = event.target.value;
                onChange(next);
              }}
              className="w-full resize-y rounded-control border border-line bg-canvas-2/50 px-3 py-2 text-sm leading-relaxed text-ink placeholder:text-faint focus:border-teal"
            />
            <div className="flex items-center gap-1.5">
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
                disabled={index === value.length - 1}
                onClick={() => move(index, 1)}
              />
              <ActionButton
                icon={Trash2}
                label="Remove"
                size="sm"
                variant="danger"
                onClick={() => onChange(value.filter((_, position) => position !== index))}
              />
            </div>
          </div>
        ))}

        <div>
          <ActionButton
            icon={ListPlus}
            label="Add bullet"
            size="sm"
            variant="secondary"
            onClick={() => onChange([...value, ""])}
          />
        </div>
      </div>
    </FieldShell>
  );
}
