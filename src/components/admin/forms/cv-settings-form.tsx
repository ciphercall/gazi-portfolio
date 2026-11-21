"use client";

import { Save } from "lucide-react";
import { useState, type FormEvent } from "react";

import { ActionButton } from "@/components/admin/action-button";
import { ToggleField } from "@/components/admin/fields";
import { useAdminSubmit } from "@/components/admin/use-admin-submit";
import { saveCvSettings } from "@/lib/admin/actions/cv";

/**
 * The two decisions that change the documents rather than the content.
 *
 * The ATS switch is off by default and stays behind a warning, because a photo
 * is the one thing most applicant-tracking systems are explicitly told to
 * ignore — it is included for the markets that expect one, not for everyone.
 */

export function CvSettingsForm({
  initialDesignedPhoto,
  initialAtsPhoto,
  hasAvatar,
}: {
  initialDesignedPhoto: boolean;
  initialAtsPhoto: boolean;
  hasAvatar: boolean;
}) {
  const [designedPhoto, setDesignedPhoto] = useState(initialDesignedPhoto);
  const [atsPhoto, setAtsPhoto] = useState(initialAtsPhoto);

  const { submit, pending, formError } = useAdminSubmit(saveCvSettings);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit({ designedPhoto, atsPhoto });
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3" noValidate>
      {formError ? (
        <p
          role="alert"
          className="rounded-control border border-rose/50 bg-rose/10 px-3 py-2 text-sm text-rose"
        >
          {formError}
        </p>
      ) : null}

      <ToggleField
        label="Profile photo on the designed CV"
        hint={
          hasAvatar
            ? "The portrait already shown on the site and in the app, cropped to a square and printed in the header band."
            : "No avatar uploaded yet. Until you add one in Profile, the CV prints a monogram in its place."
        }
        checked={designedPhoto}
        onChange={setDesignedPhoto}
        onLabel="Printed"
        offLabel="Hidden"
      />

      <ToggleField
        label="Profile photo on the ATS CV"
        hint="Off by default: most applicant-tracking systems ignore images and several markets treat a photo as noise. Turn it on only for employers that expect one — the text layer stays in the same order either way."
        checked={atsPhoto}
        onChange={setAtsPhoto}
        onLabel="Printed"
        offLabel="Hidden"
      />

      <div>
        <ActionButton
          type="submit"
          icon={Save}
          label="Save and re-render"
          pendingLabel="Saving..."
          pending={pending}
          variant="primary"
        />
      </div>
    </form>
  );
}
