import type { ExperienceDto, ProjectDto, ProjectImageDto } from "@/lib/queries";

/**
 * Types the site shares with the data layer.
 *
 * These are type-only imports, so nothing from Prisma reaches the client
 * bundle — the shapes are erased at compile time.
 */

/** A project without its markdown body: what list payloads carry. */
export type ProjectSummary = Omit<ProjectDto, "body">;

export type { ExperienceDto, ProjectImageDto, ProjectDto };
