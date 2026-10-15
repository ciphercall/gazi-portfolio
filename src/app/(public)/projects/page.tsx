import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, LayoutGrid, SearchX } from "lucide-react";

import { ActionLink } from "@/components/ui/ActionLink";
import { Section } from "@/components/site/Section";
import { JsonLd } from "@/components/site/JsonLd";
import { ProjectCard } from "@/components/site/ProjectCard";
import { ProjectFilters } from "@/components/site/ProjectFilters";
import { Reveal } from "@/components/site/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getProjectSummaries, getProjectTech } from "@/lib/queries";
import { itemListJsonLd, loadProfileSafe, pageMetadata, requireProfile } from "@/lib/seo";

/**
 * Project index.
 *
 * Filtering is a URL parameter (`?tech=Laravel`) rather than client state: every
 * filtered view is a real, shareable, crawlable page that works with JavaScript
 * switched off.
 */

type ProjectsSearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstValue(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() || null;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: ProjectsSearchParams;
}): Promise<Metadata> {
  const [profile, params] = await Promise.all([loadProfileSafe(), searchParams]);
  const tech = firstValue(params.tech);
  const name = profile?.fullName || "Gazi Monir-Uz-Zaman";

  return pageMetadata({
    title: tech ? `${tech} projects` : "Projects",
    description: tech
      ? `Production systems ${name} built with ${tech} — what they do and how they were engineered.`
      : `Case studies of production systems ${name} designed and shipped: ERP, e-commerce, HRM, supply chain, real-time chat and industrial SCADA.`,
    path: tech ? `/projects?tech=${encodeURIComponent(tech)}` : "/projects",
    keywords: tech ? [tech, "portfolio", "case study"] : ["portfolio", "case studies"],
  });
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: ProjectsSearchParams;
}) {
  const [profile, params, tech] = await Promise.all([
    requireProfile(),
    searchParams,
    getProjectTech(),
  ]);

  const activeTech = firstValue(params.tech);

  const allProjects = await getProjectSummaries();
  const projects = activeTech
    ? allProjects.filter((project) => project.techStack.includes(activeTech))
    : allProjects;

  const countLabel = activeTech
    ? `${projects.length} ${projects.length === 1 ? "project" : "projects"} tagged ${activeTech}`
    : `${projects.length} ${projects.length === 1 ? "project" : "projects"}`;

  return (
    <>
      <JsonLd
        data={[
          itemListJsonLd(
            `Projects by ${profile.fullName}`,
            allProjects.map((project) => ({
              name: project.title,
              path: `/projects/${project.slug}`,
              description: project.summary,
            })),
          ),
        ]}
      />

      <Section className="pt-14 sm:pt-20">
        <SectionHeading
          as="h1"
          eyebrow="Projects"
          title={
            <>
              Systems in production — <span className="text-aurora">built, shipped, maintained</span>
            </>
          }
          lead="ERP, e-commerce, HRM, supply chain, real-time chat and industrial control. Filter by the technology you care about."
        />

        <div className="mt-10">
          <ProjectFilters tech={tech} active={activeTech} />
        </div>

        <p className="mt-6 flex items-center gap-2 text-sm text-muted">
          <LayoutGrid className="h-4 w-4 text-faint" aria-hidden="true" />
          <span>{countLabel}</span>
        </p>

        {projects.length > 0 ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((project, index) => (
              <Reveal key={project.slug} delay={index * 0.04} className="h-full">
                <ProjectCard
                  project={project}
                  priority={index === 0}
                  sizes="(min-width: 1280px) 400px, (min-width: 640px) 45vw, 100vw"
                />
              </Reveal>
            ))}
          </div>
        ) : (
          <div className="glass hairline mt-8 flex flex-col items-start gap-4 p-8">
            <span className="inline-flex items-center gap-3 text-ink">
              <SearchX className="h-5 w-5 text-teal" aria-hidden="true" />
              <span className="font-display text-lg font-semibold">
                No projects tagged “{activeTech}” yet
              </span>
            </span>
            <p className="max-w-xl text-sm text-muted">
              The filter is applied exactly as written. Try another technology, or view the whole
              set — there are {allProjects.length} case studies in total.
            </p>
            <ActionLink href="/projects" icon={<ArrowRight className="h-4 w-4" />}>
              Show all projects
            </ActionLink>
          </div>
        )}

        <div className="mt-12 flex flex-wrap items-center gap-3 border-t border-line pt-8">
          <ActionLink href="/contact" icon={<ArrowRight className="h-4 w-4" />}>
            Talk about a project like these
          </ActionLink>
          <Link
            href="/experience"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-ink"
          >
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
            <span>See the experience timeline</span>
          </Link>
        </div>
      </Section>
    </>
  );
}
