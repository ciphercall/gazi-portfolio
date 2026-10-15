"use client";

import { Check, Save, Trash2, X } from "lucide-react";
import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";

import { ActionButton } from "@/components/admin/action-button";
import { ReorderControls } from "@/components/admin/row-actions";
import type { ActionResult, ReorderModel } from "@/lib/admin/types";

/**
 * One editable row of an inline list (education, skills, certifications).
 *
 * The row owns its own draft, its own pending flag and its own error map, so
 * saving row 3 never disables Save on row 7 — and a validation failure lands on
 * the exact row that has it. Rows keep their identity from the database, which
 * is also why reordering can safely send the whole id list.
 */
export function InlineRowFrame<TRow, TInput extends { id: string | null }>({
  row,
  ids,
  index,
  model,
  entityLabel,
  saveAction,
  deleteAction,
  toInput,
  renderFields,
  rowTitle,
  gridClassName,
}: {
  row: TRow;
  ids: string[];
  index: number;
  model: ReorderModel;
  /** e.g. "education" — used in the button labels. */
  entityLabel: string;
  saveAction: (input: TInput) => Promise<ActionResult<{ row: TRow }>>;
  deleteAction: (id: string) => Promise<ActionResult<{ id: string }>>;
  toInput: (row: TRow) => TInput;
  renderFields: (
    draft: TInput,
    set: <K extends keyof TInput>(key: K, value: TInput[K]) => void,
    errors: Record<string, string[]> | null,
  ) => ReactNode;
  rowTitle: (draft: TInput) => ReactNode;
  gridClassName?: string;
}) {
  const [draft, setDraft] = useState<TInput>(() => toInput(row));
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [saving, startSave] = useTransition();
  const [deleting, startDelete] = useTransition();

  function set<K extends keyof TInput>(key: K, value: TInput[K]) {
    setDraft((previous) => ({ ...previous, [key]: value }));
  }

  const save = () => {
    startSave(async () => {
      const result = await saveAction(draft);
      if (result.ok) {
        setErrors(null);
        toast.success(result.message);
      } else {
        setErrors(result.errors ?? null);
        toast.error(result.errors?.form?.[0] ?? result.message);
      }
    });
  };

  const remove = () => {
    const id = draft.id;
    if (!id) return;
    startDelete(async () => {
      const result = await deleteAction(id);
      if (result.ok) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <li className="rounded-card border border-line bg-panel px-3.5 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-control border border-line bg-canvas-2/60 font-mono text-xs text-muted">
            {index + 1}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{rowTitle(draft)}</p>
            <p className="font-mono text-[11px] text-faint">{draft.id}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ReorderControls model={model} ids={ids} index={index} />
          <ActionButton
            icon={Save}
            label={`Save ${entityLabel}`}
            size="sm"
            variant="primary"
            pending={saving}
            pendingLabel="Saving…"
            onClick={save}
          />
          {confirming ? (
            <>
              <ActionButton
                icon={Check}
                label="Confirm delete"
                size="sm"
                variant="danger"
                pending={deleting}
                pendingLabel="Deleting…"
                onClick={remove}
              />
              <ActionButton
                icon={X}
                label="Cancel"
                size="sm"
                variant="ghost"
                disabled={deleting}
                onClick={() => setConfirming(false)}
              />
            </>
          ) : (
            <ActionButton
              icon={Trash2}
              label={`Delete ${entityLabel}`}
              size="sm"
              variant="danger"
              onClick={() => setConfirming(true)}
            />
          )}
        </div>
      </div>

      <div className={gridClassName ?? "mt-3 grid grid-cols-1 gap-3 md:grid-cols-2"}>
        {renderFields(draft, set, errors)}
      </div>

      {errors && Object.keys(errors).length > 0 ? (
        <ul className="mt-2 flex flex-col gap-0.5">
          {Object.entries(errors).map(([field, messages]) => (
            <li key={field} className="text-xs text-rose">
              <span className="font-mono">{field}</span>: {messages[0] ?? "invalid"}
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}
