import {
  Award,
  Briefcase,
  Clock,
  FileText,
  FolderKanban,
  GraduationCap,
  Sparkles,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import { ActionLink } from "@/components/admin/action-button";
import { StatusChip } from "@/components/admin/fields";
import { AdminEmptyState, AdminSection } from "@/components/admin/page-frame";
import { requireAdmin } from "@/lib/auth";
import { getDashboardCounts, getLastLogin } from "@/lib/admin/data";
import { formatBytes, formatRelative, formatTimestamp, truncate } from "@/lib/admin/format";
import { getGeneratedAsset } from "@/lib/queries";

/**
 * `/admin` — the panel's home.
 *
 * Answers three questions the owner actually has: what is in the database, is
 * the CV download current, and where do I go to change each part of it.
 */

export const dynamic = "force-dynamic";

interface QuickLink {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  count?: number;
  published?: number;
}

export default async function AdminDashboardPage() {
  const session = await requireAdmin();

  const [counts, lastLogin, cvDesigned, cvAts] = await Promise.all([
    getDashboardCounts(),
    getLastLogin(session.email),
    getGeneratedAsset("CV_DESIGNED"),
    getGeneratedAsset("CV_ATS"),
  ]);

  const links: QuickLink[] = [
    {
      href: "/admin/profile",
      label: "Profile",
      description: "Identity, summary and contact handles",
      icon: UserRound,
    },
    {
      href: "/admin/experiences",
      label: "Experience",
      description: "Roles, bullets and posting text",
      icon: Briefcase,
      count: counts.experiences,
      published: counts.experiencesPublished,
    },
    {
      href: "/admin/projects",
      label: "Projects",
      description: "Case studies, galleries and links",
      icon: FolderKanban,
      count: counts.projects,
      published: counts.projectsPublished,
    },
    {
      href: "/admin/education",
      label: "Education",
      description: "Schools, degrees and dates",
      icon: GraduationCap,
      count: counts.educations,
    },
    {
      href: "/admin/skills",
      label: "Skills",
      description: "Grouped by category",
      icon: Sparkles,
      count: counts.skills,
    },
    {
      href: "/admin/certifications",
      label: "Certifications",
      description: "Courses and credentials",
      icon: Award,
      count: counts.certifications,
    },
  ];

  return (
    <div className="h-full min-h-0 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="label-mono">Dashboard</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
              <span className="text-aurora">{session.name || "Admin"}</span>
            </h1>
            <p className="mt-1 flex items-center gap-2 text-sm text-muted">
              <Clock aria-hidden className="size-3.5 text-faint" />
              Last sign-in: {lastLogin ? `${formatTimestamp(lastLogin)} (${formatRelative(lastLogin)})` : "this is your first sign-in"}
            </p>
          </div>
          <ActionLink icon={UserRound} label="Edit profile" href="/admin/profile" variant="primary" />
        </div>

        <AdminSection
          title="Content"
          description="Every editor, with how much of it is live on the public site."
          icon={FolderKanban}
        >
          <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="flex h-full flex-col gap-1 rounded-card border border-line bg-canvas-2/40 px-3.5 py-3 transition hover:border-teal/50 hover:bg-teal/5"
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-sm font-medium text-ink">
                        <Icon aria-hidden className="size-4 text-teal" />
                        {link.label}
                      </span>
                      {link.count === undefined ? null : (
                        <span className="font-mono text-xs tabular-nums text-muted">
                          {link.count}
                          {link.published === undefined ? null : (
                            <span className="text-faint"> · {link.published} live</span>
                          )}
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-faint">{link.description}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </AdminSection>

        <AdminSection
          title="CV downloads"
          description="Regenerated in the background after every content save. A stale sourceHash means the visitor's download would be out of date."
          icon={FileText}
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <CvAssetCard label="Designed CV" asset={cvDesigned} />
            <CvAssetCard label="ATS CV" asset={cvAts} />
          </div>
        </AdminSection>

        <AdminSection title="Where to next" icon={Sparkles} tone="sunk">
          <div className="flex flex-wrap gap-2">
            <ActionLink icon={Briefcase} label="Add an experience" href="/admin/experiences/new" />
            <ActionLink icon={FolderKanban} label="Add a project" href="/admin/projects/new" />
            <ActionLink icon={Sparkles} label="Add a skill" href="/admin/skills" />
            <ActionLink icon={Award} label="Add a certification" href="/admin/certifications" />
          </div>
        </AdminSection>
      </div>
    </div>
  );
}

interface CvAssetRecord {
  path: string;
  bytes: number;
  sha256: string;
  sourceHash: string;
  error: string | null;
  generatedAt: Date;
}

function CvAssetCard({
  label,
  asset,
}: {
  label: string;
  asset: CvAssetRecord | null;
}) {
  if (!asset) {
    return (
      <AdminEmptyState
        icon={FileText}
        title={`${label} — not generated yet`}
        description="It is built in the background on the next content save, and on the first download."
      />
    );
  }

  const failed = Boolean(asset.error);

  return (
    <div className="flex flex-col gap-3 rounded-card border border-line bg-canvas-2/40 px-3.5 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-ink">{label}</span>
        {failed ? (
          <StatusChip tone="warn">Last attempt failed</StatusChip>
        ) : (
          <StatusChip tone="ok">Generated</StatusChip>
        )}
      </div>

      <dl className="grid grid-cols-1 gap-1.5 text-xs">
        <Row label="Generated" value={formatTimestamp(asset.generatedAt.toISOString())} />
        <Row label="Size" value={formatBytes(asset.bytes)} />
        <Row label="sourceHash" value={truncate(asset.sourceHash || "—", 26)} mono />
        <Row label="File" value={truncate(asset.path, 46)} mono />
      </dl>

      {failed && asset.error ? (
        <p className="rounded-control border border-rose/40 bg-rose/10 px-2.5 py-2 text-xs text-rose">
          {truncate(asset.error, 220)}
        </p>
      ) : null}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-faint">{label}</dt>
      <dd className={mono ? "font-mono text-[11px] text-muted" : "text-muted"}>{value}</dd>
    </div>
  );
}
