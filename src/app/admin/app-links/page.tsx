import type { Metadata } from "next";
import { ArrowDown, ArrowUp, Globe, Plus, SquarePen } from "lucide-react";

import { ActionLink } from "@/components/admin/action-link";
import { AdminEmptyState, AdminPageFrame, AdminPageHeader } from "@/components/admin/page-frame";
import { DeleteEntityButton, PublishToggle, RunActionButton } from "@/components/admin/row-actions";
import { deleteAppLink, moveAppLink, setAppLinkPublished } from "@/lib/admin/actions/app-links";
import { requireAdmin } from "@/lib/auth";
import { listAppLinks } from "@/lib/admin/data";
import { truncate } from "@/lib/admin/format";
import { APP_PLATFORM_LABELS } from "@/lib/admin/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Apps & sites",
  robots: { index: false, follow: false },
};

export default async function AdminAppLinksPage() {
  await requireAdmin();

  const rows = await listAppLinks();

  return (
    <AdminPageFrame
      header={
        <AdminPageHeader
          eyebrow="Content"
          title="Apps & sites"
          description={`${rows.length} link${rows.length === 1 ? "" : "s"} — ${rows.filter((row) => row.isPublished).length} published. These are the studio site and the Android builds promoted on the landing page and in the footer.`}
          actions={
            <ActionLink
              icon={Plus}
              label="New app link"
              href="/admin/app-links/new"
              variant="primary"
              prefetch={false}
            />
          }
        />
      }
    >
      {rows.length === 0 ? (
        <AdminEmptyState
          icon={Globe}
          title="No app links yet"
          description="Add the studio site or an Android build and it appears in the Apps & sites section and the footer."
          action={
            <ActionLink
              icon={Plus}
              label="New app link"
              href="/admin/app-links/new"
              variant="primary"
              prefetch={false}
            />
          }
        />
      ) : (
        <ul className="flex flex-col gap-2.5">
          {rows.map((row, index) => (
            <li
              key={row.id}
              className="rounded-card border border-line bg-panel px-3.5 py-3 transition hover:border-line-strong"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-control border border-line bg-canvas-2/60 font-mono text-xs text-muted">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{row.name}</p>
                    <p className="truncate text-xs text-muted">
                      {APP_PLATFORM_LABELS[row.platform]} · {row.href}
                    </p>
                    {row.tagline ? (
                      <p className="mt-1 text-xs text-faint">{truncate(row.tagline, 140)}</p>
                    ) : null}
                    <p className="mt-1 font-mono text-[11px] text-faint">
                      /{row.slug} · order {row.order}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <PublishToggle
                    id={row.id}
                    isPublished={row.isPublished}
                    action={setAppLinkPublished}
                  />
                  <RunActionButton
                    action={moveAppLink}
                    input={{ id: row.id, direction: "up" as const }}
                    icon={ArrowUp}
                    label="Move up"
                    variant="ghost"
                    size="sm"
                    disabled={index === 0}
                  />
                  <RunActionButton
                    action={moveAppLink}
                    input={{ id: row.id, direction: "down" as const }}
                    icon={ArrowDown}
                    label="Move down"
                    variant="ghost"
                    size="sm"
                    disabled={index === rows.length - 1}
                  />
                  <ActionLink
                    icon={SquarePen}
                    label="Edit"
                    href={`/admin/app-links/${row.id}`}
                    size="sm"
                    prefetch={false}
                  />
                  <DeleteEntityButton id={row.id} action={deleteAppLink} entityLabel="app link" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminPageFrame>
  );
}
