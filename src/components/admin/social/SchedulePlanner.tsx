"use client";

import clsx from "clsx";
import {
  CalendarClock,
  ExternalLink,
  ImageDown,
  RefreshCw,
  Save,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { LinkedInPreview } from "@/components/admin/social/LinkedInPreview";
import { StatusChip, buttonPrimaryClass, buttonSecondaryClass } from "@/components/admin/social/ui";
import { postNowAction } from "@/lib/social/actions";
import {
  autoScheduleAction,
  cancelPostAction,
  planPostsAction,
  publishDueAction,
  renderCardAction,
  rescheduleAction,
  savePostTextAction,
  selectProjectAction,
} from "@/lib/social/scheduling-actions";

/**
 * The schedule planner.
 *
 * One row per published project: a checkbox, a date, a time. Everything is
 * selected by default and spread one per day, which is the state the owner asked
 * for — so the panel opens in a publishable state and edits are subtractive.
 *
 * Dates are edited locally and saved in one pass. Saving per keystroke would fire
 * a request for every digit typed into a date field, and would move a post twice
 * on its way to the real date.
 */

export interface PlannerRow {
  projectId: string;
  title: string;
  slug: string;
  summary: string;
  selected: boolean;
  dispatchId: string | null;
  status: "DRAFT" | "QUEUED" | "POSTED" | "FAILED" | "NEEDS_RECONNECT" | null;
  message: string;
  /** Local `YYYY-MM-DD` in the scheduling timezone. */
  date: string;
  /** Local `HH:mm`. */
  time: string;
  error: string | null;
  imagePath: string | null;
  permalink: string | null;
  manualEdit: boolean;
}

export interface PlannerAuthor {
  name: string;
  headline: string;
  avatarUrl: string | null;
}

interface Draft {
  date: string;
  time: string;
}

export function SchedulePlanner({
  rows,
  author,
  timezone,
  postTime,
  autoPublish,
  linkedInConnected,
  nextDueLabel,
}: {
  rows: PlannerRow[];
  author: PlannerAuthor;
  timezone: string;
  postTime: string;
  autoPublish: boolean;
  linkedInConnected: boolean;
  nextDueLabel: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  const dirty = useMemo(
    () =>
      Object.entries(drafts).filter(([dispatchId, draft]) => {
        const row = rows.find((item) => item.dispatchId === dispatchId);
        return row ? row.date !== draft.date || row.time !== draft.time : false;
      }),
    [drafts, rows],
  );

  const selectedCount = rows.filter((row) => row.selected).length;
  const preparedCount = rows.filter((row) => row.status && row.status !== "POSTED").length;
  const editing = rows.find((row) => row.dispatchId === editingId) ?? null;

  function run(label: string, action: () => Promise<{ ok: boolean; message: string }>) {
    setBusyLabel(label);
    startTransition(async () => {
      try {
        const result = await action();
        if (result.ok) toast.success(result.message);
        else toast.error(result.message);
        router.refresh();
      } catch {
        toast.error("That action could not be completed.");
      } finally {
        setBusyLabel(null);
      }
    });
  }

  function toggle(row: PlannerRow, selected: boolean) {
    run(selected ? `select-${row.projectId}` : `deselect-${row.projectId}`, () =>
      selectProjectAction({ projectId: row.projectId, selected }),
    );
  }

  function saveDates() {
    const changed = dirty;
    if (changed.length === 0) return;
    setBusyLabel("dates");
    startTransition(async () => {
      const failures: string[] = [];
      for (const [dispatchId, draft] of changed) {
        const result = await rescheduleAction({ dispatchId, date: draft.date, time: draft.time });
        if (!result.ok) failures.push(result.message);
      }
      if (failures.length === 0) {
        toast.success(`Moved ${changed.length} post(s).`);
        setDrafts({});
      } else {
        toast.error(failures[0] ?? "Some dates could not be saved.");
      }
      setBusyLabel(null);
      router.refresh();
    });
  }

  return (
    <section className="space-y-4">
      <div className="glass overflow-hidden">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
              <CalendarClock className="size-4 text-teal" aria-hidden="true" />
              Schedule
            </h2>
            <p className="mt-1 max-w-3xl text-sm text-muted">
              One post per day, scheduled in {timezone} at {postTime}. Every published project is
              selected by default; unchecking one removes its prepared post. Posts already published
              keep their date and cannot be unscheduled.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-line-strong bg-panel px-2.5 py-1 text-xs text-muted">
              {selectedCount} selected · {preparedCount} prepared · {autoPublish ? "auto-publish on" : "auto-publish off"}
            </span>
          </div>
        </header>

        <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-3 sm:px-6">
          <button
            type="button"
            className={buttonSecondaryClass}
            disabled={pending}
            onClick={() => run("auto", autoScheduleAction)}
          >
            <Sparkles className="size-4" aria-hidden="true" />
            Auto-schedule one per day
          </button>
          <button
            type="button"
            className={buttonSecondaryClass}
            disabled={pending}
            onClick={() => run("plan", planPostsAction)}
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            Plan new projects
          </button>
          <button
            type="button"
            className={buttonSecondaryClass}
            disabled={pending}
            onClick={() => run("due", publishDueAction)}
          >
            <Send className="size-4" aria-hidden="true" />
            Send due posts now
          </button>

          <span className="ml-auto text-xs text-faint">
            {nextDueLabel ? `Next post: ${nextDueLabel}` : "Nothing scheduled"}
          </span>
        </div>

        <div className="max-h-[32rem] overflow-auto">
          <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
            <caption className="sr-only">
              Each published project with its selection state, scheduled date and time, and status.
            </caption>
            <thead className="sticky top-0 z-10 bg-canvas-2/95 text-xs backdrop-blur">
              <tr className="border-b border-line">
                <th scope="col" className="px-4 py-3 font-medium text-faint">
                  Post
                </th>
                <th scope="col" className="px-4 py-3 font-medium text-faint">
                  Date
                </th>
                <th scope="col" className="px-4 py-3 font-medium text-faint">
                  Time
                </th>
                <th scope="col" className="px-4 py-3 font-medium text-faint">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 text-right font-medium text-faint">
                  Edit
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const draft = drafts[row.dispatchId ?? row.projectId] ?? {
                  date: row.date,
                  time: row.time,
                };
                const locked = row.status === "POSTED";

                return (
                  <tr key={row.projectId} className="border-b border-line/70 align-top last:border-b-0">
                    <td className="px-4 py-3">
                      <label className="flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          className="mt-1 size-4 shrink-0 accent-teal"
                          checked={row.selected}
                          disabled={pending || locked}
                          onChange={(event) => toggle(row, event.target.checked)}
                        />
                        <span className="min-w-0">
                          <span className="block font-medium text-ink">{row.title}</span>
                          <a
                            href={`/projects/${row.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-0.5 inline-flex items-center gap-1 text-xs text-cyan underline underline-offset-2"
                          >
                            /projects/{row.slug}
                            <ExternalLink className="size-3" aria-hidden="true" />
                          </a>
                        </span>
                      </label>
                    </td>

                    <td className="px-4 py-3">
                      <input
                        type="date"
                        value={draft.date}
                        disabled={pending || locked || !row.dispatchId}
                        onChange={(event) =>
                          setDrafts((previous) => ({
                            ...previous,
                            [row.dispatchId ?? row.projectId]: { ...draft, date: event.target.value },
                          }))
                        }
                        className="rounded-control border border-line bg-canvas-2/70 px-2 py-1 text-xs text-ink disabled:opacity-50"
                        aria-label={`Date for ${row.title}`}
                      />
                    </td>

                    <td className="px-4 py-3">
                      <input
                        type="time"
                        value={draft.time}
                        disabled={pending || locked || !row.dispatchId}
                        onChange={(event) =>
                          setDrafts((previous) => ({
                            ...previous,
                            [row.dispatchId ?? row.projectId]: { ...draft, time: event.target.value },
                          }))
                        }
                        className="rounded-control border border-line bg-canvas-2/70 px-2 py-1 text-xs text-ink disabled:opacity-50"
                        aria-label={`Time for ${row.title}`}
                      />
                    </td>

                    <td className="px-4 py-3">
                      {row.status ? <StatusChip status={row.status} /> : (
                        <span className="text-xs text-faint">Not selected</span>
                      )}
                      {row.error ? (
                        <p className="mt-1 max-w-xs text-xs break-words text-rose">{row.error}</p>
                      ) : null}
                      {row.permalink ? (
                        <a
                          href={row.permalink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 flex items-center gap-1 text-xs text-cyan underline underline-offset-2"
                        >
                          Live post
                          <ExternalLink className="size-3" aria-hidden="true" />
                        </a>
                      ) : null}
                    </td>

                    <td className="px-4 py-3 text-right">
                      {row.dispatchId && !locked ? (
                        <button
                          type="button"
                          className={buttonSecondaryClass}
                          onClick={() => setEditingId(row.dispatchId)}
                        >
                          Edit &amp; preview
                        </button>
                      ) : (
                        <span className="text-xs text-faint">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-line px-5 py-3 sm:px-6">
          <button
            type="button"
            className={buttonPrimaryClass}
            disabled={pending || dirty.length === 0}
            onClick={saveDates}
          >
            <Save className="size-4" aria-hidden="true" />
            {busyLabel === "dates"
              ? "Saving…"
              : `Save ${dirty.length > 0 ? `${dirty.length} date change(s)` : "dates"}`}
          </button>
          <span className="text-xs text-faint">
            Only one post per day is allowed — a colliding date is refused, not silently moved.
          </span>
        </div>
      </div>

      {editing ? (
        <PostEditor
          row={editing}
          author={author}
          linkedInConnected={linkedInConnected}
          onClose={() => setEditingId(null)}
          onChanged={() => router.refresh()}
        />
      ) : null}
    </section>
  );
}

/* ------------------------------------------------------------------ editor --- */

function PostEditor({
  row,
  author,
  linkedInConnected,
  onClose,
  onChanged,
}: {
  row: PlannerRow;
  author: PlannerAuthor;
  linkedInConnected: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [message, setMessage] = useState(row.message);
  const [imageUrl, setImageUrl] = useState<string | null>(row.imagePath);
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);

  function act(label: string, action: () => Promise<{ ok: boolean; message: string; data?: unknown }>) {
    setBusy(label);
    startTransition(async () => {
      try {
        const result = await action();
        if (result.ok) {
          toast.success(result.message);
          const data = result.data as { imagePath?: string } | undefined;
          if (data?.imagePath) setImageUrl(data.imagePath);
          onChanged();
        } else {
          toast.error(result.message);
        }
      } catch {
        toast.error("That action could not be completed.");
      } finally {
        setBusy(null);
      }
    });
  }

  const dispatchId = row.dispatchId ?? "";

  return (
    <div className="glass overflow-hidden">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <h3 className="font-display text-lg font-semibold text-ink">{row.title}</h3>
          <p className="mt-0.5 text-xs text-muted">
            {message.length.toLocaleString("en-GB")} / 3000 characters
            {row.manualEdit ? " · edited by hand, the planner will not overwrite it" : ""}
          </p>
        </div>
        <button type="button" className={buttonSecondaryClass} onClick={onClose}>
          <X className="size-4" aria-hidden="true" />
          Close
        </button>
      </header>

      <div className="grid gap-5 px-5 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="space-y-3">
          <label className="label-mono" htmlFor={`post-${dispatchId}`}>
            Post text
          </label>
          <textarea
            id={`post-${dispatchId}`}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={14}
            maxLength={3000}
            className="w-full rounded-control border border-line bg-canvas-2/70 px-3 py-2 font-mono text-xs leading-relaxed text-ink"
          />

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={buttonPrimaryClass}
              disabled={pending || message.trim() === row.message.trim()}
              onClick={() => act("save", () => savePostTextAction({ dispatchId, message }))}
            >
              <Save className="size-4" aria-hidden="true" />
              {busy === "save" ? "Saving…" : "Save post text"}
            </button>

            <button
              type="button"
              className={buttonSecondaryClass}
              disabled={pending}
              onClick={() => act("card", () => renderCardAction(dispatchId))}
            >
              <ImageDown className="size-4" aria-hidden="true" />
              {busy === "card" ? "Rendering…" : "Render card"}
            </button>

            <button
              type="button"
              className={buttonSecondaryClass}
              disabled={pending || !linkedInConnected}
              title={linkedInConnected ? undefined : "Connect LinkedIn before posting"}
              onClick={() => act("now", () => postNowAction(dispatchId))}
            >
              <Send className="size-4" aria-hidden="true" />
              {busy === "now" ? "Posting…" : "Post now"}
            </button>

            <button
              type="button"
              className={clsx(buttonSecondaryClass, "text-rose")}
              disabled={pending}
              onClick={() => act("cancel", () => cancelPostAction(dispatchId))}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Remove post
            </button>
          </div>

          {linkedInConnected ? null : (
            <p className="text-xs text-faint">
              LinkedIn is not connected, so &ldquo;Post now&rdquo; is disabled. The post text and card
              still save, and the schedule still publishes once an account is connected.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <span className="label-mono">LinkedIn preview</span>
          <LinkedInPreview
            authorName={author.name}
            authorHeadline={author.headline}
            avatarUrl={author.avatarUrl}
            message={message}
            imageUrl={imageUrl}
          />
        </div>
      </div>
    </div>
  );
}
