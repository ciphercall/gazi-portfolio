import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  Building2,
  CalendarDays,
  ExternalLink,
  Images,
  Layers,
} from "lucide-react";

import { ActionLink } from "@/components/ui/ActionLink";
import { Chip } from "@/components/ui/Chip";
import { ImageFrame } from "@/components/ui/ImageFrame";
import { JsonLd } from "@/components/site/JsonLd";
import { Markdown } from "@/components/site/Markdown";
import { ProjectGallery } from "@/components/site/ProjectGallery";
import { Section } from "@/components/site/Section";
import { BrandIcon } from "@/components/ui/BrandIcon";
import { breadcrumbJsonLd, pageMetadata, SITE_NAME } from "@/lib/seo";
import { getProjectBySlug, getProjectSummaries } from "@/lib/queries";

/**
 * Project case study.
 *
 * The body is author-written markdown rendered through `react-markdown`, with a
 * sticky detail rail so the reader never has to scroll back up to remember the
 * client, the role or the stack.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug).catch(() => null);

  if (!project) {
    return pageMetadata({
      title: "Project not found",
      description: `The requested project could not be found on ${SITE_NAME}.`,
      path: `/projects/${slug}`,
    });
  }

  return pageMetadata({
    title: project.title,
    description: project.summary,
    path: `/projects/${project.slug}`,
    keywords: project.techStack.slice(0, 10),
  });
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const summaries = await getProjectSummaries();
  const index = summaries.findIndex((item) => item.slug === project.slug);
  const candidate = index >= 0 && summaries.length > 1 ? summaries[(index + 1) % summaries.length] : undefined;
  const nextProject = candidate && candidate.slug !== project.slug ? candidate : undefined;

  const meta: { label: string; value: string; icon: ReactNode }[] = [];
  if (project.role) {
    meta.push({ label: "Role", value: project.role, icon: <Briefcase className="h-4 w-4" /> });
  }
  if (project.client) {
    meta.push({ label: "Client", value: project.client, icon: <Building2 className="h-4 w-4" /> });
  }
  if (project.year) {
    meta.push({
      label: "Year",
      value: String(project.year),
      icon: <CalendarDays className="h-4 w-4" />,
    });
  }

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Projects", path: "/projects" },
          { name: project.title, path: `/projects/${project.slug}` },
        ])}
      />

      <Section className="pt-8 sm:pt-10">
        <nav aria-label="Breadcrumb">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>All projects</span>
          </Link>
        </nav>

        <div className="mt-4 grid gap-3 lg:grid-cols-12 lg:gap-4">
          <div className="min-w-0 lg:col-span-8">
            <ImageFrame
              src={project.coverPath}
              alt={`${project.title} — cover image`}
              seed={project.slug}
              label={project.title}
              kind="Project cover"
              className="aspect-[16/9] w-full"
              sizes="(min-width: 1536px) 1020px, (min-width: 1024px) 66vw, 100vw"
              priority
            />
          </div>

          <div className="glass hairline flex min-w-0 flex-col rounded-card p-4 lg:col-span-4">
            {project.featured ? (
              <div className="mb-2">
                <Chip tone="violet" icon={<Layers className="h-3 w-3" />}>
                  Featured case study
                </Chip>
              </div>
            ) : null}

            <h1 className="text-title font-semibold text-ink">{project.title}</h1>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{project.summary}</p>

            {meta.length > 0 ? (
              <dl className="mt-3 flex flex-wrap gap-1.5">
                {meta.map((item) => (
                  <div key={item.label} className="pill">
                    <span className="text-teal" aria-hidden="true">
                      {item.icon}
                    </span>
                    <dt className="label-mono">{item.label}</dt>
                    <dd className="text-[12px] font-medium text-ink">{item.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {project.liveUrl ? (
                <ActionLink
                  href={project.liveUrl}
                  variant="primary"
                  external
                  icon={<ExternalLink className="h-4 w-4" />}
                >
                  Open live site
                </ActionLink>
              ) : null}
              {project.repoUrl ? (
                <ActionLink href={project.repoUrl} external icon={<BrandIcon name="github" className="h-4 w-4" />}>
                  View repository
                </ActionLink>
              ) : null}
              <ActionLink href="/contact" icon={<ArrowRight className="h-4 w-4" />}>
                Build something like this
              </ActionLink>
            </div>
          </div>
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-12 lg:gap-4">
          <article aria-labelledby="case-study-heading" className="glass hairline min-w-0 rounded-card p-4 lg:col-span-8 sm:p-5">
            <h2 id="case-study-heading" className="label-mono">
              Case study
            </h2>
            <div className="mt-3">
              {project.body.trim() ? (
                <Markdown>{project.body}</Markdown>
              ) : (
                <p className="text-muted">
                  A written case study for this project is on the way. In the meantime, the summary
                  above covers what it does, and the stack is listed alongside.
                </p>
              )}
            </div>
          </article>

          <aside className="min-w-0 lg:col-span-4 lg:sticky lg:top-20 lg:self-start">
            <div className="glass hairline rounded-card p-4">
              <h2 className="font-display text-[13.5px] font-semibold text-ink">Project details</h2>

              <dl className="mt-3 grid gap-2.5 text-[12.5px]">
                <div>
                  <dt className="label-mono">Role</dt>
                  <dd className="mt-1 text-muted">{project.role ?? "Full-stack developer"}</dd>
                </div>
                <div>
                  <dt className="label-mono">Client</dt>
                  <dd className="mt-1 text-muted">{project.client ?? "Independent work"}</dd>
                </div>
                <div>
                  <dt className="label-mono">Year</dt>
                  <dd className="mt-1 text-muted">{project.year ?? "Ongoing"}</dd>
                </div>
                <div>
                  <dt className="label-mono">Technology</dt>
                  <dd className="mt-2 flex flex-wrap gap-2">
                    {project.techStack.map((tech) => (
                      <Chip key={tech}>{tech}</Chip>
                    ))}
                  </dd>
                </div>
              </dl>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-3">
                {project.liveUrl ? (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-teal transition hover:text-cyan"
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    <span>Live site</span>
                  </a>
                ) : null}
                {project.repoUrl ? (
                  <a
                    href={project.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-teal transition hover:text-cyan"
                  >
                    <BrandIcon name="github" className="h-4 w-4" />
                    <span>Repository</span>
                  </a>
                ) : null}
                <Link
                  href="/projects"
                  className="inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-ink"
                >
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  <span>Browse all projects</span>
                </Link>
              </div>
            </div>
          </aside>
        </div>

        {project.images.length > 0 ? (
          <section className="mt-6" aria-labelledby="gallery-heading">
            <div className="flex flex-wrap items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-control border border-line bg-panel text-teal" aria-hidden="true">
                <Images className="h-5 w-5" />
              </span>
              <div>
                <h2 id="gallery-heading" className="font-display text-base font-semibold text-ink">
                  Gallery
                </h2>
                <p className="label-mono">
                  {project.images.length} {project.images.length === 1 ? "image" : "images"} — play
                  the slideshow, or open any image at full size
                </p>
              </div>
            </div>

            <div className="mt-6">
              <ProjectGallery images={project.images} projectTitle={project.title} />
            </div>
          </section>
        ) : null}

        {nextProject ? (
          <nav aria-label="Next project" className="mt-6">
            <Link
              href={`/projects/${nextProject.slug}`}
              className="glass hairline bento-lift group flex flex-wrap items-center justify-between gap-3 rounded-card p-4"
            >
              <span className="min-w-0">
                <span className="label-mono block">Next case study</span>
                <span className="mt-0.5 block font-display text-base font-semibold text-ink">
                  {nextProject.title}
                </span>
                <span className="mt-0.5 block max-w-2xl text-[12.5px] text-muted">
                  {nextProject.summary}
                </span>
              </span>
              <span className="inline-flex items-center gap-2 text-sm font-medium text-teal transition group-hover:text-cyan">
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
                <span>Open project</span>
              </span>
            </Link>
          </nav>
        ) : null}
      </Section>
    </>
  );
}
