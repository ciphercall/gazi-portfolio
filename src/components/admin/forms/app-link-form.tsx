"use client";

import { RefreshCw, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ActionButton, ActionLink } from "@/components/admin/action-button";
import { SelectField, TextAreaField, TextField, ToggleField } from "@/components/admin/fields";
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
import { deleteAppLink, saveAppLink } from "@/lib/admin/actions/app-links";
import { slugify } from "@/lib/admin/format";
import {
  APP_PLATFORMS,
  APP_PLATFORM_LABELS,
  type AppLinkInput,
  type AppLinkRow,
} from "@/lib/admin/types";

const PLATFORM_OPTIONS = APP_PLATFORMS.map((value) => ({
  value,
  label: APP_PLATFORM_LABELS[value],
}));

function emptyDraft(order: number): AppLinkInput {
  return {
    id: null,
    name: "",
    slug: "",
    tagline: "",
    href: "",
    platform: "WEB",
    order,
    isPublished: true,
  };
}

function toDraft(row: AppLinkRow): AppLinkInput {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    tagline: row.tagline,
    href: row.href,
    platform: row.platform,
    order: row.order,
    isPublished: row.isPublished,
  };
}

export function AppLinkForm({
  initial,
  suggestedOrder,
}: {
  initial: AppLinkRow | null;
  /** Next free `order`, so a new link lands at the end of the list. */
  suggestedOrder: number;
}) {
  const router = useRouter();
  const isNew = initial === null;

  const [draft, setDraft] = useState<AppLinkInput>(() =>
    initial ? toDraft(initial) : emptyDraft(suggestedOrder),
  );
  const [slugTouched, setSlugTouched] = useState(!isNew);

  const { submit, pending, errorFor, formError } = useAdminSubmit<
    AppLinkInput,
    { id: string; slug: string }
  >(saveAppLink, {
    onSuccess: (data) => {
      if (isNew && data?.id) router.replace(`/admin/app-links/${data.id}`);
    },
  });

  function update<K extends keyof AppLinkInput>(key: K, value: AppLinkInput[K]) {
    setDraft((previous) => ({ ...previous, [key]: value }));
  }

  const handleSave = () => submit(draft);

  return (
    <AdminPageFrame
      header={
        <AdminPageHeader
          eyebrow={isNew ? "Apps & sites · new" : "Apps & sites"}
          title={isNew ? "Add an app link" : draft.name || "Untitled link"}
          description={
            isNew
              ? "Saved as a draft or published straight away — the public site only shows published links."
              : `/admin/app-links/${draft.id}`
          }
          back={{ href: "/admin/app-links", label: "All app links" }}
          actions={
            <ActionLink
              icon={RefreshCw}
              label="Reload list"
              href="/admin/app-links"
              size="sm"
              variant="ghost"
              prefetch={false}
            />
          }
        />
      }
      footer={
        <AdminActionBar
          note={
            formError ? (
              <span className="text-rose">{formError}</span>
            ) : (
              "Changes are not saved until you press Save."
            )
          }
        >
          <ActionButton
            icon={Save}
            label={isNew ? "Create app link" : "Save app link"}
            variant="primary"
            pending={pending}
            pendingLabel="Saving…"
            onClick={handleSave}
          />
          {initial ? (
            <RunActionButton
              action={deleteAppLink}
              input={initial.id}
              icon={Trash2}
              label="Delete app link"
              confirmLabel="Confirm delete"
              variant="danger"
              pendingLabel="Deleting…"
              onSuccess={() => router.push("/admin/app-links")}
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
        <AdminSection
          title="Identity"
          description="What the link is called and where it points."
        >
          <FieldGrid>
            <TextField
              label="Name"
              value={draft.name}
              onChange={(value) => {
                update("name", value);
                if (!slugTouched) update("slug", slugify(value));
              }}
              error={errorFor("name")}
              required
              placeholder="Studio for Android"
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
              hint="Used as the stable key for this link. Lowercase letters, numbers and hyphens."
              accessory={
                <ActionButton
                  icon={RefreshCw}
                  label="From name"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSlugTouched(false);
                    update("slug", slugify(draft.name));
                  }}
                />
              }
            />
            <FieldRow>
              <TextField
                label="Link"
                value={draft.href}
                onChange={(value) => update("href", value)}
                error={errorFor("href")}
                type="url"
                required
                placeholder="https://example.com/app.apk"
              />
            </FieldRow>
            <FieldRow>
              <TextAreaField
                label="Tagline"
                value={draft.tagline}
                onChange={(value) => update("tagline", value)}
                error={errorFor("tagline")}
                rows={3}
                placeholder="One sentence on what the visitor gets from it."
              />
            </FieldRow>
          </FieldGrid>
        </AdminSection>

        <AdminSection
          title="Publishing"
          description="Platform, order and visibility."
          tone="sunk"
        >
          <FieldGrid>
            <SelectField
              label="Platform"
              value={draft.platform}
              onChange={(value) => update("platform", value as AppLinkInput["platform"])}
              options={PLATFORM_OPTIONS}
              error={errorFor("platform")}
              hint="Web shows “Open site”; Android shows “Download APK”."
              required
            />
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
                hint="Unpublished links are invisible on the landing page and in the footer."
                checked={draft.isPublished}
                onChange={(checked) => update("isPublished", checked)}
                onLabel="Live"
                offLabel="Draft"
              />
            </FieldRow>
          </FieldGrid>
        </AdminSection>
      </form>
    </AdminPageFrame>
  );
}
