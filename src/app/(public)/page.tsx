import type { Metadata } from "next";
import { Briefcase, Boxes, Layers, TrendingUp } from "lucide-react";

import { AboutSection } from "@/components/site/AboutSection";
import { ContactGrid } from "@/components/site/ContactGrid";
import { EducationSection } from "@/components/site/EducationSection";
import { ExperienceTimeline, type TimelineGroup } from "@/components/site/ExperienceTimeline";
import { Hero } from "@/components/site/Hero";
import { JsonLd } from "@/components/site/JsonLd";
import { ProjectsSection } from "@/components/site/ProjectsSection";
import { Section } from "@/components/site/Section";
import { SkillsSection } from "@/components/site/SkillsSection";
import { StatsStrip, type StatItem } from "@/components/site/StatsStrip";
import { contactChannels } from "@/components/site/contact-channels";
import { contactLinks, type ContactHandles } from "@/components/site/contact-links";
import { countSkills, wholeYearsSince } from "@/components/site/format";
import { ActionLink } from "@/components/ui/ActionLink";
import { SectionHeading } from "@/components/ui/SectionHeading";
import {
  getCertifications,
  getEducations,
  getExperiencesGrouped,
  getProjectSummaries,
  getSkillsGrouped,
} from "@/lib/queries";
import {
  DEFAULT_HEADLINE,
  SITE_NAME,
  loadProfileSafe,
  pageMetadata,
  profilePageJsonLd,
  requireProfile,
} from "@/lib/seo";

/**
 * Landing page.
 *
 * Eight bands, in the order a visitor needs them: who, how much, what, where he
 * has worked, with what, what he built, what he studied, how to reach him. All
 * of it is server-rendered from the database on every request — the only client
 * JavaScript on this route is the header, the reveal wrapper and the footer's
 * build stamp.
 */
export async function generateMetadata(): Promise<Metadata> {
  const profile = await loadProfileSafe();
  const title =
    profile?.seoTitle.trim() ||
    (profile ? `${profile.fullName} — ${profile.headline}` : SITE_NAME);
  const description =
    profile?.seoDescription.trim() || profile?.subheadline.trim() || DEFAULT_HEADLINE;

  return pageMetadata({ title, description, path: "/" });
}

export default async function HomePage() {
  const profile = await requireProfile();

  const [experienceGroups, skills, projects, educations, certifications] = await Promise.all([
    getExperiencesGrouped(),
    getSkillsGrouped(),
    getProjectSummaries(),
    getEducations(),
    getCertifications(),
  ]);

  const handles: ContactHandles = {
    email: profile.email,
    phone: profile.phone,
    whatsapp: profile.whatsapp,
    linkedinUrl: profile.linkedinUrl,
    githubUrl: profile.githubUrl,
    facebookUrl: profile.facebookUrl,
    messengerUsername: profile.messengerUsername,
    websiteUrl: profile.websiteUrl,
  };
  const links = contactLinks(handles);
  const channels = contactChannels(links, handles);

  const currentRoles = experienceGroups.all
    .filter((item) => item.isCurrent)
    .map((item) => ({ title: item.title, company: item.company, slug: item.slug }));

  const earliestStart = experienceGroups.all.reduce<string | null>((earliest, item) => {
    if (!earliest) return item.startDate;
    return item.startDate < earliest ? item.startDate : earliest;
  }, null);

  const years = wholeYearsSince(earliestStart);
  const featured = projects.filter((project) => project.featured);

  // "What I do most" is derived, not written: the tags that appear on the most
  // roles are the ones this developer actually spends his days with.
  const tagCounts = new Map<string, number>();
  for (const item of experienceGroups.all) {
    for (const tag of item.tags) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
  }
  const focus = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 6)
    .map(([tag]) => tag);

  const stats: StatItem[] = [
    {
      icon: <TrendingUp className="h-5 w-5" />,
      value: `${years}+`,
      label: "Years of experience",
      hint: earliestStart ? `Shipping since ${earliestStart.slice(0, 4)}` : undefined,
    },
    {
      icon: <Boxes className="h-5 w-5" />,
      value: String(projects.length),
      label: "Production systems shipped",
      hint: "Web, mobile and industrial",
    },
    {
      icon: <Layers className="h-5 w-5" />,
      value: String(countSkills(skills)),
      label: "Technologies in use",
      hint: `Across ${skills.length} stack categories`,
    },
    {
      icon: <Briefcase className="h-5 w-5" />,
      value: String(currentRoles.length),
      label: "Current roles",
      hint: "Held at the same time",
    },
  ];

  const timelineGroups: TimelineGroup[] = [
    {
      key: "full-time",
      label: "Full-time roles",
      blurb:
        "Roles where the work was a single company's product — engineering, ownership and production support.",
      items: experienceGroups.fullTime,
    },
    {
      key: "part-time",
      label: "Part-time & contract",
      blurb:
        "Client-facing engagements run alongside a full-time role: scope, delivery and hands-on development.",
      items: experienceGroups.partTime,
    },
  ];

  return (
    <main>
      <JsonLd data={profilePageJsonLd(profile, links)} />

      <Hero
        fullName={profile.fullName}
        headline={profile.headline}
        subheadline={profile.subheadline}
        location={profile.location}
        currentRoles={currentRoles}
      />

      <Section id="stats" tight>
        <StatsStrip items={stats} />
      </Section>

      <Section id="about">
        <AboutSection
          fullName={profile.fullName}
          headline={profile.headline}
          summary={profile.summary}
          location={profile.location}
          avatarPath={profile.avatarPath}
          focus={focus}
        />
      </Section>

      <Section id="experience" grid>
        <SectionHeading
          eyebrow="Experience"
          title={
            <>
              Every role, in order — <span className="text-aurora">no gaps glossed over</span>
            </>
          }
          lead={`${years}+ years across enterprise ERP, industrial automation and product teams — grouped the way the CV presents the work.`}
        />
        <ExperienceTimeline groups={timelineGroups} />
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <ActionLink href="/experience" icon={<Briefcase className="h-4 w-4" />}>
            The full timeline, with detail
          </ActionLink>
        </div>
      </Section>

      <Section id="skills">
        <SectionHeading
          eyebrow="Skills"
          title={
            <>
              A stack that spans <span className="text-aurora">web, mobile and the factory floor</span>
            </>
          }
          lead="Laravel and React are the daily tools; PLC and SCADA work is the part of the list most developers cannot offer."
        />
        <SkillsSection groups={skills} />
      </Section>

      <Section id="projects" grid>
        <SectionHeading
          eyebrow="Projects"
          title={
            <>
              Systems running in production <span className="text-aurora">right now</span>
            </>
          }
          lead="Each case study covers what the system does and the engineering decisions behind it."
        />
        <ProjectsSection projects={featured} />
      </Section>

      <Section id="education">
        <SectionHeading
          eyebrow="Education & certifications"
          title="Formal grounding for the practical work"
        />
        <EducationSection educations={educations} certifications={certifications} />
      </Section>

      <Section id="contact" grid>
        <SectionHeading
          eyebrow="Contact"
          title={
            <>
              Tell me what you are building — <span className="text-aurora">I reply fast</span>
            </>
          }
          lead="WhatsApp is quickest, email is best for anything with a document attached."
        />
        <div className="mt-12">
          <ContactGrid channels={channels} />
        </div>
      </Section>
    </main>
  );
}
