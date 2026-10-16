import { Award, CalendarDays, ExternalLink, GraduationCap } from "lucide-react";

import { IconBadge } from "@/components/ui/IconBadge";
import { Reveal } from "@/components/site/Reveal";
import { formatLongDate } from "@/components/site/format";

/**
 * Education and certifications.
 *
 * Structurally typed props keep this component independent of Prisma: any row
 * that carries these fields can be rendered, including the CV source object.
 */

export interface EducationEntry {
  school: string;
  degree: string;
  field: string | null;
  startYear: number;
  endYear: number;
  details: string | null;
}

export interface CertificationEntry {
  name: string;
  issuer: string;
  issuedOn: Date | string | null;
  url: string | null;
}

export interface EducationSectionProps {
  educations: EducationEntry[];
  certifications: CertificationEntry[];
}

function issuedLabel(issuedOn: Date | string | null): string {
  if (!issuedOn) return "";
  if (issuedOn instanceof Date) return formatLongDate(issuedOn.toISOString().slice(0, 10));
  return formatLongDate(issuedOn.slice(0, 10));
}

export function EducationSection({ educations, certifications }: EducationSectionProps) {
  const both = educations.length > 0 && certifications.length > 0;
  return (
    <div className={`mt-12 grid gap-6 ${both ? "lg:grid-cols-2" : "lg:grid-cols-1"}`}>
      {educations.length > 0 ? (
        <Reveal>
          <section className="glass hairline h-full p-6" aria-labelledby="education-heading">
            <div className="flex items-center gap-3">
              <IconBadge>
                <GraduationCap className="h-5 w-5" aria-hidden="true" />
              </IconBadge>
              <div>
                <h3 id="education-heading" className="font-display text-lg font-semibold text-ink">
                  Education
                </h3>
                <p className="label-mono">{educations.length} qualifications</p>
              </div>
            </div>

            <ul className="mt-6 grid gap-5">
              {educations.map((entry) => (
                <li key={`${entry.school}-${entry.degree}`} className="border-b border-line pb-5 last:border-b-0 last:pb-0">
                  <h4 className="font-display text-base font-semibold text-ink">
                    {entry.degree}
                    {entry.field ? <span className="text-muted"> · {entry.field}</span> : null}
                  </h4>
                  <p className="mt-1 text-sm text-muted">{entry.school}</p>
                  <p className="mt-2 inline-flex items-center gap-2 text-xs text-faint">
                    <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>
                      {entry.startYear} — {entry.endYear}
                    </span>
                  </p>
                  {entry.details ? (
                    <p className="mt-2 text-sm leading-relaxed text-muted">{entry.details}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        </Reveal>
      ) : null}

      {certifications.length > 0 ? (
        <Reveal delay={0.05}>
          <section className="glass hairline h-full p-6" aria-labelledby="certifications-heading">
            <div className="flex items-center gap-3">
              <IconBadge toneClassName="text-violet">
                <Award className="h-5 w-5" aria-hidden="true" />
              </IconBadge>
              <div>
                <h3
                  id="certifications-heading"
                  className="font-display text-lg font-semibold text-ink"
                >
                  Certifications
                </h3>
                <p className="label-mono">{certifications.length} credentials</p>
              </div>
            </div>

            <ul className="mt-6 grid gap-5">
              {certifications.map((entry) => {
                const issued = issuedLabel(entry.issuedOn);
                return (
                  <li key={entry.name} className="border-b border-line pb-5 last:border-b-0 last:pb-0">
                    <h4 className="font-display text-base font-semibold text-ink">
                      {entry.url ? (
                        <a
                          href={entry.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-start gap-2 underline decoration-line-strong underline-offset-4 transition hover:text-teal"
                        >
                          <span>{entry.name}</span>
                          <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        </a>
                      ) : (
                        entry.name
                      )}
                    </h4>
                    {entry.issuer ? (
                      <p className="mt-1 text-sm text-muted">{entry.issuer}</p>
                    ) : null}
                    {issued ? (
                      <p className="mt-2 inline-flex items-center gap-2 text-xs text-faint">
                        <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Issued {issued}</span>
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        </Reveal>
      ) : null}
    </div>
  );
}
