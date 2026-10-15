import type { Metadata } from "next";
import { Briefcase, Plus, SquarePen } from "lucide-react";

import { ActionLink } from "@/components/admin/action-button";
import { AdminEmptyState, AdminPageFrame, AdminPageHeader } from "@/components/admin/page-frame";
import { DeleteEntityButton, PublishToggle, ReorderControls } from "@/components/admin/row-actions";
import { deleteExperience, setExperiencePublished } from "@/lib/admin/actions/experiences";
import { requireAdmin } from "@/lib/auth";
import { listExperiences } from "@/lib/admin/data";
import { formatDateRange, truncate } from "@/lib/admin/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Experience",
  robots: { index: false, follow: false },
};

/**
 * `/admin/experiences`
 *
 * Shows drafts too — the public queries deliberately hide them, so this is the
 * only place the owner can see everything and flip visibility from the list.
 */
export default async function AdminExperiencesPage() {
  await requireAdmin();

  const rows = await listExperiences();
  const ids = rows.map((row) => row.id);

  return (
    <AdminPageFrame
      header={
        <AdminPageHeader
          eyebrow="Content"
          title="Experience"
          description={`${rows.length} role${rows.length === 1 ? "" : "s"} — ${rows.filter((row) => row.isPublished).length} published. Order here is the order on the CV.`}
          actions={
            <ActionLink
              icon={Plus}
              label="New experience"
              href="/admin/experiences/new"
              variant="primary"
              prefetch={false}
            />
          }
        />
      }
    >
      {rows.length === 0 ? (
        <AdminEmptyState
          icon={Briefcase}
          title="No experience rows yet"
          description="Add the first role and it will appear on the landing page, the API and both CV variants."
          action={
            <ActionLink icon={Plus} label="New experience" href="/admin/experiences/new" variant="primary" prefetch={false} />
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
                    <p className="truncate text-sm font-medium text-ink">{row.title}</p>
                    <p className="truncate text-xs text-muted">
                      {row.company} · {formatDateRange(row.startDate, row.endDate, row.isCurrent)}
                    </p>
                    {row.summary ? (
                      <p className="mt-1 text-xs text-faint">{truncate(row.summary, 140)}</p>
                    ) : null}
                    <p className="mt-1 font-mono text-[11px] text-faint">
                      /{row.slug} · order {row.order} · {row.tags.length} tag
                      {row.tags.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <PublishToggle
                    id={row.id}
                    isPublished={row.isPublished}
                    action={setExperiencePublished}
                  />
                  <ReorderControls model="experience" ids={ids} index={index} />
                  <ActionLink
                    icon={SquarePen}
                    label="Edit"
                    href={`/admin/experiences/${row.id}`}
                    size="sm"
                    prefetch={false}
                  />
                  <DeleteEntityButton id={row.id} action={deleteExperience} entityLabel="experience" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminPageFrame>
  );
}
