"use client";

import { Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { ActionButton } from "@/components/admin/action-button";
import { NumberField, TextField } from "@/components/admin/fields";
import { InlineRowFrame } from "@/components/admin/forms/inline-row-frame";
import { AdminSection } from "@/components/admin/page-frame";
import { deleteCertification, saveCertification } from "@/lib/admin/actions/lists";
import type { CertificationInput, CertificationRow } from "@/lib/admin/types";

/**
 * Certifications, edited inline. Issue dates are optional; the CV prints what is
 * present rather than inventing a date.
 */

function toInput(row: CertificationRow): CertificationInput {
  return {
    id: row.id,
    name: row.name,
    issuer: row.issuer,
    issuedOn: row.issuedOn,
    url: row.url,
    order: row.order,
  };
}

export function CertificationsManager({ rows }: { rows: CertificationRow[] }) {
  const ids = rows.map((row) => row.id);

  return (
    <div className="flex flex-col gap-4">
      <NewCertificationCard order={rows.length} />

      {rows.length === 0 ? (
        <p className="rounded-card border border-dashed border-line bg-canvas-2/25 px-4 py-6 text-center text-xs text-faint">
          Nothing here yet. Use “Add certification” above to create the first entry.
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {rows.map((row, index) => (
            <InlineRowFrame
              key={row.id}
              row={row}
              ids={ids}
              index={index}
              model="certification"
              entityLabel="certification"
              saveAction={saveCertification}
              deleteAction={deleteCertification}
              toInput={toInput}
              rowTitle={(draft) => (draft.issuer ? `${draft.name} — ${draft.issuer}` : draft.name)}
              renderFields={(draft, set, errors) => (
                <>
                  <TextField
                    label="Certification"
                    value={draft.name}
                    onChange={(value) => set("name", value)}
                    error={errors?.name?.[0]}
                    required
                    placeholder="AWS Certified Solutions Architect"
                  />
                  <TextField
                    label="Issuer"
                    value={draft.issuer}
                    onChange={(value) => set("issuer", value)}
                    error={errors?.issuer?.[0]}
                    placeholder="Amazon Web Services"
                  />
                  <TextField
                    label="Issue date"
                    value={draft.issuedOn ?? ""}
                    onChange={(value) => set("issuedOn", value.length > 0 ? value : null)}
                    error={errors?.issuedOn?.[0]}
                    type="date"
                    hint="Optional."
                  />
                  <TextField
                    label="Credential URL"
                    value={draft.url ?? ""}
                    onChange={(value) => set("url", value.length > 0 ? value : null)}
                    error={errors?.url?.[0]}
                    placeholder="https://…"
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

function NewCertificationCard({ order }: { order: number }) {
  const blank: CertificationInput = {
    id: null,
    name: "",
    issuer: "",
    issuedOn: null,
    url: null,
    order,
  };

  const [draft, setDraft] = useState<CertificationInput>(blank);
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);
  const [pending, startSave] = useTransition();

  function set<K extends keyof CertificationInput>(key: K, value: CertificationInput[K]) {
    setDraft((previous) => ({ ...previous, [key]: value }));
  }

  const save = () => {
    startSave(async () => {
      const result = await saveCertification(draft);
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
      title="Add certification"
      description="Appears in the certifications block of both CV variants."
      icon={Plus}
      actions={
        <ActionButton
          icon={Plus}
          label="Add certification"
          variant="primary"
          pending={pending}
          pendingLabel="Adding…"
          onClick={save}
        />
      }
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <TextField
          label="Certification"
          value={draft.name}
          onChange={(value) => set("name", value)}
          error={errors?.name?.[0]}
          required
        />
        <TextField
          label="Issuer"
          value={draft.issuer}
          onChange={(value) => set("issuer", value)}
          error={errors?.issuer?.[0]}
          placeholder="Coursera, Meta, AWS…"
        />
        <TextField
          label="Issue date"
          value={draft.issuedOn ?? ""}
          onChange={(value) => set("issuedOn", value.length > 0 ? value : null)}
          error={errors?.issuedOn?.[0]}
          type="date"
        />
        <TextField
          label="Credential URL"
          value={draft.url ?? ""}
          onChange={(value) => set("url", value.length > 0 ? value : null)}
          error={errors?.url?.[0]}
          placeholder="https://…"
        />
      </div>
    </AdminSection>
  );
}
