import Link from "next/link";
import { LayoutGrid, Tag } from "lucide-react";

/**
 * Technology filter for the project grid.
 *
 * The state lives in the URL (`?tech=Laravel`), so a filtered view is
 * shareable, crawlable and works without JavaScript. The active chip is marked
 * with `aria-current` as well as colour.
 */

export interface ProjectFiltersProps {
  tech: string[];
  active: string | null;
}

export function ProjectFilters({ tech, active }: ProjectFiltersProps) {
  const base =
    "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition duration-300 ease-aurora";
  const inactive = "border-line-strong bg-panel text-muted hover:text-ink hover:-translate-y-0.5";
  const current =
    "border-transparent text-on-accent shadow-glow bg-[linear-gradient(100deg,var(--c-teal),var(--c-cyan)_45%,var(--c-violet))]";

  return (
    <nav aria-label="Filter projects by technology">
      <p className="label-mono">Filter by technology</p>

      <ul className="mt-3 flex flex-wrap gap-2">
        <li>
          <Link
            href="/projects"
            aria-current={active === null ? "page" : undefined}
            className={`${base} ${active === null ? current : inactive}`}
          >
            <LayoutGrid className="h-4 w-4" aria-hidden="true" />
            <span>All projects</span>
          </Link>
        </li>

        {tech.map((item) => {
          const isActive = active === item;
          return (
            <li key={item}>
              <Link
                href={`/projects?tech=${encodeURIComponent(item)}`}
                aria-current={isActive ? "page" : undefined}
                className={`${base} ${isActive ? current : inactive}`}
              >
                <Tag className="h-4 w-4" aria-hidden="true" />
                <span>{item}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
