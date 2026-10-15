"use client";

import clsx from "clsx";
import {
  CircleAlert,
  CircleCheck,
  ExternalLink,
  PlugZap,
  RefreshCw,
  RotateCcw,
  ScrollText,
  Send,
  Table2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  postNowAction,
  retryDispatchAction,
  type DispatchActionResult,
} from "@/lib/social/actions";

import {
  ProviderChip,
  StatusChip,
  Panel,
  StickyActionBar,
  StatusLegend,
  buttonSecondaryClass,
} from "@/components/admin/social/ui";

/**
 * The dispatch log.
 *
 * Every row answers three questions without decoration: what content this is,
 * what happened to it, and what can be done about it now. The third one is the
 * point of the table, so the action is computed from the row's real state rather
 * than from a fixed button — a row whose provider is not connected offers the
 * Connect link instead of a "Post now" that could only fail.
 *
 * The message preview is capped and the errors are shown in full, because an
 * error the owner cannot read is not an error report.
 */

export interface DispatchRow {
  id: string;
  subjectType: "EXPERIENCE" | "PROJECT";
  subjectLabel: string;
  subjectUrl: string | null;
  provider: "LINKEDIN" | "FACEBOOK";
  status: "DRAFT" | "QUEUED" | "POSTED" | "FAILED" | "NEEDS_RECONNECT";
  message: string;
  permalink: string | null;
  externalId: string | null;
  error: string | null;
  attempts: number;
  postedAt: string | null;
  createdAt: string;
}

export interface ProviderReadiness {
  /** The provider's client id/secret and SOCIAL_TOKEN_KEY are all present. */
  configured: boolean;
  /** A SocialAccount row exists for this provider. */
  connected: boolean;
}

export interface DispatchLogProps {
  rows: DispatchRow[];
  readiness: {
    linkedin: ProviderReadiness;
    facebook: ProviderReadiness;
  };
}

function formatTimestamp(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date);
}

function labelFor(provider: "LINKEDIN" | "FACEBOOK"): { label: string; slug: "linkedin" | "facebook" } {
  return provider === "LINKEDIN"
    ? { label: "LinkedIn", slug: "linkedin" }
    : { label: "Facebook", slug: "facebook" };
}

export function DispatchLog({ rows, readiness }: DispatchLogProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, DispatchActionResult>>({});

  async function run(id: string, action: "post" | "retry") {
    setPendingId(id);
    try {
      const result =
        action === "post" ? await postNowAction(id) : await retryDispatchAction(id);
      setResults((previous) => ({ ...previous, [id]: result }));
      // The row's status and attempts changed on the server; re-read the page.
      router.refresh();
    } catch {
      setResults((previous) => ({
        ...previous,
        [id]: { ok: false, message: "The action could not be completed. Try again." },
      }));
    } finally {
      setPendingId(null);
    }
  }

  const queued = rows.filter((row) => row.status === "QUEUED" || row.status === "DRAFT").length;
  const failed = rows.filter(
    (row) => row.status === "FAILED" || row.status === "NEEDS_RECONNECT",
  ).length;
  const posted = rows.filter((row) => row.status === "POSTED").length;

  return (
    <Panel
      title="Dispatch log"
      description={
        <p>
          Every post this app has queued or sent, newest first. Failures keep the provider&rsquo;s
          own error text so nothing has to be guessed at.
        </p>
      }
      aside={
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-panel px-2.5 py-1 text-xs font-medium text-muted">
          <Table2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {rows.length.toLocaleString("en-GB")} {rows.length === 1 ? "entry" : "entries"}
        </span>
      }
    >
      <div className="px-5 pt-4 sm:px-6">
        <StatusLegend />
      </div>

      {rows.length === 0 ? (
        <div className="px-5 py-10 text-center sm:px-6">
          <ScrollText className="mx-auto h-6 w-6 text-faint" aria-hidden="true" />
          <p className="mt-3 text-sm text-muted">
            Nothing has been queued yet. Saving an experience or a project queues a post when
            publishing is switched on; the manual share panels below always work.
          </p>
        </div>
      ) : (
        /* Scroll region. The sticky action bar below is a sibling, not a child. */
        <div className="mt-4 max-h-[30rem] overflow-auto border-t border-line">
          <table className="w-full min-w-[52rem] border-collapse text-left text-sm" aria-label="Social dispatch log">
            <caption className="sr-only">
              Each row shows the content, the provider, the outcome, the post text, how many
              attempts were made, when it happened and the available action.
            </caption>
            <thead className="sticky top-0 z-10 bg-canvas-2/95 text-xs backdrop-blur">
              <tr className="border-b border-line">
                <th scope="col" className="px-4 py-3 font-medium text-faint">
                  Content
                </th>
                <th scope="col" className="px-4 py-3 font-medium text-faint">
                  Provider
                </th>
                <th scope="col" className="px-4 py-3 font-medium text-faint">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 font-medium text-faint">
                  Post text
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium text-faint">
                  Attempts
                </th>
                <th scope="col" className="px-4 py-3 font-medium text-faint">
                  When
                </th>
                <th
                  scope="col"
                  className="sticky right-0 z-10 bg-canvas-2/95 px-4 py-3 font-medium text-faint backdrop-blur"
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const { label, slug } = labelFor(row.provider);
                const provider = readiness[slug];
                const result = results[row.id];
                const busy = pendingId === row.id;
                const isPostable = row.status !== "POSTED";

                return (
                  <tr key={row.id} className="border-b border-line/70 align-top last:border-b-0">
                    <td className="px-4 py-3">
                      <span className="block font-medium text-ink">{row.subjectLabel}</span>
                      <span className="mt-0.5 block text-xs text-faint">
                        {row.subjectType === "EXPERIENCE" ? "Experience" : "Project"}
                        {row.subjectUrl ? (
                          <>
                            {" · "}
                            <a
                              href={row.subjectUrl}
                              className="text-cyan underline underline-offset-2"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              public page
                            </a>
                          </>
                        ) : null}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <ProviderChip label={label} tone={slug} />
                    </td>

                    <td className="px-4 py-3">
                      <StatusChip status={row.status} />
                      {row.status === "POSTED" && row.permalink ? (
                        <a
                          href={row.permalink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 flex items-center gap-1.5 text-xs text-cyan underline underline-offset-2"
                        >
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          Open the live post
                        </a>
                      ) : null}
                      {row.error ? (
                        <p className="mt-2 flex max-w-sm gap-1.5 text-xs text-rose">
                          <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          <span className="break-words">{row.error}</span>
                        </p>
                      ) : null}
                      {result ? (
                        <p
                          className={clsx(
                            "mt-2 flex max-w-sm gap-1.5 text-xs",
                            result.ok ? "text-teal" : "text-rose",
                          )}
                          role="status"
                        >
                          {result.ok ? (
                            <CircleCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          ) : (
                            <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          )}
                          <span className="break-words">{result.message}</span>
                        </p>
                      ) : null}
                    </td>

                    <td className="px-4 py-3">
                      <p className="line-clamp-3 max-w-md text-xs leading-relaxed break-words whitespace-pre-wrap text-muted">
                        {row.message}
                      </p>
                    </td>

                    <td className="px-4 py-3 text-right font-mono text-xs text-muted">
                      {row.attempts}
                    </td>

                    <td className="px-4 py-3 text-xs whitespace-nowrap text-muted">
                      <span className="block">{formatTimestamp(row.createdAt)}</span>
                      {row.postedAt ? (
                        <span className="mt-0.5 block text-faint">
                          posted {formatTimestamp(row.postedAt)}
                        </span>
                      ) : null}
                    </td>

                    <td className="sticky right-0 bg-canvas-2/95 px-4 py-3 backdrop-blur">
                      {row.status === "POSTED" ? null : isPostable && provider.connected ? (
                        <button
                          type="button"
                          onClick={() => run(row.id, row.status === "QUEUED" || row.status === "DRAFT" ? "post" : "retry")}
                          disabled={busy}
                          className={buttonSecondaryClass}
                        >
                          {row.status === "QUEUED" || row.status === "DRAFT" ? (
                            <Send className="h-4 w-4 shrink-0" aria-hidden="true" />
                          ) : (
                            <RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />
                          )}
                          {busy
                            ? "Posting…"
                            : row.status === "QUEUED" || row.status === "DRAFT"
                              ? "Post now"
                              : "Retry"}
                        </button>
                      ) : provider.configured ? (
                        <a
                          href={`/api/social/${slug}/connect?returnTo=${encodeURIComponent("/admin/social")}`}
                          className={buttonSecondaryClass}
                        >
                          <PlugZap className="h-4 w-4 shrink-0" aria-hidden="true" />
                          Connect {label} to send this
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs text-faint">
                          <PlugZap className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          {label} is not configured yet
                        </span>
                      )}

                      {row.permalink && row.status === "POSTED" ? (
                        <span className="mt-2 flex items-center gap-1.5 text-xs text-faint">
                          <CircleCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          Nothing left to do
                        </span>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <StickyActionBar>
        <button type="button" onClick={() => router.refresh()} className={buttonSecondaryClass}>
          <RefreshCw className="h-4 w-4 shrink-0" aria-hidden="true" />
          Refresh log
        </button>

        <span className="text-xs text-muted">
          {posted.toLocaleString("en-GB")} posted · {queued.toLocaleString("en-GB")} ready to post ·{" "}
          {failed.toLocaleString("en-GB")} needing attention
        </span>

        <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-faint">
          <Table2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Failures record the provider&rsquo;s own wording
        </span>
      </StickyActionBar>
    </Panel>
  );
}
