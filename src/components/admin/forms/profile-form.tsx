"use client";

import { Save } from "lucide-react";
import { useState } from "react";

import { ActionButton } from "@/components/admin/action-button";
import { ReadOnlyField, TextAreaField, TextField } from "@/components/admin/fields";
import { ImagePicker } from "@/components/admin/image-upload";
import {
  AdminActionBar,
  AdminPageFrame,
  AdminPageHeader,
  AdminSection,
  FieldGrid,
  FieldRow,
} from "@/components/admin/page-frame";
import { useAdminSubmit } from "@/components/admin/use-admin-submit";
import { saveProfile } from "@/lib/admin/actions/profile";
import { resolveDmLinks } from "@/lib/admin/links";
import type { ProfileInput, ProfileRow } from "@/lib/admin/types";

/**
 * The singleton Profile.
 *
 * Contact handles are the interesting part: they are stored as the owner thinks
 * of them ("+8801710272659", "apufirestl") and resolved into clickable URLs at
 * the bottom of the section, so he can see immediately that the WhatsApp number
 * he typed becomes the wa.me link the site will use.
 */

function emptyDraft(): ProfileInput {
  return {
    fullName: "",
    headline: "",
    subheadline: "",
    summary: "",
    location: "",
    email: "",
    phone: "",
    whatsapp: "",
    linkedinUrl: "",
    githubUrl: "",
    facebookUrl: "",
    messengerUsername: "",
    twitterUrl: "",
    websiteUrl: "",
    avatarPath: null,
    seoTitle: "",
    seoDescription: "",
  };
}

function toDraft(row: ProfileRow): ProfileInput {
  return {
    fullName: row.fullName,
    headline: row.headline,
    subheadline: row.subheadline,
    summary: row.summary,
    location: row.location,
    email: row.email,
    phone: row.phone,
    whatsapp: row.whatsapp,
    linkedinUrl: row.linkedinUrl,
    githubUrl: row.githubUrl,
    facebookUrl: row.facebookUrl,
    messengerUsername: row.messengerUsername,
    twitterUrl: row.twitterUrl,
    websiteUrl: row.websiteUrl,
    avatarPath: row.avatarPath,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
  };
}

export function ProfileForm({ initial }: { initial: ProfileRow | null }) {
  const [draft, setDraft] = useState<ProfileInput>(() => (initial ? toDraft(initial) : emptyDraft()));

  const { submit, pending, errorFor, formError } = useAdminSubmit<
    ProfileInput,
    { updatedAt: string }
  >(saveProfile);

  function update<K extends keyof ProfileInput>(key: K, value: ProfileInput[K]) {
    setDraft((previous) => ({ ...previous, [key]: value }));
  }

  const handleSave = () => submit(draft);

  const dmLinks = resolveDmLinks({
    whatsapp: draft.whatsapp,
    messengerUsername: draft.messengerUsername,
    linkedinUrl: draft.linkedinUrl,
    facebookUrl: draft.facebookUrl,
    email: draft.email,
    phone: draft.phone,
    websiteUrl: draft.websiteUrl,
    githubUrl: draft.githubUrl,
  });

  return (
    <AdminPageFrame
      header={
        <AdminPageHeader
          eyebrow="Profile"
          title="Profile"
          description={
            initial
              ? "The landing hero, the DM buttons, the OG tags and both CV variants read from this row."
              : "No profile row exists yet. Saving here creates it."
          }
        />
      }
      footer={
        <AdminActionBar
          note={
            formError ? (
              <span className="text-rose">{formError}</span>
            ) : initial?.updatedAt ? (
              `Last saved ${initial.updatedAt.slice(0, 16).replace("T", " ")} UTC`
            ) : (
              "Not saved yet."
            )
          }
        >
          <ActionButton
            icon={Save}
            label="Save profile"
            variant="primary"
            pending={pending}
            pendingLabel="Saving…"
            onClick={handleSave}
          />
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
        <AdminSection title="Identity" description="Name, headline and avatar — the first thing a visitor sees.">
          <div className="flex flex-col gap-4">
            <FieldGrid>
              <TextField
                label="Full name"
                value={draft.fullName}
                onChange={(value) => update("fullName", value)}
                error={errorFor("fullName")}
                required
              />
              <TextField
                label="Headline"
                value={draft.headline}
                onChange={(value) => update("headline", value)}
                error={errorFor("headline")}
                required
                placeholder="Senior Laravel & React Full-Stack Developer"
              />
              <TextField
                label="Subheadline"
                value={draft.subheadline}
                onChange={(value) => update("subheadline", value)}
                error={errorFor("subheadline")}
                placeholder="Short line under the headline"
              />
              <TextField
                label="Location"
                value={draft.location}
                onChange={(value) => update("location", value)}
                error={errorFor("location")}
                placeholder="Dhaka, Bangladesh"
              />
            </FieldGrid>
            <ImagePicker
              label="Avatar"
              value={draft.avatarPath}
              onChange={(value) => update("avatarPath", value)}
              subfolder="profile"
              error={errorFor("avatarPath")}
              hint="Square crops look best. Uploads become WebP at up to 1920 px."
            />
          </div>
        </AdminSection>

        <AdminSection title="Summary" description="The paragraph the hero and both CV variants open with." tone="sunk">
          <TextAreaField
            label="Summary"
            value={draft.summary}
            onChange={(value) => update("summary", value)}
            error={errorFor("summary")}
            rows={7}
            required
            placeholder="A few sentences on what he does, the stack, and the kinds of problems he solves."
          />
        </AdminSection>

        <AdminSection
          title="Contact handles"
          description="Stored as you would say them; the resolved links below are what the public buttons point at."
        >
          <div className="flex flex-col gap-4">
            <FieldGrid>
              <TextField
                label="Email"
                value={draft.email}
                onChange={(value) => update("email", value)}
                error={errorFor("email")}
                type="email"
                inputMode="email"
                placeholder="you@example.com"
              />
              <TextField
                label="Phone"
                value={draft.phone}
                onChange={(value) => update("phone", value)}
                error={errorFor("phone")}
                type="tel"
                inputMode="tel"
                placeholder="+8801…"
              />
              <TextField
                label="WhatsApp number"
                value={draft.whatsapp}
                onChange={(value) => update("whatsapp", value)}
                error={errorFor("whatsapp")}
                type="tel"
                inputMode="tel"
                hint="Digits are extracted, so spaces and dashes are fine."
              />
              <TextField
                label="Messenger username"
                value={draft.messengerUsername}
                onChange={(value) => update("messengerUsername", value)}
                error={errorFor("messengerUsername")}
                placeholder="apufirestl"
                hint="A leading @ is stripped automatically."
              />
              <TextField
                label="LinkedIn URL"
                value={draft.linkedinUrl}
                onChange={(value) => update("linkedinUrl", value)}
                error={errorFor("linkedinUrl")}
                placeholder="https://www.linkedin.com/in/…"
              />
              <TextField
                label="Facebook URL"
                value={draft.facebookUrl}
                onChange={(value) => update("facebookUrl", value)}
                error={errorFor("facebookUrl")}
                placeholder="https://facebook.com/…"
              />
              <TextField
                label="GitHub URL"
                value={draft.githubUrl}
                onChange={(value) => update("githubUrl", value)}
                error={errorFor("githubUrl")}
                placeholder="https://github.com/…"
              />
              <TextField
                label="X / Twitter URL"
                value={draft.twitterUrl}
                onChange={(value) => update("twitterUrl", value)}
                error={errorFor("twitterUrl")}
                placeholder="https://x.com/…"
              />
              <TextField
                label="Website URL"
                value={draft.websiteUrl}
                onChange={(value) => update("websiteUrl", value)}
                error={errorFor("websiteUrl")}
                placeholder="https://…"
              />
            </FieldGrid>

            <div className="rounded-card border border-dashed border-line bg-canvas-2/25 p-3.5">
              <p className="label-mono">Resolved links (read-only)</p>
              <p className="mt-1 text-xs text-faint">
                These are derived from the handles above and update as you type. Save to publish them.
              </p>
              <dl className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                {dmLinks.map((link) => (
                  <ReadOnlyField
                    key={link.key}
                    label={link.label}
                    value={link.href}
                    mono
                  />
                ))}
              </dl>
            </div>
          </div>
        </AdminSection>

        <AdminSection
          title="SEO"
          description="Same two fields as Settings — edit them in whichever page you are already on."
          tone="sunk"
        >
          <FieldGrid>
            <FieldRow>
              <TextField
                label="SEO title"
                value={draft.seoTitle}
                onChange={(value) => update("seoTitle", value)}
                error={errorFor("seoTitle")}
                hint="Aim for under 60 characters so it is not truncated in search results."
                accessory={
                  <span className="font-mono text-[11px] text-faint">{draft.seoTitle.length}/200</span>
                }
              />
            </FieldRow>
            <FieldRow>
              <TextAreaField
                label="SEO description"
                value={draft.seoDescription}
                onChange={(value) => update("seoDescription", value)}
                error={errorFor("seoDescription")}
                rows={3}
                hint="Aim for 150–160 characters."
                accessory={
                  <span className="font-mono text-[11px] text-faint">
                    {draft.seoDescription.length}/400
                  </span>
                }
              />
            </FieldRow>
          </FieldGrid>
        </AdminSection>
      </form>
    </AdminPageFrame>
  );
}
