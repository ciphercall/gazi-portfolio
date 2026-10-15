"use client";

import { Save } from "lucide-react";
import { useState, type FormEvent } from "react";

import { ActionButton } from "@/components/admin/action-button";
import { TextAreaField, TextField } from "@/components/admin/fields";
import { useAdminSubmit } from "@/components/admin/use-admin-submit";
import { saveSeo } from "@/lib/admin/actions/profile";

/**
 * SEO fields only.
 *
 * `saveSeo` is a deliberately narrow action: it writes `seoTitle` and
 * `seoDescription` and nothing else, so a typo on this screen can never touch
 * the CV content the profile form owns.
 */

export function SeoForm({
  initialSeoTitle,
  initialSeoDescription,
}: {
  initialSeoTitle: string;
  initialSeoDescription: string;
}) {
  const [seoTitle, setSeoTitle] = useState(initialSeoTitle);
  const [seoDescription, setSeoDescription] = useState(initialSeoDescription);

  const { submit, pending, errorFor, formError } = useAdminSubmit(saveSeo);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit({ seoTitle, seoDescription });
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {formError ? (
        <p
          role="alert"
          className="rounded-control border border-rose/50 bg-rose/10 px-3 py-2 text-sm text-rose"
        >
          {formError}
        </p>
      ) : null}

      <TextField
        label="Page title"
        value={seoTitle}
        onChange={setSeoTitle}
        error={errorFor("seoTitle")}
        hint={`Shown in the browser tab and as the search-result headline. Aim for 50-60 characters; currently ${seoTitle.length}.`}
        maxLength={120}
        required
      />

      <TextAreaField
        label="Meta description"
        value={seoDescription}
        onChange={setSeoDescription}
        error={errorFor("seoDescription")}
        rows={4}
        hint={`The snippet under the headline in search results and link previews. Aim for 140-160 characters; currently ${seoDescription.length}.`}
        maxLength={400}
        required
      />

      <div>
        <ActionButton
          type="submit"
          icon={Save}
          label="Save settings"
          pendingLabel="Saving..."
          pending={pending}
          variant="primary"
        />
      </div>
    </form>
  );
}
