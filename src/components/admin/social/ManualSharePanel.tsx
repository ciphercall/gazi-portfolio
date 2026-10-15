"use client";

import clsx from "clsx";
import {
  Briefcase,
  ClipboardCopy,
  FolderKanban,
  Send,
  TriangleAlert,
  Users,
} from "lucide-react";

import { useCopy } from "@/components/admin/social/use-copy";
import {
  ActionLink,
  Note,
  Panel,
  ReadOnlyField,
  StickyActionBar,
  buttonSecondaryClass,
} from "@/components/admin/social/ui";

/**
 * Manual share — the path that needs no credentials, no OAuth app and no token
 * key, and the reason this feature is useful on day one.
 *
 * The post text and both destination links are computed on the server and passed
 * in as plain strings, so the LinkedIn and Facebook buttons are ordinary anchors:
 * they work with JavaScript disabled, before any account is connected, and even
 * if every credential in the deployment is missing.
 *
 * What these links do, stated plainly: they open the provider's own composer
 * with the text prefilled. The owner still presses publish there. Nothing here
 * pretends to be an API call, and nothing here can touch a profile's Experience
 * section — no API can.
 *
 * Layout note: the post text lives in a scroll region and the actions live in a
 * sticky bar *outside* it, so Copy and both share links stay reachable however
 * long the generated copy gets.
 */

export interface ManualSharePanelProps {
  subjectType: "EXPERIENCE" | "PROJECT";
  title: string;
  /** Company and dates, or role and year. Null when there is nothing to add. */
  subtitle: string | null;
  /** False when the public page is still a draft, so the link may 404. */
  isPublished: boolean;
  text: string;
  url: string;
  linkedinHref: string;
  facebookHref: string;
  copyText: string;
}

export function ManualSharePanel(props: ManualSharePanelProps) {
  const { subjectType, title, subtitle, isPublished, text, url, linkedinHref, facebookHref, copyText } =
    props;

  const copy = useCopy();
  const TypeIcon = subjectType === "EXPERIENCE" ? Briefcase : FolderKanban;

  return (
    <Panel
      title={title}
      aside={
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-panel px-2.5 py-1 text-xs font-medium text-muted">
          <TypeIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {subjectType === "EXPERIENCE" ? "Experience" : "Project"}
        </span>
      }
      description={
        subtitle ? <p className="text-sm text-muted">{subtitle}</p> : undefined
      }
    >
      <div className="space-y-4 px-5 pt-5 sm:px-6">
        {isPublished ? null : (
          <Note tone="warning">
            <p>
              This {subjectType === "EXPERIENCE" ? "experience" : "project"} is not published yet,
              so the link below may not resolve for anyone else. The share links will still open,
              but check the page before you post the URL anywhere public.
            </p>
          </Note>
        )}

        <ReadOnlyField
          label="Public page this links to"
          value={<span className="font-mono text-xs break-all">{url}</span>}
        />

        <div className="grid gap-1.5">
          <span className="label-mono">
            Post text — {text.length.toLocaleString("en-GB")} characters
          </span>
          {/* Scroll region. The action bar below is a sibling, not a child. */}
          <div className="max-h-56 overflow-y-auto rounded-control border border-line bg-canvas-2/70">
            <p className="cursor-text px-3 py-3 text-sm leading-relaxed break-words whitespace-pre-wrap text-muted select-all">
              {text}
            </p>
          </div>
        </div>
      </div>

      <StickyActionBar className="mt-5">
        <button type="button" onClick={() => copy.copy(copyText)} className={buttonSecondaryClass}>
          <ClipboardCopy className="h-4 w-4 shrink-0" aria-hidden="true" />
          {copy.state === "copied"
            ? "Copied to clipboard"
            : copy.state === "failed"
              ? "Copy blocked — select the text instead"
              : "Copy post text"}
        </button>

        <ActionLink href={linkedinHref} icon={Briefcase} variant="secondary" external>
          Share on LinkedIn
        </ActionLink>

        <ActionLink href={facebookHref} icon={Users} variant="secondary" external>
          Share on Facebook
        </ActionLink>

        <span
          className={clsx(
            "ml-auto inline-flex items-center gap-1.5 text-xs",
            copy.state === "failed" ? "text-rose" : "text-faint",
          )}
        >
          {copy.state === "failed" ? (
            <>
              <TriangleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Clipboard unavailable — the text is selectable above
            </>
          ) : (
            <>
              <Send className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Opens the provider&rsquo;s composer with the text prefilled
            </>
          )}
        </span>
      </StickyActionBar>
    </Panel>
  );
}
