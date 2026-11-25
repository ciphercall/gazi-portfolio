import type { Metadata } from "next";
import { ArrowRight, Briefcase, Boxes, Layers, TrendingUp } from "lucide-react";

import { AboutSection } from "@/components/site/AboutSection";
import { ContactGrid } from "@/components/site/ContactGrid";
import { EducationSection } from "@/components/site/EducationSection";
import { EcosystemSection } from "@/components/site/ecosystem";
import { ExperienceGraph } from "@/components/site/ExperienceGraph";
import { Hero, type HeroStat } from "@/components/site/Hero";
import { JsonLd } from "@/components/site/JsonLd";
import { MiniRoleCards } from "@/components/site/MiniRoleCards";
import { ProjectsSection } from "@/components/site/ProjectsSection";
import { Section } from "@/components/site/Section";
import { SkillsSection } from "@/components/site/SkillsSection";
import { contactChannels } from "@/components/site/contact-channels";
import { contactLinks, type ContactHandles } from "@/components/site/contact-links";
import { countSkills, formatTenure, halfYearsSince } from "@/components/site/format";
import { ActionLink } from "@/components/ui/ActionLink";
import { SectionHeading } from "@/components/ui/SectionHeading";
import {
  getAppLinks,
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
import { headlineShort } from "@/components/site/format";

/**
 * Landing page.
 *
 * Nine bands, in the order a visitor needs them: who, how much, what, where he
 * has worked, with what, what he built, what else he ships, what he studied,
 * how to reach him. All of it is server-rendered from the database on every
 * request — the only client JavaScript on this route is the header, the reveal
 * wrapper and the footer's build stamp.
 */
export async function generateMetadata(): Promise<Metadata> {
  const profile = await loadProfileSafe();
  // `seoTitle` already names the person, and the root layout's title template
  // appends the name again — which rendered "Gazi … — Senior …, Gazi …". The
  // profile title is therefore emitted as an absolute title.
  const title = profile?.seoTitle.trim() || `${SITE_NAME} — Senior Full-Stack Software Engineer`;
  const description =
    profile?.seoDescription.trim() || profile?.subheadline.trim() || DEFAULT_HEADLINE;

  return pageMetadata({ title, description, path: "/", absoluteTitle: true });
}

export default async function HomePage() {
  const profile = await requireProfile();

  const [experienceGroups, skills, projects, educations, certifications, appLinks] =
    await Promise.all([
      getExperiencesGrouped(),
      getSkillsGrouped(),
      getProjectSummaries(),
      getEducations(),
      getCertifications(),
      getAppLinks(),
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

  const years = halfYearsSince(earliestStart);
  const featured = projects.filter((project) => project.featured);

  // "What I do most" is derived, not written: the tags that appear on the most
  // roles are the ones this developer actually spends his days with.
  const tagCounts = new Map<string, number>();
  for (const item of experienceGroups.all) {
    for (const tag of item.tags) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
  }
  const focus = [...tagCounts.entries()]
    .filter(([tag]) => !/^(full|part)[- ]time$/i.test(tag))
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 6)
    .map(([tag]) => tag);

  const stats: HeroStat[] = [
    {
      icon: <TrendingUp className="h-3.5 w-3.5" />,
      value: years,
      suffix: "+",
      decimals: Number.isInteger(years) ? 0 : 1,
      label: "Years",
      hint: earliestStart ? `Since ${earliestStart.slice(0, 4)}` : undefined,
    },
    {
      icon: <Boxes className="h-3.5 w-3.5" />,
      value: projects.length,
      label: "Systems",
      hint: "Web, mobile, industrial",
    },
    {
      icon: <Layers className="h-3.5 w-3.5" />,
      value: countSkills(skills),
      label: "Technologies",
      hint: `Across ${skills.length} categories`,
    },
    {
      icon: <Briefcase className="h-3.5 w-3.5" />,
      value: currentRoles.length,
      label: "Current roles",
      hint: "Held at the same time",
    },
  ];

  return (
    <main>
      <JsonLd data={profilePageJsonLd(profile, links)} />

      <Hero
        fullName={profile.fullName}
        headline={headlineShort(profile.headline)}
        subheadline={profile.subheadline}
        location={profile.location}
        currentRoles={currentRoles}
        avatarPath={profile.avatarPath}
        stats={stats}
        focus={focus}
      />

      <Section id="about">
        <AboutSection
          headline={profile.headline}
          summary={profile.summary}
          location={profile.location}
          focus={focus}
        />
      </Section>

      <Section
        id="experience"
        grid
        rail={
          <>
            <SectionHeading
              eyebrow="Experience"
              title={
                <>
                  Every role, in order — <span className="text-aurora">no gaps glossed over</span>
                </>
              }
              lead={`${formatTenure(years)}+ years across enterprise ERP, industrial automation and product teams — laid out to scale, with concurrent roles side by side.`}
            />
            <div className="mt-4">
              <ActionLink href="/experience" icon={<Briefcase className="h-4 w-4" />}>
                The full timeline
              </ActionLink>
            </div>
          </>
        }
      >
        <ExperienceGraph entries={experienceGroups.all} variant="compact" />
        <div className="mt-3">
          <MiniRoleCards entries={experienceGroups.all.slice(0, 3)} />
        </div>
      </Section>

      <Section
        id="skills"
        rail={
          <SectionHeading
            eyebrow="Skills"
            title={
              <>
                A stack that spans <span className="text-aurora">web, mobile and the factory floor</span>
              </>
            }
            lead="Laravel and React are the daily tools; PLC and SCADA work is the part of the list most developers cannot offer."
          />
        }
      >
        <SkillsSection groups={skills} />
      </Section>

      <Section
        id="projects"
        grid
        rail={
          <>
            <SectionHeading
              eyebrow="Projects"
              title={
                <>
                  Systems running in production <span className="text-aurora">right now</span>
                </>
              }
              lead="Each case study covers what the system does and the engineering decisions behind it."
            />
            <div className="mt-4">
              <ActionLink href="/projects" icon={<ArrowRight className="h-4 w-4" />}>
                All projects
              </ActionLink>
            </div>
          </>
        }
      >
        <ProjectsSection projects={featured} showAllLink={false} />
      </Section>

      <EcosystemSection links={appLinks} />

      <Section
        id="education"
        rail={
          <SectionHeading
            eyebrow="Education & certifications"
            title="Formal grounding for the practical work"
          />
        }
      >
        <EducationSection educations={educations} certifications={certifications} />
      </Section>

      <Section
        id="contact"
        grid
        rail={
          <SectionHeading
            eyebrow="Contact"
            title={
              <>
                Tell me what you are building — <span className="text-aurora">I reply fast</span>
              </>
            }
            lead="WhatsApp is quickest, email is best for anything with a document attached."
          />
        }
      >
        <ContactGrid channels={channels} />
      </Section>
    </main>
  );
}
