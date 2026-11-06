"use client";

import { KeyRound, PlugZap, Save, ShieldCheck, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  Note,
  Panel,
  ReadOnlyField,
  buttonPrimaryClass,
  buttonSecondaryClass,
} from "@/components/admin/social/ui";
import {
  saveCredentialsAction,
  saveScheduleSettingsAction,
  testLinkedInAction,
} from "@/lib/social/settings-actions";

/**
 * Credential entry, from the browser's point of view.
 *
 * Secrets are write-only: a stored value is never sent to this page, so a blank
 * field means "keep what is there" and `__clear__` removes it. That is the only
 * shape in which "enter the keys later by logging in" can be true without also
 * making the panel a place to read credentials out of.
 */

export interface CredentialsFormProps {
  linkedinConfigured: boolean;
  facebookConfigured: boolean;
  linkedinConnected: boolean;
  facebookConnected: boolean;
  tokenKeyReady: boolean;
  linkedinRedirect: string;
  facebookRedirect: string;
  timezone: string;
  postTime: string;
  autoPublish: boolean;
}

export function CredentialsForm(props: CredentialsFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);

  const [linkedinId, setLinkedinId] = useState("");
  const [linkedinSecret, setLinkedinSecret] = useState("");
  const [facebookId, setFacebookId] = useState("");
  const [facebookSecret, setFacebookSecret] = useState("");

  const [timezone, setTimezone] = useState(props.timezone);
  const [postTime, setPostTime] = useState(props.postTime);
  const [autoPublish, setAutoPublish] = useState(props.autoPublish);

  function run(label: string, action: () => Promise<{ ok: boolean; message: string }>) {
    setBusy(label);
    startTransition(async () => {
      try {
        const result = await action();
        if (result.ok) toast.success(result.message);
        else toast.error(result.message);
        router.refresh();
      } catch {
        toast.error("That action could not be completed.");
      } finally {
        setBusy(null);
      }
    });
  }

  return (
    <div className="space-y-6">
      {props.tokenKeyReady ? null : (
        <Note tone="warning">
          <p className="flex items-center gap-2 font-medium text-ink">
            <TriangleAlert className="size-4 shrink-0 text-rose" aria-hidden="true" />
            SOCIAL_TOKEN_KEY is not set
          </p>
          <p>
            Credentials are encrypted with it before they touch the database, so nothing can be
            saved until it exists. Run <code className="font-mono text-xs">portfolio-deploy.ps1 -Action env</code>{" "}
            (it generates one) and restart the stack. This is an encryption key, not an API key —
            you never type it into this page.
          </p>
        </Note>
      )}

      <Panel
        title="LinkedIn credentials"
        description={
          <p>
            From your own LinkedIn app (Developer Portal → Create app → Products → <strong>Share on
            LinkedIn</strong>). Register the redirect URI below exactly. Saved values are encrypted
            at rest, applied without a restart, and never shown again.
          </p>
        }
        aside={
          <span className="rounded-full border border-line-strong bg-panel px-2.5 py-1 text-xs text-muted">
            {props.linkedinConnected
              ? "Connected"
              : props.linkedinConfigured
                ? "Configured, not connected"
                : "Not configured"}
          </span>
        }
      >
        <div className="grid gap-4 px-5 py-5 sm:px-6 md:grid-cols-2">
          <label className="grid gap-1.5">
            <span className="label-mono">Client ID</span>
            <input
              type="password"
              autoComplete="off"
              value={linkedinId}
              onChange={(event) => setLinkedinId(event.target.value)}
              placeholder={props.linkedinConfigured ? "Stored — leave blank to keep" : "Not set"}
              className="rounded-control border border-line bg-canvas-2/70 px-3 py-2 text-sm text-ink"
            />
          </label>

          <label className="grid gap-1.5">
            <span className="label-mono">Client secret</span>
            <input
              type="password"
              autoComplete="off"
              value={linkedinSecret}
              onChange={(event) => setLinkedinSecret(event.target.value)}
              placeholder={props.linkedinConfigured ? "Stored — leave blank to keep" : "Not set"}
              className="rounded-control border border-line bg-canvas-2/70 px-3 py-2 text-sm text-ink"
            />
          </label>

          <div className="md:col-span-2">
            <ReadOnlyField label="Redirect URI to register" value={props.linkedinRedirect} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-line px-5 py-3 sm:px-6">
          <button
            type="button"
            className={buttonPrimaryClass}
            disabled={pending || !props.tokenKeyReady}
            onClick={() =>
              run("linkedin", async () => {
                const result = await saveCredentialsAction({
                  linkedinClientId: linkedinId,
                  linkedinClientSecret: linkedinSecret,
                });
                if (result.ok) {
                  setLinkedinId("");
                  setLinkedinSecret("");
                }
                return result;
              })
            }
          >
            <Save className="size-4" aria-hidden="true" />
            {busy === "linkedin" ? "Saving…" : "Save LinkedIn credentials"}
          </button>

          <button
            type="button"
            className={buttonSecondaryClass}
            disabled={pending}
            onClick={() => run("test", testLinkedInAction)}
          >
            <ShieldCheck className="size-4" aria-hidden="true" />
            {busy === "test" ? "Checking…" : "Test connection"}
          </button>

          <a
            href="/api/social/linkedin/connect?returnTo=%2Fadmin%2Fsocial%2Fsettings"
            className={buttonSecondaryClass}
          >
            <PlugZap className="size-4" aria-hidden="true" />
            Connect LinkedIn
          </a>
        </div>
      </Panel>

      <Panel
        title="Facebook Page credentials"
        description={
          <p>
            Optional. Posting targets a Facebook <strong>Page</strong> — no API can post to a
            personal profile. Register the redirect URI below in the Meta app dashboard.
          </p>
        }
        aside={
          <span className="rounded-full border border-line-strong bg-panel px-2.5 py-1 text-xs text-muted">
            {props.facebookConnected
              ? "Connected"
              : props.facebookConfigured
                ? "Configured, not connected"
                : "Not configured"}
          </span>
        }
      >
        <div className="grid gap-4 px-5 py-5 sm:px-6 md:grid-cols-2">
          <label className="grid gap-1.5">
            <span className="label-mono">App ID</span>
            <input
              type="password"
              autoComplete="off"
              value={facebookId}
              onChange={(event) => setFacebookId(event.target.value)}
              placeholder={props.facebookConfigured ? "Stored — leave blank to keep" : "Not set"}
              className="rounded-control border border-line bg-canvas-2/70 px-3 py-2 text-sm text-ink"
            />
          </label>

          <label className="grid gap-1.5">
            <span className="label-mono">App secret</span>
            <input
              type="password"
              autoComplete="off"
              value={facebookSecret}
              onChange={(event) => setFacebookSecret(event.target.value)}
              placeholder={props.facebookConfigured ? "Stored — leave blank to keep" : "Not set"}
              className="rounded-control border border-line bg-canvas-2/70 px-3 py-2 text-sm text-ink"
            />
          </label>

          <div className="md:col-span-2">
            <ReadOnlyField label="Redirect URI to register" value={props.facebookRedirect} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-line px-5 py-3 sm:px-6">
          <button
            type="button"
            className={buttonPrimaryClass}
            disabled={pending || !props.tokenKeyReady}
            onClick={() =>
              run("facebook", async () => {
                const result = await saveCredentialsAction({
                  facebookAppId: facebookId,
                  facebookAppSecret: facebookSecret,
                });
                if (result.ok) {
                  setFacebookId("");
                  setFacebookSecret("");
                }
                return result;
              })
            }
          >
            <Save className="size-4" aria-hidden="true" />
            {busy === "facebook" ? "Saving…" : "Save Facebook credentials"}
          </button>

          <a
            href="/api/social/facebook/connect?returnTo=%2Fadmin%2Fsocial%2Fsettings"
            className={buttonSecondaryClass}
          >
            <PlugZap className="size-4" aria-hidden="true" />
            Connect Facebook
          </a>
        </div>
      </Panel>

      <Panel
        title="Schedule defaults"
        description={
          <p>
            New posts are placed one per day at this time. Changing the defaults does not move
            posts that are already scheduled — run <strong>Auto-schedule one per day</strong> on the
            publishing page for that.
          </p>
        }
      >
        <div className="grid gap-4 px-5 py-5 sm:px-6 md:grid-cols-3">
          <label className="grid gap-1.5">
            <span className="label-mono">Time zone</span>
            <input
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
              placeholder="Asia/Dhaka"
              className="rounded-control border border-line bg-canvas-2/70 px-3 py-2 text-sm text-ink"
            />
          </label>

          <label className="grid gap-1.5">
            <span className="label-mono">Post time (24h)</span>
            <input
              type="time"
              value={postTime}
              onChange={(event) => setPostTime(event.target.value)}
              className="rounded-control border border-line bg-canvas-2/70 px-3 py-2 text-sm text-ink"
            />
          </label>

          <label className="flex items-start gap-2.5 pt-6 text-sm text-ink">
            <input
              type="checkbox"
              checked={autoPublish}
              onChange={(event) => setAutoPublish(event.target.checked)}
              className="mt-0.5 size-4 accent-teal"
            />
            <span>
              Publish automatically
              <span className="mt-0.5 block text-xs text-faint">
                Off keeps every post prepared but unsent.
              </span>
            </span>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-line px-5 py-3 sm:px-6">
          <button
            type="button"
            className={buttonPrimaryClass}
            disabled={pending}
            onClick={() =>
              run("schedule", () =>
                saveScheduleSettingsAction({ timezone, postTime, autoPublish }),
              )
            }
          >
            <Save className="size-4" aria-hidden="true" />
            {busy === "schedule" ? "Saving…" : "Save schedule defaults"}
          </button>

          <span className="inline-flex items-center gap-1.5 text-xs text-faint">
            <KeyRound className="size-3.5" aria-hidden="true" />
            Credentials are encrypted with SOCIAL_TOKEN_KEY and never rendered back
          </span>
        </div>
      </Panel>

      <p className="text-xs text-faint">
        To remove a stored credential, type <code className="font-mono">__clear__</code> in its field
        and save. It falls back to whatever <code className="font-mono">deploy/.env</code> provides,
        if anything.
      </p>
    </div>
  );
}
