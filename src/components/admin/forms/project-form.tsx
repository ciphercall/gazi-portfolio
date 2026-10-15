"use client";

import { RefreshCw, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ActionButton, ActionLink } from "@/components/admin/action-button";
import { ChipInput } from "@/components/admin/chip-input";
import { TextAreaField, TextField, ToggleField } from "@/components/admin/fields";
import { GalleryEditor } from "@/components/admin/gallery-editor";
import { GenerateButton } from "@/components/admin/generate-button";
import { ImagePicker } from "@/components/admin/image-upload";
import { MarkdownField } from "@/components/admin/markdown-field";
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
import { deleteProject, saveProject } from "@/lib/admin/actions/projects";
import { slugify, suggestProjectShareText } from "@/lib/admin/format";
import type { ProjectImageInput, ProjectInput, ProjectRow } from "@/lib/admin/types";

/**
 * Project editor: the long-form one.
 *
 * Body is markdown with a live preview; the gallery is a replace-all list saved
 * by the same Save button as the text, so there is never a project whose copy and
 * screenshots disagree.
 */

function emptyDraft(order: number): ProjectInput {
  return {
    id: null,
    title: "",
    slug: "",
    summary: "",
    body: "",
    role: null,
    client: null,
    year: null,
    liveUrl: null,
    repoUrl: null,
    techStack: [],
    coverPath: null,
    featured: false,
    order,
    isPublished: true,
    shareText: "",
    images: [],
  };
}

function toDraft(row: ProjectRow): ProjectInput {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    body: row.body,
    role: row.role,
    client: row.client,
    year: row.year,
    liveUrl: row.liveUrl,
    repoUrl: row.repoUrl,
    techStack: [...row.techStack],
    coverPath: row.coverPath,
    featured: row.featured,
    order: row.order,
    isPublished: row.isPublished,
    shareText: row.shareText,
    images: row.images.map((image) => ({
      path: image.path,
      alt: image.alt,
      caption: image.caption,
      width: image.width,
      height: image.height,
    })),
  };
}

export function ProjectForm({
  initial,
  suggestedOrder,
}: {
  initial: ProjectRow | null;
  suggestedOrder: number;
}) {
  const router = useRouter();
  const isNew = initial === null;

  const [draft, setDraft] = useState<ProjectInput>(() =>
    initial ? toDraft(initial) : emptyDraft(suggestedOrder),
  );
  const [slugTouched, setSlugTouched] = useState(!isNew);

  const { submit, pending, errorFor, formError } = useAdminSubmit<
    ProjectInput,
    { id: string; slug: string }
  >(saveProject, {
    onSuccess: (data) => {
      if (isNew && data?.id) router.replace(`/admin/projects/${data.id}`);
    },
  });

  function update<K extends keyof ProjectInput>(key: K, value: ProjectInput[K]) {
    setDraft((previous) => ({ ...previous, [key]: value }));
  }

  const handleSave = () => submit(draft);

  return (
    <AdminPageFrame
      header={
        <AdminPageHeader
          eyebrow={isNew ? "Projects · new" : "Projects"}
          title={isNew ? "Add a project" : draft.title || "Untitled project"}
          description={
            isNew
              ? "Summary, markdown body, cover, gallery and links — all saved together."
              : `/admin/projects/${draft.id}`
          }
          back={{ href: "/admin/projects", label: "All projects" }}
          actions={
            <ActionLink
              icon={RefreshCw}
              label="Reload list"
              href="/admin/projects"
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
              `Cover + ${draft.images.length} gallery image${draft.images.length === 1 ? "" : "s"} save with the text.`
            )
          }
        >
          <ActionButton
            icon={Save}
            label={isNew ? "Create project" : "Save project"}
            variant="primary"
            pending={pending}
            pendingLabel="Saving…"
            onClick={handleSave}
          />
          {initial ? (
            <RunActionButton
              action={deleteProject}
              input={initial.id}
              icon={Trash2}
              label="Delete project"
              confirmLabel="Confirm delete"
              variant="danger"
              pendingLabel="Deleting…"
              onSuccess={() => router.push("/admin/projects")}
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
        <AdminSection title="Identity" description="Title, slug and who it was for.">
          <FieldGrid>
            <TextField
              label="Title"
              value={draft.title}
              onChange={(value) => {
                update("title", value);
                if (!slugTouched) update("slug", slugify(value));
              }}
              error={errorFor("title")}
              required
              placeholder="Procurement Platform for a Textile Group"
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
              hint="Used in /projects/<slug>."
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
              label="Role"
              value={draft.role ?? ""}
              onChange={(value) => update("role", value.length > 0 ? value : null)}
              error={errorFor("role")}
              placeholder="Lead developer"
            />
            <TextField
              label="Client"
              value={draft.client ?? ""}
              onChange={(value) => update("client", value.length > 0 ? value : null)}
              error={errorFor("client")}
              placeholder="Internal / a company name"
            />
            <TextField
              label="Year"
              value={draft.year === null ? "" : String(draft.year)}
              onChange={(value) => {
                const digits = value.replace(/[^\d]/g, "");
                update("year", digits.length > 0 ? Number(digits) : null);
              }}
              error={errorFor("year")}
              mono
              inputMode="numeric"
              placeholder="2024"
            />
            <ChipInput
              label="Tech stack"
              value={draft.techStack}
              onChange={(value) => update("techStack", value)}
              error={errorFor("techStack")}
              hint="Drives the technology filter on the public projects page."
              placeholder="Laravel, MySQL, Docker"
            />
            <FieldRow>
              <FieldGrid columns={2}>
                <TextField
                  label="Live URL"
                  value={draft.liveUrl ?? ""}
                  onChange={(value) => update("liveUrl", value.length > 0 ? value : null)}
                  error={errorFor("liveUrl")}
                  type="url"
                  placeholder="https://example.com"
                />
                <TextField
                  label="Repository URL"
                  value={draft.repoUrl ?? ""}
                  onChange={(value) => update("repoUrl", value.length > 0 ? value : null)}
                  error={errorFor("repoUrl")}
                  type="url"
                  placeholder="https://github.com/…"
                />
              </FieldGrid>
            </FieldRow>
          </FieldGrid>
        </AdminSection>

        <AdminSection title="Copy" description="Summary for cards and lists, body for the case study." tone="sunk">
          <div className="flex flex-col gap-4">
            <TextAreaField
              label="Summary"
              value={draft.summary}
              onChange={(value) => update("summary", value)}
              error={errorFor("summary")}
              rows={3}
              required
              placeholder="Two sentences: the problem, and what shipped."
            />
            <MarkdownField
              label="Body (markdown)"
              value={draft.body}
              onChange={(value) => update("body", value)}
              error={errorFor("body")}
              hint="Rendered on the public project page."
            />
          </div>
        </AdminSection>

        <AdminSection
          title="Media"
          description="Cover image and gallery. Everything is converted to WebP at upload."
        >
          <div className="flex flex-col gap-5">
            <ImagePicker
              label="Cover image"
              value={draft.coverPath}
              onChange={(value) => update("coverPath", value)}
              subfolder="projects"
              error={errorFor("coverPath")}
              aspect="wide"
              hint="Shown on the projects grid and in link previews."
            />
            <GalleryEditor
              images={draft.images}
              onChange={(next: ProjectImageInput[]) => update("images", next)}
              error={errorFor("images")}
              hint="Order here is the order in the gallery. Images upload immediately; the list is saved with the project."
            />
          </div>
        </AdminSection>

        <AdminSection title="Publishing" description="Visibility, ordering and share text." tone="sunk">
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
              <FieldGrid columns={2}>
                <ToggleField
                  label="Featured"
                  hint="Featured projects are shown first and marked on the grid."
                  checked={draft.featured}
                  onChange={(checked) => update("featured", checked)}
                  onLabel="Featured"
                  offLabel="Standard"
                />
                <ToggleField
                  label="Published"
                  hint="Unpublished projects are invisible to the site, the API and the CV."
                  checked={draft.isPublished}
                  onChange={(checked) => update("isPublished", checked)}
                  onLabel="Live"
                  offLabel="Draft"
                />
              </FieldGrid>
            </FieldRow>
            <FieldRow>
              <TextAreaField
                label="Share text"
                value={draft.shareText}
                onChange={(value) => update("shareText", value)}
                error={errorFor("shareText")}
                rows={6}
                placeholder="Post text for LinkedIn/Facebook and the prefilled share links."
                accessory={
                  <GenerateButton
                    willReplace={draft.shareText.trim().length > 0}
                    onGenerate={() =>
                      update(
                        "shareText",
                        suggestProjectShareText({
                          title: draft.title,
                          summary: draft.summary,
                          tags: draft.techStack,
                          link: draft.liveUrl,
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
