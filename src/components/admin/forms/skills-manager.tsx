"use client";

import { Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { ActionButton } from "@/components/admin/action-button";
import { NumberField, TextField } from "@/components/admin/fields";
import { InlineRowFrame } from "@/components/admin/forms/inline-row-frame";
import { AdminSection } from "@/components/admin/page-frame";
import { deleteSkill, saveSkill } from "@/lib/admin/actions/lists";
import type { SkillInput, SkillRow } from "@/lib/admin/types";

/**
 * Skills, edited inline.
 *
 * `name` is unique in the database, so duplicates come back as a field error on
 * that row rather than a constraint violation.
 */

function toInput(row: SkillRow): SkillInput {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    level: row.level,
    order: row.order,
  };
}

export function SkillsManager({ rows }: { rows: SkillRow[] }) {
  const ids = rows.map((row) => row.id);

  return (
    <div className="flex flex-col gap-4">
      <NewSkillCard order={rows.length} />

      {rows.length === 0 ? (
        <p className="rounded-card border border-dashed border-line bg-canvas-2/25 px-4 py-6 text-center text-xs text-faint">
          Nothing here yet. Use “Add skill” above to create the first entry.
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {rows.map((row, index) => (
            <InlineRowFrame
              key={row.id}
              row={row}
              ids={ids}
              index={index}
              model="skill"
              entityLabel="skill"
              saveAction={saveSkill}
              deleteAction={deleteSkill}
              toInput={toInput}
              rowTitle={(draft) => `${draft.name} · ${draft.category}`}
              renderFields={(draft, set, errors) => (
                <>
                  <TextField
                    label="Skill"
                    value={draft.name}
                    onChange={(value) => set("name", value)}
                    error={errors?.name?.[0]}
                    required
                    placeholder="Laravel"
                  />
                  <TextField
                    label="Category"
                    value={draft.category}
                    onChange={(value) => set("category", value)}
                    error={errors?.category?.[0]}
                    placeholder="Backend"
                  />
                  <NumberField
                    label="Level"
                    value={draft.level}
                    onChange={(value) => set("level", value)}
                    error={errors?.level?.[0]}
                    min={1}
                    max={100}
                    placeholder="Leave empty for no level"
                    hint="Optional 1–100. Leave empty to just list the skill."
                  />
                  <NumberField
                    label="Order"
                    value={draft.order}
                    onChange={(value) => set("order", value ?? 0)}
                    error={errors?.order?.[0]}
                    min={0}
                  />
                </>
              )}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function NewSkillCard({ order }: { order: number }) {
  const blank: SkillInput = { id: null, name: "", category: "General", level: null, order };

  const [draft, setDraft] = useState<SkillInput>(blank);
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);
  const [pending, startSave] = useTransition();

  function set<K extends keyof SkillInput>(key: K, value: SkillInput[K]) {
    setDraft((previous) => ({ ...previous, [key]: value }));
  }

  const save = () => {
    startSave(async () => {
      const result = await saveSkill(draft);
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
      title="Add skill"
      description="Grouped by category on the CV; the category field is free text."
      icon={Plus}
      actions={
        <ActionButton
          icon={Plus}
          label="Add skill"
          variant="primary"
          pending={pending}
          pendingLabel="Adding…"
          onClick={save}
        />
      }
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <TextField
          label="Skill"
          value={draft.name}
          onChange={(value) => set("name", value)}
          error={errors?.name?.[0]}
          required
          placeholder="PostgreSQL"
        />
        <TextField
          label="Category"
          value={draft.category}
          onChange={(value) => set("category", value)}
          error={errors?.category?.[0]}
          placeholder="Backend"
        />
        <NumberField
          label="Level"
          value={draft.level}
          onChange={(value) => set("level", value)}
          error={errors?.level?.[0]}
          min={1}
          max={100}
          placeholder="Optional"
        />
      </div>
    </AdminSection>
  );
}
