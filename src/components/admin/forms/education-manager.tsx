"use client";

import { Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { ActionButton } from "@/components/admin/action-button";
import { NumberField, TextAreaField, TextField } from "@/components/admin/fields";
import { InlineRowFrame } from "@/components/admin/forms/inline-row-frame";
import { AdminSection } from "@/components/admin/page-frame";
import { deleteEducation, saveEducation } from "@/lib/admin/actions/lists";
import type { EducationInput, EducationRow } from "@/lib/admin/types";

/**
 * Education, edited inline: add, edit, delete and reorder without leaving the page.
 *
 * Order is the order the CV prints, and the up/down controls rewrite it for the
 * whole list in one transaction.
 */

function toInput(row: EducationRow): EducationInput {
  return {
    id: row.id,
    school: row.school,
    degree: row.degree,
    field: row.field,
    startYear: row.startYear,
    endYear: row.endYear,
    details: row.details,
    order: row.order,
  };
}

export function EducationManager({
  rows,
  currentYear,
}: {
  rows: EducationRow[];
  /** Passed from the server so the default year cannot differ between renders. */
  currentYear: number;
}) {
  const ids = rows.map((row) => row.id);

  return (
    <div className="flex flex-col gap-4">
      <NewEducationCard order={rows.length} currentYear={currentYear} />

      {rows.length === 0 ? (
        <p className="rounded-card border border-dashed border-line bg-canvas-2/25 px-4 py-6 text-center text-xs text-faint">
          Nothing here yet. Use “Add education” above to create the first entry.
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {rows.map((row, index) => (
            <InlineRowFrame
              key={row.id}
              row={row}
              ids={ids}
              index={index}
              model="education"
              entityLabel="education"
              saveAction={saveEducation}
              deleteAction={deleteEducation}
              toInput={toInput}
              rowTitle={(draft) => `${draft.degree} — ${draft.school}`}
              renderFields={(draft, set, errors) => (
                <>
                  <TextField
                    label="School"
                    value={draft.school}
                    onChange={(value) => set("school", value)}
                    error={errors?.school?.[0]}
                    required
                  />
                  <TextField
                    label="Degree"
                    value={draft.degree}
                    onChange={(value) => set("degree", value)}
                    error={errors?.degree?.[0]}
                    required
                  />
                  <TextField
                    label="Field of study"
                    value={draft.field ?? ""}
                    onChange={(value) => set("field", value.length > 0 ? value : null)}
                    error={errors?.field?.[0]}
                  />
                  <NumberField
                    label="Order"
                    value={draft.order}
                    onChange={(value) => set("order", value ?? 0)}
                    error={errors?.order?.[0]}
                    min={0}
                    hint="Lower numbers print first."
                  />
                  <NumberField
                    label="Start year"
                    value={draft.startYear}
                    onChange={(value) => set("startYear", value ?? draft.startYear)}
                    error={errors?.startYear?.[0]}
                    min={1900}
                    max={2200}
                    required
                  />
                  <NumberField
                    label="End year"
                    value={draft.endYear}
                    onChange={(value) => set("endYear", value ?? draft.endYear)}
                    error={errors?.endYear?.[0]}
                    min={1900}
                    max={2200}
                    required
                  />
                  <div className="md:col-span-2">
                    <TextAreaField
                      label="Details"
                      value={draft.details ?? ""}
                      onChange={(value) => set("details", value.length > 0 ? value : null)}
                      error={errors?.details?.[0]}
                      rows={3}
                      placeholder="Optional notes — thesis, results, activities."
                    />
                  </div>
                </>
              )}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function NewEducationCard({ order, currentYear }: { order: number; currentYear: number }) {
  const blank: EducationInput = {
    id: null,
    school: "",
    degree: "",
    field: null,
    startYear: currentYear,
    endYear: currentYear,
    details: null,
    order,
  };

  const [draft, setDraft] = useState<EducationInput>(blank);
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);
  const [pending, startSave] = useTransition();

  function set<K extends keyof EducationInput>(key: K, value: EducationInput[K]) {
    setDraft((previous) => ({ ...previous, [key]: value }));
  }

  const save = () => {
    startSave(async () => {
      const result = await saveEducation(draft);
      if (result.ok) {
        setErrors(null);
        setDraft({ ...blank, order: order + 1 });
        toast.success(result.message);
      } else {
        setErrors(result.errors ?? null);
        toast.error(result.errors?.form?.[0] ?? result.message);
      }
    });
  };

  return (
    <AdminSection
      title="Add education"
      description="Creates the entry immediately — no separate save step."
      icon={Plus}
      actions={
        <ActionButton
          icon={Plus}
          label="Add education"
          variant="primary"
          pending={pending}
          pendingLabel="Adding…"
          onClick={save}
        />
      }
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <TextField
          label="School"
          value={draft.school}
          onChange={(value) => set("school", value)}
          error={errors?.school?.[0]}
          required
          placeholder="Daffodil International University"
        />
        <TextField
          label="Degree"
          value={draft.degree}
          onChange={(value) => set("degree", value)}
          error={errors?.degree?.[0]}
          required
          placeholder="B.Sc."
        />
        <TextField
          label="Field of study"
          value={draft.field ?? ""}
          onChange={(value) => set("field", value.length > 0 ? value : null)}
          error={errors?.field?.[0]}
          placeholder="Software Engineering"
        />
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            label="Start year"
            value={draft.startYear}
            onChange={(value) => set("startYear", value ?? currentYear)}
            error={errors?.startYear?.[0]}
            min={1900}
            max={2200}
          />
          <NumberField
            label="End year"
            value={draft.endYear}
            onChange={(value) => set("endYear", value ?? currentYear)}
            error={errors?.endYear?.[0]}
            min={1900}
            max={2200}
          />
        </div>
        <div className="md:col-span-2">
          <TextAreaField
            label="Details"
            value={draft.details ?? ""}
            onChange={(value) => set("details", value.length > 0 ? value : null)}
            error={errors?.details?.[0]}
            rows={2}
            placeholder="Optional."
          />
        </div>
      </div>
    </AdminSection>
  );
}
