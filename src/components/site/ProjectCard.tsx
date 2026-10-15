import Link from "next/link";
import { ArrowUpRight, Briefcase, Building2, CalendarDays, Star } from "lucide-react";

import { Chip } from "@/components/ui/Chip";
import { ImageFrame } from "@/components/ui/ImageFrame";
import type { ProjectSummary } from "@/components/site/types";

/**
 * Project card.
 *
 * The title link stretches over the whole card (`after:inset-0`) so the target
 * is generous, while staying a single real anchor — the footer row is plain
 * text, never a second link nested inside the first.
 */

export interface ProjectCardProps {
  project: ProjectSummary;
  priority?: boolean;
  sizes?: string;
  className?: string;
}

export function ProjectCard({
  project,
  priority = false,
  sizes = "(min-width: 1024px) 520px, 100vw",
  className = "",
}: ProjectCardProps) {
  const tech = project.techStack.slice(0, 5);
  const extraTech = project.techStack.length - tech.length;

  return (
    <article
      className={`glass hairline card-lift group relative flex h-full flex-col overflow-hidden ${className}`}
    >
      <ImageFrame
        src={project.coverPath}
        alt={`${project.title} — cover image`}
        seed={project.slug}
        label={project.title}
        kind="Project"
        className="aspect-[16/10] w-full"
        roundedClassName="rounded-none"
        sizes={sizes}
        priority={priority}
      />

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        {project.featured ? (
          <div className="mb-3">
            <Chip tone="violet" icon={<Star className="h-3.5 w-3.5" />}>
              Featured
            </Chip>
          </div>
        ) : null}

        <h3 className="font-display text-xl font-semibold text-ink">
          <Link
            href={`/projects/${project.slug}`}
            className="after:absolute after:inset-0 after:rounded-card"
          >
            {project.title}
          </Link>
        </h3>

        <p className="mt-2 text-sm leading-relaxed text-muted">{project.summary}</p>

        {project.techStack.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {tech.map((item) => (
              <li key={item}>
                <Chip>{item}</Chip>
              </li>
            ))}
            {extraTech > 0 ? (
              <li>
                <Chip tone="outline">+{extraTech} more</Chip>
              </li>
            ) : null}
          </ul>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
          <div className="flex flex-wrap items-center gap-3 text-xs text-faint">
            {project.role ? (
              <span className="inline-flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5" aria-hidden="true" />
                {project.role}
              </span>
            ) : null}
            {project.client ? (
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
                {project.client}
              </span>
            ) : null}
            {project.year ? (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                {project.year}
              </span>
            ) : null}
          </div>

          <span className="inline-flex items-center gap-2 text-sm font-medium text-teal transition group-hover:text-cyan">
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            <span>View case study</span>
          </span>
        </div>
      </div>
    </article>
  );
}
