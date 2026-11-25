import { ArrowRight } from "lucide-react";

import { ActionLink } from "@/components/ui/ActionLink";
import { FeaturedRail } from "@/components/site/FeaturedRail";
import { ProjectCard } from "@/components/site/ProjectCard";
import { Reveal } from "@/components/site/Reveal";
import type { ProjectSummary } from "@/components/site/types";

/**
 * The featured-projects band.
 *
 * With two or more projects it becomes a scroll-pinned rail on large screens —
 * the immersive moment of the homepage — and a normal grid everywhere else.
 * Both paths render the same cards, so content, links and image sizes agree.
 */

export interface ProjectsSectionProps {
  projects: ProjectSummary[];
  showAllLink?: boolean;
}

const CARD_SIZES = "(min-width: 1280px) 600px, (min-width: 640px) 46vw, 100vw";

export function ProjectsSection({ projects, showAllLink = true }: ProjectsSectionProps) {
  if (projects.length === 0) return null;

  const useRail = projects.length >= 2;

  return (
    <div>
      {useRail ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:hidden">
            {projects.map((project, index) => (
              <Reveal key={project.slug} delay={index * 0.04} className="h-full">
                <ProjectCard
                  project={project}
                  priority={index === 0}
                  sizes={CARD_SIZES}
                />
              </Reveal>
            ))}
          </div>

          <FeaturedRail className="hidden lg:block">
            {projects.map((project, index) => (
              <div key={project.slug} className="w-[min(42vw,600px)] shrink-0">
                <Reveal delay={index * 0.04} className="h-full">
                  <ProjectCard
                    project={project}
                    priority={index === 0}
                    sizes={CARD_SIZES}
                  />
                </Reveal>
              </div>
            ))}
          </FeaturedRail>
        </>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {projects.map((project, index) => (
            <Reveal key={project.slug} delay={index * 0.05}>
              <ProjectCard project={project} priority={index === 0} sizes={CARD_SIZES} />
            </Reveal>
          ))}
        </div>
      )}

      {showAllLink ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <ActionLink href="/projects" icon={<ArrowRight className="h-4 w-4" />}>
            All projects
          </ActionLink>
        </div>
      ) : null}
    </div>
  );
}
