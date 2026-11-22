import type { ReactNode } from "react";

import { CvPaginator } from "./CvPaginator";
import { formatDateRange, formatMonthYear } from "@/lib/pdf/content";
import type { CvSource } from "@/lib/queries";
import { headlineShort } from "@/components/site/format";

/**
 * The designed (colourised) CV document.
 *
 * Presentational only: it takes a `CvSource` plus the resolved portrait and
 * returns a stream of blocks styled by `print.css`. Pagination is *not* decided
 * here — the content is rendered once, in reading order, and `CvPaginator`
 * measures the blocks in the browser and packs them into A4 sheets. That is the
 * only way to know how tall a paragraph really is before it prints, and it is
 * what removes the fixed "five entries on page one" guess that used to leave
 * half-empty sheets behind.
 *
 * The blocks are marked up with the contract the paginator reads:
 *   - `data-cv-block`        one atomic unit, never split
 *   - `data-cv-group`        which section the unit belongs to
 *   - `data-cv-group-title`  the printed title, used for "… (continued)"
 *   - `data-cv-heading`      this unit *is* a section heading
 */

const SELECTED_PROJECTS = 8;

const EMPLOYMENT_LABELS: Record<string, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
};

function lastPathSegment(url: string): string {
  const trimmed = url.replace(/\/+$/, "");
  const segments = trimmed.split("/");
  return segments[segments.length - 1] ?? trimmed;
}

function initialsOf(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  const first = words[0] ?? "";
  const last = words.length > 1 ? (words[words.length - 1] ?? "") : "";
  return `${first.charAt(0)}${last ? last.charAt(0) : (first.charAt(1) ?? "")}`.toUpperCase() || "·";
}

/**
 * Two cards per pagination block.
 *
 * A single grid holding eight projects is ~136mm tall, which cannot be split:
 * when it does not fit, the whole thing moves to the next sheet and leaves a
 * band of untouched paper behind. Emitting grid *rows* keeps the same two-column
 * look while letting a sheet break between rows.
 */
function chunkPairs<T>(items: T[]): T[][] {
  const rows: T[][] = [];
  for (let index = 0; index < items.length; index += 2) {
    rows.push(items.slice(index, index + 2));
  }
  return rows;
}

interface BlockProps {
  group?: string;
  title?: string;
  heading?: boolean;
  className?: string;
  children: ReactNode;
}

/** One pagination unit. Section headings additionally carry `data-cv-heading`. */
function Block({ group, title, heading, className = "cv-section", children }: BlockProps) {
  return (
    <section
      className={className}
      data-cv-block=""
      data-cv-group={group}
      data-cv-group-title={title}
      data-cv-heading={heading ? "" : undefined}
      data-cv-keep={heading ? "" : undefined}
    >
      {children}
    </section>
  );
}

function SectionHeading({ title }: { title: string }) {
  return <h2 className="cv-h2">{title}</h2>;
}

function HeaderBand({
  profile,
  avatarDataUri,
}: {
  profile: CvSource["profile"];
  avatarDataUri: string | null;
}) {
  const contacts = [
    { text: profile.location },
    { text: profile.email, href: `mailto:${profile.email}` },
    { text: profile.phone, href: `tel:${profile.phone.replace(/\s+/g, "")}` },
    {
      text: `linkedin.com/in/${lastPathSegment(profile.linkedinUrl)}`,
      href: profile.linkedinUrl,
    },
    { text: `github.com/${lastPathSegment(profile.githubUrl)}`, href: profile.githubUrl },
  ].filter((contact) => contact.text.length > 0);

  return (
    <header className="cv-band" data-cv-band="">
      <div className="cv-band-grid">
        <div className="cv-band-id">
          <h1 className="cv-name">{profile.fullName}</h1>
          <p className="cv-role">{profile.headline}</p>
          {profile.subheadline ? <p className="cv-subhead">{profile.subheadline}</p> : null}
          <ul className="cv-contacts">
            {contacts.map((contact) => (
              <li key={contact.text}>
                {contact.href ? <a href={contact.href}>{contact.text}</a> : contact.text}
              </li>
            ))}
          </ul>
        </div>

        {avatarDataUri ? (
          <figure className="cv-portrait">
            {/* A data URI, not a URL: the media volume is served by nginx, not by
                the app Chromium is printing from. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarDataUri} alt="" />
          </figure>
        ) : (
          <figure className="cv-portrait cv-portrait-empty" aria-hidden="true">
            <span className="cv-monogram">{initialsOf(profile.fullName)}</span>
          </figure>
        )}
      </div>
    </header>
  );
}

/** Pages after the first get a slim running head instead of the full band. */
function RunningHead({ profile }: { profile: CvSource["profile"] }) {
  return (
    <div className="cv-runhead" data-cv-runhead="">
      <span className="cv-runhead-name">{profile.fullName}</span>
      <span className="cv-runhead-role">{headlineShort(profile.headline)}</span>
    </div>
  );
}

function Footer({ profile }: { profile: CvSource["profile"] }) {
  return (
    <footer className="cv-footer" data-cv-footer="">
      <span className="cv-footer-mark" aria-hidden />
      <span>
        {profile.fullName} · {profile.email}
      </span>
      <span className="cv-footer-page" data-cv-page-label="">
        Page 1 / 1
      </span>
    </footer>
  );
}

function ExperienceEntry({ experience }: { experience: CvSource["experiences"][number] }) {
  return (
    <Block group="experience" className="cv-section">
      <article className="cv-entry">
        <div className="cv-entry-head">
          <h3 className="cv-entry-title">{experience.title}</h3>
          <span className="cv-entry-date">
            {formatDateRange(experience.startDate, experience.endDate, experience.isCurrent)}
          </span>
        </div>
        <p className="cv-entry-org">
          <span className="cv-entry-company">{experience.company}</span>
          {experience.location ? <span className="cv-entry-meta">{experience.location}</span> : null}
          <span className="cv-entry-meta">{EMPLOYMENT_LABELS[experience.employmentType]}</span>
        </p>
        {experience.summary ? <p className="cv-entry-summary">{experience.summary}</p> : null}
        {experience.bullets.length ? (
          <ul className="cv-bullets">
            {experience.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        ) : null}
        {experience.tags.length ? (
          <ul className="cv-tags">
            {experience.tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        ) : null}
      </article>
    </Block>
  );
}

export function CvDocument({
  source,
  avatarDataUri,
  showPhoto,
}: {
  source: CvSource;
  avatarDataUri: string | null;
  showPhoto: boolean;
}) {
  const { profile, experiences, educations, skills, certifications, projects } = source;
  const selectedProjects = projects.slice(0, SELECTED_PROJECTS);
  const hiddenProjects = projects.length - selectedProjects.length;
  const portrait = showPhoto ? avatarDataUri : null;

  return (
    <div className="cv-doc" data-cv-doc="">
      {/* Rendered once, off-screen, for measurement. The paginator moves these
          nodes into real sheets and then removes this container. */}
      <div className="cv-flow" data-cv-source="" aria-hidden="true">
        <HeaderBand profile={profile} avatarDataUri={portrait} />
        <RunningHead profile={profile} />

        <div className="cv-flow-body">
          <Block group="profile" title="Profile" heading>
            <SectionHeading title="Profile" />
          </Block>
          <Block group="profile">
            <p className="cv-summary">{profile.summary}</p>
          </Block>

          {experiences.length ? (
            <>
              <Block group="experience" title="Experience" heading>
                <SectionHeading title="Experience" />
              </Block>
              {experiences.map((experience) => (
                <ExperienceEntry key={experience.slug} experience={experience} />
              ))}
            </>
          ) : null}

          {educations.length ? (
            <>
              <Block group="education" title="Education" heading>
                <SectionHeading title="Education" />
              </Block>
              {educations.map((education) => (
                <Block
                  key={`${education.school}-${education.degree}`}
                  group="education"
                  className="cv-section"
                >
                  <article className="cv-edu-item">
                    <div className="cv-edu-head">
                      <h3 className="cv-edu-degree">
                        {education.degree}
                        {education.field ? (
                          <span className="cv-edu-field">{education.field}</span>
                        ) : null}
                      </h3>
                      <span className="cv-edu-years">
                        {education.startYear} – {education.endYear}
                      </span>
                    </div>
                    <p className="cv-edu-school">{education.school}</p>
                    {education.details ? (
                      <p className="cv-edu-details">{education.details}</p>
                    ) : null}
                  </article>
                </Block>
              ))}
            </>
          ) : null}

          {certifications.length ? (
            <>
              <Block group="certifications" title="Certifications" heading>
                <SectionHeading title="Certifications" />
              </Block>
              {certifications.map((certification) => (
                <Block key={certification.name} group="certifications" className="cv-section">
                  <article className="cv-cert">
                    <h3 className="cv-cert-name">{certification.name}</h3>
                    <p className="cv-cert-meta">
                      {certification.issuer}
                      {certification.issuedOn
                        ? ` · ${formatMonthYear(certification.issuedOn)}`
                        : ""}
                    </p>
                  </article>
                </Block>
              ))}
            </>
          ) : null}

          {skills.length ? (
            <>
              <Block group="skills" title="Skills" heading>
                <SectionHeading title="Skills & Technologies" />
              </Block>
              {chunkPairs(skills).map((pair) => (
                <Block
                  key={`skills-${pair.map((group) => group.category).join("-")}`}
                  group="skills"
                  className="cv-pair"
                >
                  {pair.map((group) => (
                    <article className="cv-skill-card" key={group.category}>
                      <h3 className="cv-skill-category">{group.category}</h3>
                      <ul className="cv-skill-items">
                        {group.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </Block>
              ))}
            </>
          ) : null}

          {selectedProjects.length ? (
            <>
              <Block group="projects" title="Projects" heading>
                <SectionHeading title="Selected Projects" />
              </Block>
              {chunkPairs(selectedProjects).map((pair) => (
                <Block
                  key={`projects-${pair.map((project) => project.slug).join("-")}`}
                  group="projects"
                  className="cv-pair"
                >
                  {pair.map((project) => (
                    <article className="cv-project" key={project.slug}>
                      <h3 className="cv-project-title">{project.title}</h3>
                      {project.summary ? (
                        <p className="cv-project-summary">{project.summary}</p>
                      ) : null}
                      {project.techStack.length ? (
                        <ul className="cv-project-tech">
                          {project.techStack.map((tech) => (
                            <li key={tech}>{tech}</li>
                          ))}
                        </ul>
                      ) : null}
                    </article>
                  ))}
                </Block>
              ))}
              {hiddenProjects > 0 ? (
                <Block group="projects" className="cv-section">
                  <p className="cv-more">
                    {hiddenProjects} further{" "}
                    {hiddenProjects === 1 ? "project is" : "projects are"} documented at{" "}
                    {profile.websiteUrl}.
                  </p>
                </Block>
              ) : null}
            </>
          ) : null}
        </div>

        <Footer profile={profile} />
      </div>

      <div className="cv-sheets" data-cv-sheets="" />

      <CvPaginator />
    </div>
  );
}
