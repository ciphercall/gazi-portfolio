"use client";

import { RefreshCw, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ActionButton, ActionLink } from "@/components/admin/action-button";
import { BulletListEditor } from "@/components/admin/bullet-list-editor";
import { ChipInput } from "@/components/admin/chip-input";
import { SelectField, TextAreaField, TextField, ToggleField } from "@/components/admin/fields";
import { GenerateButton } from "@/components/admin/generate-button";
import {
  AdminActionBar,
  AdminPageFrame,
  AdminPageHeader,
  AdminSection,
  FieldGrid,
  FieldRow,
} from "@/components/admin/page-frame";
import { RunActionButton } from "@/components/admin/row-actions";
import { useAdminSubmit } from "@/components/admin/use-admin-submit";
import { deleteExperience, saveExperience } from "@/lib/admin/actions/experiences";
import { slugify, suggestExperienceShareText } from "@/lib/admin/format";
import {
  EMPLOYMENT_TYPES,
  EMPLOYMENT_TYPE_LABELS,
  type ExperienceInput,
  type ExperienceRow,
} from "@/lib/admin/types";

/**
 * Experience editor, used for both `new` and an existing cuid.
 *
 * The Save button lives in `AdminPageFrame`'s footer, i.e. outside the scroll
 * container, so it is on screen at the top of the form and at the bottom.
 */

const EMPLOYMENT_OPTIONS = EMPLOYMENT_TYPES.map((value) => ({
  value,
  label: EMPLOYMENT_TYPE_LABELS[value],
}));

function emptyDraft(order: number): ExperienceInput {
  return {
    id: null,
    title: "",
    slug: "",
    company: "",
    companyUrl: null,
    employmentType: "FULL_TIME",
    location: null,
    startDate: "",
    endDate: null,
    isCurrent: false,
    summary: "",
    bullets: [],
    tags: [],
    shareText: "",
    order,
    isPublished: true,
  };
}

function toDraft(row: ExperienceRow): ExperienceInput {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    company: row.company,
    companyUrl: row.companyUrl,
    employmentType: row.employmentType,
    location: row.location,
    startDate: row.startDate,
    endDate: row.endDate,
    isCurrent: row.isCurrent,
    summary: row.summary,
    bullets: [...row.bullets],
    tags: [...row.tags],
    shareText: row.shareText,
    order: row.order,
    isPublished: row.isPublished,
  };
}

export function ExperienceForm({
  initial,
  suggestedOrder,
}: {
  initial: ExperienceRow | null;
  /** Next free `order`, so a new role lands at the end of the list. */
  suggestedOrder: number;
}) {
  const router = useRouter();
  const isNew = initial === null;

  const [draft, setDraft] = useState<ExperienceInput>(() =>
    initial ? toDraft(initial) : emptyDraft(suggestedOrder),
  );
  const [slugTouched, setSlugTouched] = useState(!isNew);

  const { submit, pending, errorFor, formError } = useAdminSubmit<
    ExperienceInput,
    { id: string; slug: string }
  >(saveExperience, {
    onSuccess: (data) => {
      if (isNew && data?.id) router.replace(`/admin/experiences/${data.id}`);
    },
  });

  function update<K extends keyof ExperienceInput>(key: K, value: ExperienceInput[K]) {
    setDraft((previous) => ({ ...previous, [key]: value }));
  }

  const handleSave = () => submit(draft);

  return (
    <AdminPageFrame
      header={
        <AdminPageHeader
          eyebrow={isNew ? "Experience · new" : "Experience"}
          title={isNew ? "Add an experience" : draft.title || "Untitled role"}
          description={
            isNew
              ? "Saved as a draft or published straight away — the public site only shows published rows."
              : `/admin/experiences/${draft.id}`
          }
          back={{ href: "/admin/experiences", label: "All experience" }}
          actions={
            <ActionLink
              icon={RefreshCw}
              label="Reload list"
              href="/admin/experiences"
              size="sm"
              variant="ghost"
              prefetch={false}
            />
          }
        />
      }
      footer={
        <AdminActionBar
          note={formError ? <span className="text-rose">{formError}</span> : "Changes are not saved until you press Save."}
        >
          <ActionButton
            icon={Save}
            label={isNew ? "Create experience" : "Save experience"}
            variant="primary"
            pending={pending}
            pendingLabel="Saving…"
            onClick={handleSave}
          />
          {initial ? (
            <RunActionButton
              action={deleteExperience}
              input={initial.id}
              icon={Trash2}
              label="Delete experience"
              confirmLabel="Confirm delete"
              variant="danger"
              pendingLabel="Deleting…"
              onSuccess={() => router.push("/admin/experiences")}
            />
          ) : null}
        </AdminActionBar>
      }
    >
      <form
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          handleSave();
        }}
      >
        <AdminSection title="Identity" description="How the role is titled and where it is linked.">
          <FieldGrid>
            <TextField
              label="Job title"
              value={draft.title}
              onChange={(value) => {
                update("title", value);
                if (!slugTouched) update("slug", slugify(value));
              }}
              error={errorFor("title")}
              required
              placeholder="Senior Full-Stack Developer"
            />
            <TextField
              label="Slug"
              value={draft.slug}
              onChange={(value) => {
                setSlugTouched(true);
                update("slug", value);
              }}
              onBlur={() => update("slug", slugify(draft.slug))}
              error={errorFor("slug")}
              mono
              hint="Used in the URL. Lowercase letters, numbers and hyphens."
              accessory={
                <ActionButton
                  icon={RefreshCw}
                  label="From title"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSlugTouched(false);
                    update("slug", slugify(draft.title));
                  }}
                />
              }
            />
            <TextField
              label="Company"
              value={draft.company}
              onChange={(value) => update("company", value)}
              error={errorFor("company")}
              required
            />
            <TextField
              label="Company URL"
              value={draft.companyUrl ?? ""}
              onChange={(value) => update("companyUrl", value.length > 0 ? value : null)}
              error={errorFor("companyUrl")}
              type="url"
              placeholder="https://example.com"
            />
          </FieldGrid>
        </AdminSection>

        <AdminSection
          title="Placement"
          description="The dates the CV sorts and prints from."
          tone="sunk"
        >
          <FieldGrid>
            <SelectField
              label="Employment type"
              value={draft.employmentType}
              onChange={(value) =>
                update("employmentType", value as ExperienceInput["employmentType"])
              }
              options={EMPLOYMENT_OPTIONS}
              error={errorFor("employmentType")}
              required
            />
            <TextField
              label="Location"
              value={draft.location ?? ""}
              onChange={(value) => update("location", value.length > 0 ? value : null)}
              error={errorFor("location")}
              placeholder="Dhaka, Bangladesh · Remote"
            />
            <TextField
              label="Start date"
              value={draft.startDate}
              onChange={(value) => update("startDate", value)}
              error={errorFor("startDate")}
              type="date"
              required
            />
            <TextField
              label="End date"
              value={draft.endDate ?? ""}
              onChange={(value) => update("endDate", value.length > 0 ? value : null)}
              error={errorFor("endDate")}
              type="date"
              hint={draft.isCurrent ? "Ignored while the role is marked current." : undefined}
            />
            <FieldRow>
              <ToggleField
                label="I am currently in this role"
                hint="Prints as “Present” on the CV and the public timeline."
                checked={draft.isCurrent}
                onChange={(checked) => {
                  update("isCurrent", checked);
                  if (checked) update("endDate", null);
                }}
                onLabel="Current"
                offLabel="Past"
              />
            </FieldRow>
          </FieldGrid>
        </AdminSection>

        <AdminSection title="Content" description="Summary, achievement bullets and tags.">
          <div className="flex flex-col gap-4">
            <TextAreaField
              label="Summary"
              value={draft.summary}
              onChange={(value) => update("summary", value)}
              error={errorFor("summary")}
              rows={4}
              placeholder="One paragraph on the scope of the role and the stack."
            />
            <BulletListEditor
              label="Bullets"
              value={draft.bullets}
              onChange={(value) => update("bullets", value)}
              error={errorFor("bullets")}
              hint="Each bullet appears in the CV and on the public page."
            />
            <ChipInput
              label="Tags"
              value={draft.tags}
              onChange={(value) => update("tags", value)}
              error={errorFor("tags")}
              hint="Technologies and domains — also reused as hashtags in the share text."
              placeholder="Laravel, React, PostgreSQL"
            />
          </div>
        </AdminSection>

        <AdminSection
          title="Publishing"
          description="Order, visibility and the text used when this is shared."
          tone="sunk"
        >
          <FieldGrid>
            <TextField
              label="Order"
              value={String(draft.order)}
              onChange={(value) => update("order", Number(value.replace(/[^\d]/g, "")) || 0)}
              error={errorFor("order")}
              mono
              inputMode="numeric"
              hint="Lower numbers appear first."
            />
            <FieldRow>
              <ToggleField
                label="Published"
                hint="Unpublished rows are invisible to the public site, the API and the CV."
                checked={draft.isPublished}
                onChange={(checked) => update("isPublished", checked)}
                onLabel="Live"
                offLabel="Draft"
              />
            </FieldRow>
            <FieldRow>
              <TextAreaField
                label="Share text"
                value={draft.shareText}
                onChange={(value) => update("shareText", value)}
                error={errorFor("shareText")}
                rows={6}
                placeholder="The post text used for LinkedIn/Facebook and the prefilled share links."
                accessory={
                  <GenerateButton
                    willReplace={draft.shareText.trim().length > 0}
                    onGenerate={() =>
                      update(
                        "shareText",
                        suggestExperienceShareText({
                          title: draft.title,
                          company: draft.company,
                          startDate: draft.startDate,
                          endDate: draft.endDate,
                          isCurrent: draft.isCurrent,
                          summary: draft.summary,
                          bullets: draft.bullets,
                          tags: draft.tags,
                        }),
                      )
                    }
                  />
                }
              />
            </FieldRow>
          </FieldGrid>
        </AdminSection>
      </form>
    </AdminPageFrame>
  );
}
