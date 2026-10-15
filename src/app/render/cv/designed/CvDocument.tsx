import type { ReactNode } from "react";

import { formatDateRange, formatMonthYear } from "@/lib/pdf/content";
import type { CvSource } from "@/lib/queries";

/**
 * The designed (colourised) CV document.
 *
 * Presentational only: it takes a `CvSource` and returns A4 sheets styled by
 * `print.css`. Keeping the markup free of database and Next.js imports is what
 * lets the layout be rendered and measured in a browser without running the app.
 *
 * Pagination is explicit rather than automatic. A CV is a designed object — the
 * reader should never meet a page that starts with the tail of a bullet list —
 * so entries are distributed here, in code, and each `article.cv-page` is
 * exactly one sheet. `print.css` then forces a page break between sheets and
 * pins a footer to the bottom of each one.
 */

/** How many entries the first sheet holds before the timeline continues overleaf. */
const MAX_ENTRIES_ON_FIRST_PAGE = 5;

/** The designed variant shows selected work; the ATS variant lists every project. */
const SELECTED_PROJECTS = 8;

const EMPLOYMENT_LABELS: Record<string, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
};

interface PageSpec {
  key: string;
  blocks: ReactNode[];
}

function lastPathSegment(url: string): string {
  const trimmed = url.replace(/\/+$/, "");
  const segments = trimmed.split("/");
  return segments[segments.length - 1] ?? trimmed;
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section className="cv-section" data-section={id}>
      <h2 className="cv-h2">{title}</h2>
      {children}
    </section>
  );
}

function HeaderBand({ profile }: { profile: CvSource["profile"] }) {
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
    <header className="cv-band">
      <div className="cv-band-inner">
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
    </header>
  );
}

/** Pages after the first get a slim running head instead of the full band. */
function RunningHead({ profile }: { profile: CvSource["profile"] }) {
  return (
    <div className="cv-runhead">
      <span className="cv-runhead-name">{profile.fullName}</span>
      <span className="cv-runhead-role">{profile.headline}</span>
    </div>
  );
}

function ExperienceBlock({ experiences }: { experiences: CvSource["experiences"] }) {
  return (
    <div className="cv-timeline">
      {experiences.map((experience) => (
        <article className="cv-entry" key={experience.slug}>
          <div className="cv-entry-head">
            <h3 className="cv-entry-title">{experience.title}</h3>
            <span className="cv-entry-date">
              {formatDateRange(experience.startDate, experience.endDate, experience.isCurrent)}
            </span>
          </div>
          <p className="cv-entry-org">
            <span className="cv-entry-company">{experience.company}</span>
            {experience.location ? (
              <span className="cv-entry-meta">{experience.location}</span>
            ) : null}
            <span className="cv-entry-meta">{EMPLOYMENT_LABELS[experience.employmentType]}</span>
          </p>
          {experience.summary ? <p className="cv-entry-summary">{experience.summary}</p> : null}
          <ul className="cv-bullets">
            {experience.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
          {experience.tags.length ? (
            <ul className="cv-tags">
              {experience.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function Page({
  profile,
  index,
  total,
  band,
  children,
}: {
  profile: CvSource["profile"];
  index: number;
  total: number;
  band?: boolean;
  children: ReactNode;
}) {
  return (
    <article className="cv-page">
      {band ? <HeaderBand profile={profile} /> : <RunningHead profile={profile} />}
      <div className="cv-body">{children}</div>
      <footer className="cv-footer">
        <span className="cv-footer-mark" aria-hidden />
        <span>
          {profile.fullName} · {profile.email}
        </span>
        <span className="cv-footer-page">
          Page {index} / {total}
        </span>
      </footer>
    </article>
  );
}

function buildPages(source: CvSource): PageSpec[] {
  const { profile, experiences, educations, skills, certifications, projects } = source;
  const pages: PageSpec[] = [];

  /* ---------------------------------------------------------------- sheet one --- */

  const onFirstPage = Math.min(
    Math.max(1, Math.ceil(experiences.length / 2)),
    MAX_ENTRIES_ON_FIRST_PAGE,
  );
  const firstPageExperiences = experiences.slice(0, onFirstPage);
  const laterExperiences = experiences.slice(onFirstPage);

  const pageOne: ReactNode[] = [
    <Section id="profile" title="Profile" key="profile">
      <p className="cv-summary">{profile.summary}</p>
    </Section>,
  ];
  if (firstPageExperiences.length) {
    pageOne.push(
      <Section id="experience" title="Experience" key="experience">
        <ExperienceBlock experiences={firstPageExperiences} />
      </Section>,
    );
  }
  pages.push({ key: "sheet-1", blocks: pageOne });

  /* ---------------------------------------------------------------- sheet two --- */

  const pageTwo: ReactNode[] = [];
  if (laterExperiences.length) {
    pageTwo.push(
      <Section id="experience-2" title="Experience (continued)" key="experience-2">
        <ExperienceBlock experiences={laterExperiences} />
      </Section>,
    );
  }
  if (educations.length) {
    pageTwo.push(
      <Section id="education" title="Education" key="education">
        <div className="cv-education">
          {educations.map((education) => (
            <article className="cv-edu-item" key={`${education.school}-${education.degree}`}>
              <div className="cv-edu-head">
                <h3 className="cv-edu-degree">
                  {education.degree}
                  {education.field ? <span className="cv-edu-field">{education.field}</span> : null}
                </h3>
                <span className="cv-edu-years">
                  {education.startYear} – {education.endYear}
                </span>
              </div>
              <p className="cv-edu-school">{education.school}</p>
              {education.details ? <p className="cv-edu-details">{education.details}</p> : null}
            </article>
          ))}
        </div>
      </Section>,
    );
  }
  if (certifications.length) {
    pageTwo.push(
      <Section id="certifications" title="Certifications" key="certifications">
        <div className="cv-certs">
          {certifications.map((certification) => (
            <article className="cv-cert" key={certification.name}>
              <h3 className="cv-cert-name">{certification.name}</h3>
              <p className="cv-cert-meta">
                {certification.issuer}
                {certification.issuedOn ? ` · ${formatMonthYear(certification.issuedOn)}` : ""}
              </p>
            </article>
          ))}
        </div>
      </Section>,
    );
  }
  if (pageTwo.length) pages.push({ key: "sheet-2", blocks: pageTwo });

  /* -------------------------------------------------------------- sheet three --- */

  const selectedProjects = projects.slice(0, SELECTED_PROJECTS);
  const hiddenProjects = projects.length - selectedProjects.length;

  const pageThree: ReactNode[] = [];
  if (skills.length) {
    pageThree.push(
      <Section id="skills" title="Skills & Technologies" key="skills">
        <div className="cv-skills">
          {skills.map((group) => (
            <article className="cv-skill-card" key={group.category}>
              <h3 className="cv-skill-category">{group.category}</h3>
              <ul className="cv-skill-items">
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </Section>,
    );
  }
  if (selectedProjects.length) {
    pageThree.push(
      <Section id="projects" title="Selected Projects" key="projects">
        <div className="cv-projects">
          {selectedProjects.map((project) => (
            <article className="cv-project" key={project.slug}>
              <h3 className="cv-project-title">{project.title}</h3>
              {project.summary ? <p className="cv-project-summary">{project.summary}</p> : null}
              {project.techStack.length ? (
                <ul className="cv-project-tech">
                  {project.techStack.map((tech) => (
                    <li key={tech}>{tech}</li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
        {hiddenProjects > 0 ? (
          <p className="cv-more">
            {hiddenProjects} further {hiddenProjects === 1 ? "project is" : "projects are"}{" "}
            documented at {profile.websiteUrl}.
          </p>
        ) : null}
      </Section>,
    );
  }
  if (pageThree.length) pages.push({ key: "sheet-3", blocks: pageThree });

  return pages;
}

export function CvDocument({ source }: { source: CvSource }) {
  const pages = buildPages(source);

  return (
    <div className="cv-doc">
      {pages.map((page, index) => (
        <Page
          key={page.key}
          profile={source.profile}
          index={index + 1}
          total={pages.length}
          band={index === 0}
        >
          {page.blocks}
        </Page>
      ))}
    </div>
  );
}
