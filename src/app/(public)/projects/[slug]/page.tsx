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

      <Section className="pt-12 sm:pt-16">
        <nav aria-label="Breadcrumb">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>All projects</span>
          </Link>
        </nav>

        <header className="mt-8 max-w-4xl">
          {project.featured ? (
            <div className="mb-4">
              <Chip tone="violet" icon={<Layers className="h-3.5 w-3.5" />}>
                Featured case study
              </Chip>
            </div>
          ) : null}

          <h1 className="text-display font-semibold text-ink">{project.title}</h1>
          <p className="mt-5 text-lg leading-relaxed text-muted sm:text-xl">{project.summary}</p>

          {meta.length > 0 ? (
            <dl className="mt-7 flex flex-wrap gap-3">
              {meta.map((item) => (
                <div key={item.label} className="pill">
                  <span className="text-teal" aria-hidden="true">
                    {item.icon}
                  </span>
                  <dt className="label-mono">{item.label}</dt>
                  <dd className="font-medium text-ink">{item.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          <div className="mt-7 flex flex-wrap items-center gap-3">
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
        </header>

        <div className="mt-12">
          <ImageFrame
            src={project.coverPath}
            alt={`${project.title} — cover image`}
            seed={project.slug}
            label={project.title}
            kind="Project cover"
            className="aspect-[16/9] w-full"
            sizes="(min-width: 1024px) 1100px, 100vw"
            priority
          />
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.6fr_0.9fr] lg:gap-14">
          <article aria-labelledby="case-study-heading">
            <h2 id="case-study-heading" className="label-mono">
              Case study
            </h2>
            <div className="mt-5">
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

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="glass hairline p-6">
              <h2 className="font-display text-base font-semibold text-ink">Project details</h2>

              <dl className="mt-5 grid gap-4 text-sm">
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

              <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-5">
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
          <section className="mt-16" aria-labelledby="gallery-heading">
            <div className="flex flex-wrap items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-control border border-line bg-panel text-teal" aria-hidden="true">
                <Images className="h-5 w-5" />
              </span>
              <div>
                <h2 id="gallery-heading" className="font-display text-lg font-semibold text-ink">
                  Gallery
                </h2>
                <p className="label-mono">
                  {project.images.length} {project.images.length === 1 ? "image" : "images"} — click
                  any image to enlarge
                </p>
              </div>
            </div>

            <div className="mt-6">
              <ProjectGallery images={project.images} projectTitle={project.title} />
            </div>
          </section>
        ) : null}

        {nextProject ? (
          <nav aria-label="Next project" className="mt-16">
            <Link
              href={`/projects/${nextProject.slug}`}
              className="glass hairline card-lift group flex flex-wrap items-center justify-between gap-4 p-6"
            >
              <span className="min-w-0">
                <span className="label-mono block">Next case study</span>
                <span className="mt-1 block font-display text-xl font-semibold text-ink">
                  {nextProject.title}
                </span>
                <span className="mt-1 block max-w-2xl text-sm text-muted">
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
