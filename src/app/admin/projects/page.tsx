import type { Metadata } from "next";
import { FolderKanban, Plus, SquarePen, Star } from "lucide-react";

import { ActionLink } from "@/components/admin/action-button";
import { AdminEmptyState, AdminPageFrame, AdminPageHeader } from "@/components/admin/page-frame";
import { DeleteEntityButton, PublishToggle, ReorderControls } from "@/components/admin/row-actions";
import { deleteProject, setProjectPublished } from "@/lib/admin/actions/projects";
import { requireAdmin } from "@/lib/auth";
import { listProjects } from "@/lib/admin/data";
import { truncate } from "@/lib/admin/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Projects",
  robots: { index: false, follow: false },
};

export default async function AdminProjectsPage() {
  await requireAdmin();

  const rows = await listProjects();
  const ids = rows.map((row) => row.id);

  return (
    <AdminPageFrame
      header={
        <AdminPageHeader
          eyebrow="Content"
          title="Projects"
          description={`${rows.length} project${rows.length === 1 ? "" : "s"} — ${rows.filter((row) => row.isPublished).length} published, ${rows.filter((row) => row.featured).length} featured.`}
          actions={
            <ActionLink
              icon={Plus}
              label="New project"
              href="/admin/projects/new"
              variant="primary"
              prefetch={false}
            />
          }
        />
      }
    >
      {rows.length === 0 ? (
        <AdminEmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Add a case study with a summary, a markdown body and a gallery."
          action={
            <ActionLink icon={Plus} label="New project" href="/admin/projects/new" variant="primary" prefetch={false} />
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
                  <span className="relative mt-0.5 block size-14 shrink-0 overflow-hidden rounded-control border border-line bg-canvas-2/60">
                    {row.coverPath ? (
                      // eslint-disable-next-line @next/next/no-img-element -- media volume asset
                      <img src={row.coverPath} alt="" className="size-full object-cover" />
                    ) : (
                      <span className="flex size-full items-center justify-center font-mono text-[10px] text-faint">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 truncate text-sm font-medium text-ink">
                      {row.title}
                      {row.featured ? (
                        <Star aria-label="featured" className="size-3.5 shrink-0 text-teal" />
                      ) : null}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {[row.role, row.client, row.year].filter(Boolean).join(" · ") || "—"}
                    </p>
                    {row.summary ? (
                      <p className="mt-1 text-xs text-faint">{truncate(row.summary, 140)}</p>
                    ) : null}
                    <p className="mt-1 font-mono text-[11px] text-faint">
                      /{row.slug} · order {row.order} · {row.images.length} image
                      {row.images.length === 1 ? "" : "s"}
                      {row.techStack.length > 0 ? ` · ${row.techStack.slice(0, 4).join(", ")}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <PublishToggle id={row.id} isPublished={row.isPublished} action={setProjectPublished} />
                  <ReorderControls model="project" ids={ids} index={index} />
                  <ActionLink
                    icon={SquarePen}
                    label="Edit"
                    href={`/admin/projects/${row.id}`}
                    size="sm"
                    prefetch={false}
                  />
                  <DeleteEntityButton id={row.id} action={deleteProject} entityLabel="project" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminPageFrame>
  );
}
