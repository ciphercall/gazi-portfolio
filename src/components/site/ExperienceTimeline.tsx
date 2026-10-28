import { Briefcase, CalendarDays, CircleDot, MapPin } from "lucide-react";

import { Chip } from "@/components/ui/Chip";
import { IconBadge } from "@/components/ui/IconBadge";
import { Reveal } from "@/components/site/Reveal";
import { formatRange } from "@/components/site/format";
import type { ExperienceDto } from "@/lib/queries";

/**
 * The experience timeline.
 *
 * Grouped by employment type (the same split the CV uses), each entry an
 * `article` with title, company, dates, summary, bullets and stack. Current
 * roles carry a labelled marker — an icon and the words "Current role", so the
 * distinction survives greyscale printing.
 */

export interface TimelineGroup {
  key: string;
  label: string;
  blurb: string;
  items: ExperienceDto[];
}

export function ExperienceTimeline({ groups }: { groups: TimelineGroup[] }) {
  const visible = groups.filter((group) => group.items.length > 0);
  if (visible.length === 0) return null;

  return (
    <div className="mt-10 grid gap-10">
      {visible.map((group) => (
        <div key={group.key}>
          <div className="flex flex-wrap items-center gap-3">
            <IconBadge size="sm">
              <Briefcase className="h-4 w-4" aria-hidden="true" />
            </IconBadge>
            <h3 className="font-display text-base font-semibold text-ink">{group.label}</h3>
            <span className="label-mono">
              {group.items.length} {group.items.length === 1 ? "role" : "roles"}
            </span>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-faint">{group.blurb}</p>

          <ol className="relative mt-5 grid gap-4 border-l border-line pl-5 sm:pl-6">
            {group.items.map((item, index) => (
              <li key={item.slug} className="relative">
                <span
                  aria-hidden="true"
                  className={`absolute -left-6 top-8 h-3 w-3 -translate-x-1/2 rounded-full sm:-left-8 ${
                    item.isCurrent ? "shadow-glow ring-4 ring-[color-mix(in_oklab,var(--c-teal)_18%,transparent)]" : ""
                  }`}
                  style={{
                    backgroundImage: item.isCurrent
                      ? "linear-gradient(100deg, var(--c-teal), var(--c-cyan))"
                      : "linear-gradient(140deg, var(--c-line-strong), var(--c-faint))",
                  }}
                />

                <Reveal delay={index * 0.04}>
                  <article className="glass hairline card-lift p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h4 className="font-display text-base font-semibold text-ink">
                          {item.title}
                        </h4>
                        <p className="mt-1 text-sm text-muted">
                          {item.companyUrl ? (
                            <a
                              href={item.companyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline decoration-line-strong underline-offset-4 transition hover:text-ink"
                            >
                              {item.company}
                            </a>
                          ) : (
                            item.company
                          )}
                          {item.location ? (
                            <span className="text-faint"> · {item.location}</span>
                          ) : null}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Chip icon={<CalendarDays className="h-3.5 w-3.5" />}>
                          {formatRange(item.startDate, item.endDate, item.isCurrent)}
                        </Chip>
                        {item.isCurrent ? (
                          <Chip tone="accent" icon={<CircleDot className="h-3.5 w-3.5" />}>
                            Current role
                          </Chip>
                        ) : null}
                      </div>
                    </div>

                    {item.summary ? (
                      <p className="mt-4 text-sm leading-relaxed text-muted">
                        {item.summary}
                      </p>
                    ) : null}

                    {item.bullets.length > 0 ? (
                      <ul className="mt-4 grid gap-2">
                        {item.bullets.map((bullet) => (
                          <li
                            key={bullet}
                            className="flex gap-3 text-sm leading-relaxed text-muted"
                          >
                            <span
                              aria-hidden="true"
                              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-sm"
                              style={{
                                backgroundImage:
                                  "linear-gradient(120deg, var(--c-teal), var(--c-violet))",
                              }}
                            />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    {item.tags.length > 0 ? (
                      <ul className="mt-5 flex flex-wrap gap-2">
                        {item.tags.map((tag) => (
                          <li key={tag}>
                            <Chip tone="outline">{tag}</Chip>
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    {item.location ? (
                      <p className="mt-4 inline-flex items-center gap-2 text-xs text-faint">
                        <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{item.location}</span>
                      </p>
                    ) : null}
                  </article>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}
