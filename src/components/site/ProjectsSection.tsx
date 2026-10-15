import { ArrowRight } from "lucide-react";

import { ActionLink } from "@/components/ui/ActionLink";
import { ProjectCard } from "@/components/site/ProjectCard";
import { Reveal } from "@/components/site/Reveal";
import type { ProjectSummary } from "@/components/site/types";

/**
 * The featured-projects grid used on the landing page. Cards are large and
 * image-led; the "all projects" action sits in a place the reader reaches after
 * scanning the three case studies, not below an endless scroll.
 */

export interface ProjectsSectionProps {
  projects: ProjectSummary[];
  showAllLink?: boolean;
}

export function ProjectsSection({ projects, showAllLink = true }: ProjectsSectionProps) {
  if (projects.length === 0) return null;

  return (
    <div className="mt-12">
      <div className="grid gap-6 lg:grid-cols-2">
        {projects.map((project, index) => (
          <Reveal key={project.slug} delay={index * 0.05}>
            <ProjectCard
              project={project}
              priority={index === 0}
              sizes="(min-width: 1024px) 560px, 100vw"
            />
          </Reveal>
        ))}
      </div>

      {showAllLink ? (
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <ActionLink href="/projects" icon={<ArrowRight className="h-4 w-4" />}>
            All projects
          </ActionLink>
        </div>
      ) : null}
    </div>
  );
}
