"use client";

import clsx from "clsx";
import {
  CircleAlert,
  CircleCheck,
  CircleSlash,
  ClipboardCopy,
  KeyRound,
  Link2,
  PlugZap,
  Unplug,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useCopy } from "@/components/admin/social/use-copy";
import {
  ActionLink,
  Note,
  Panel,
  ReadOnlyField,
  ReadOnlyValue,
  buttonDangerClass,
  buttonSecondaryClass,
} from "@/components/admin/social/ui";

/**
 * One provider's connection state.
 *
 * Rendered from serialisable props only. In particular there is no token, no
 * ciphertext and no client secret in this component's props — the server page
 * selects `displayName`, `accountRef`, `scopes`, `connectedAt` and `expiresAt`
 * and nothing else, so a credential cannot reach the browser even by mistake.
 *
 * When a provider is not configured the card shows exactly which environment
 * variables are missing plus the redirect URI that has to be registered, and it
 * deliberately does not render a Connect button. A button that can only fail is
 * worse than no button, because it makes the owner think the problem is on his
 * side of the screen.
 */

export interface ConnectionAccount {
  displayName: string;
  accountRef: string;
  scopes: string;
  /** ISO string. Kept as a string so this stays a trivially serialisable prop. */
  connectedAt: string;
  /** ISO string, or null when the provider does not expire this token. */
  expiresAt: string | null;
}

export interface ConnectionCardProps {
  slug: "linkedin" | "facebook";
  label: string;
  capability: string;
  /** Environment variables still missing. Empty means fully configured. */
  missing: string[];
  /** The exact redirect URI that must be registered with the provider. */
  redirectUri: string;
  /** Where the OAuth round-trip should return to. */
  returnTo: string;
  account: ConnectionAccount | null;
  /** True when `expiresAt` is in the past. */
  expired: boolean;
  /** The command that bootstraps deploy/.env, quoted from the env validator. */
  bootstrapHint: string;
}

type ConnectionState = "connected" | "expired" | "disconnected" | "unconfigured";

function connectionState(props: ConnectionCardProps): ConnectionState {
  if (props.missing.length > 0) return "unconfigured";
  if (!props.account) return "disconnected";
  return props.expired ? "expired" : "connected";
}

function ConnectionBadge({ state }: { state: ConnectionState }) {
  const presentation = {
    connected: {
      label: "Connected",
      Icon: CircleCheck,
      className: "text-teal border-teal/45 bg-teal/12",
    },
    expired: {
      label: "Session expired",
      Icon: CircleAlert,
      className: "text-rose border-rose/45 bg-rose/12",
    },
    disconnected: {
      label: "Not connected",
      Icon: Unplug,
      className: "text-muted border-line-strong bg-panel",
    },
    unconfigured: {
      label: "Not configured",
      Icon: CircleSlash,
      className: "text-faint border-line bg-panel",
    },
  }[state];

  const Icon = presentation.Icon;

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        presentation.className,
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {presentation.label}
    </span>
  );
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date);
}

export function ConnectionCard(props: ConnectionCardProps) {
  const { slug, label, capability, missing, redirectUri, returnTo, account, expired } = props;

  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const copy = useCopy();

  const state = connectionState(props);
  const configured = missing.length === 0;
  const connectHref = `/api/social/${slug}/connect?returnTo=${encodeURIComponent(returnTo)}`;

  async function disconnect() {
    setBusy(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/social/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: slug }),
      });

      if (!response.ok) {
        setFeedback(
          response.status === 401
            ? "Your admin session expired. Sign in again and retry."
            : `Disconnect failed (HTTP ${response.status}).`,
        );
        return;
      }

      setConfirming(false);
      setFeedback(`${label} has been disconnected.`);
      router.refresh();
    } catch {
      setFeedback("Could not reach the server. Nothing was disconnected.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel
      title={label}
      aside={<ConnectionBadge state={state} />}
      description={<p>{capability}</p>}
    >
      <div className="space-y-4 px-5 py-5 sm:px-6">
        {configured ? null : (
          <Note tone="warning">
            <p className="font-medium text-ink">
              {label} publishing is not configured, so publishing to it is switched off.
            </p>
            <p>
              {missing.length === 1 ? "One environment variable is" : `${missing.length} environment variables are`}{" "}
              missing:
            </p>
            <ul className="flex flex-wrap gap-2 pt-1">
              {missing.map((name) => (
                <li key={name}>
                  <ReadOnlyValue className="px-2 py-1 font-mono text-xs">{name}</ReadOnlyValue>
                </li>
              ))}
            </ul>
            <p>
              Add them to <code className="font-mono text-xs text-ink">deploy/.env</code>, whose
              shape is documented in{" "}
              <code className="font-mono text-xs text-ink">deploy/.env.example</code>. The file is
              in the repository rather than served by this site, so the path is written out here
              instead of linked to a page that does not exist. {props.bootstrapHint}
            </p>
            <p>
              Nothing is blocked by this: the manual share panels further down the page need no
              credentials at all and keep working exactly as they are.
            </p>
          </Note>
        )}

        {configured && account ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <ReadOnlyField label="Account" value={account.displayName || "—"} />
            <ReadOnlyField
              label={slug === "facebook" ? "Page id" : "Member URN"}
              value={<span className="font-mono text-xs">{account.accountRef}</span>}
            />
            <ReadOnlyField
              label="Token expiry"
              value={
                account.expiresAt
                  ? `${formatTimestamp(account.expiresAt)}${expired ? " — expired" : ""}`
                  : "No expiry — the provider does not expire this token"
              }
            />
            <ReadOnlyField label="Connected" value={formatTimestamp(account.connectedAt)} />
            <div className="sm:col-span-2">
              <ReadOnlyField
                label="Scopes granted"
                value={<span className="font-mono text-xs">{account.scopes || "—"}</span>}
              />
            </div>
          </div>
        ) : null}

        {configured && !account ? (
          <Note>
            <p>
              No {label} account is connected yet. Connecting sends you to {label}, where you
              approve this app for one scope set; the resulting token is encrypted before it is
              stored and is never shown in this panel.
            </p>
          </Note>
        ) : null}

        {state === "expired" ? (
          <Note tone="warning">
            <p>
              The stored token has expired, so scheduled posts will stop with &ldquo;Needs
              reconnect&rdquo; until you connect again. Reconnecting replaces the token; the
              dispatch log and its history are untouched.
            </p>
          </Note>
        ) : null}

        <div className="grid gap-1.5">
          <span className="label-mono">Redirect URI to register with {label}</span>
          <ReadOnlyValue label="Redirect URI (read-only)">{redirectUri}</ReadOnlyValue>
        </div>

        {feedback ? <p className="text-sm text-muted">{feedback}</p> : null}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-line px-5 py-4 sm:px-6">
        {configured && !account ? (
          <ActionLink href={connectHref} icon={PlugZap} variant="primary" external>
            Connect {label}
          </ActionLink>
        ) : null}

        {configured && account ? (
          <ActionLink href={connectHref} icon={PlugZap} variant="secondary" external>
            {expired ? "Reconnect now" : `Reconnect ${label}`}
          </ActionLink>
        ) : null}

        {configured && account ? (
          confirming ? (
            <>
              <button
                type="button"
                onClick={disconnect}
                disabled={busy}
                className={buttonDangerClass}
              >
                <Unplug className="h-4 w-4 shrink-0" aria-hidden="true" />
                {busy ? "Disconnecting…" : `Yes, disconnect ${label}`}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={busy}
                className={buttonSecondaryClass}
              >
                <CircleSlash className="h-4 w-4 shrink-0" aria-hidden="true" />
                Keep it connected
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className={buttonDangerClass}
            >
              <Unplug className="h-4 w-4 shrink-0" aria-hidden="true" />
              Disconnect {label}
            </button>
          )
        ) : null}

        <button
          type="button"
          onClick={() => copy.copy(redirectUri)}
          className={buttonSecondaryClass}
        >
          <ClipboardCopy className="h-4 w-4 shrink-0" aria-hidden="true" />
          {copy.state === "copied"
            ? "Redirect URI copied"
            : copy.state === "failed"
              ? "Copy failed — select it above"
              : "Copy redirect URI"}
        </button>

        {configured ? (
          <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-faint">
            <KeyRound className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Tokens are stored encrypted and are never displayed
          </span>
        ) : (
          <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-faint">
            <Link2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Manual sharing is unaffected
          </span>
        )}
      </div>
    </Panel>
  );
}
