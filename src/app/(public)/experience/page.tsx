import type { Metadata } from "next";
import { ArrowRight, Briefcase, Building2, Clock, TrendingUp } from "lucide-react";

import { ActionLink } from "@/components/ui/ActionLink";
import { EducationSection } from "@/components/site/EducationSection";
import { ExperienceTimeline, type TimelineGroup } from "@/components/site/ExperienceTimeline";
import { JsonLd } from "@/components/site/JsonLd";
import { Section } from "@/components/site/Section";
import { StatsStrip, type StatItem } from "@/components/site/StatsStrip";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { wholeYearsSince } from "@/components/site/format";
import { getCertifications, getEducations, getExperiences } from "@/lib/queries";
import { breadcrumbJsonLd, loadProfileSafe, pageMetadata, requireProfile } from "@/lib/seo";

/**
 * The full career timeline.
 *
 * Every published role, grouped by employment type, with the detail the CV packs
 * into three pages: summary, achievements and stack. Part-time and contract work
 * is kept as its own group rather than buried in the full-time list.
 */

export async function generateMetadata(): Promise<Metadata> {
  const profile = await loadProfileSafe();
  const name = profile?.fullName || "Gazi Monir-Uz-Zaman";
  const roles = profile?.headline || "full-stack developer";

  return pageMetadata({
    title: "Experience",
    description: `The full career timeline of ${name}, ${roles} — every role, what it involved and the stack used, from 2017 to today.`,
    path: "/experience",
    keywords: ["experience", "Laravel developer", "React developer", "career timeline"],
  });
}

const BUCKETS: { key: string; label: string; blurb: string }[] = [
  {
    key: "FULL_TIME",
    label: "Full-time roles",
    blurb:
      "Long-running positions inside one company's engineering team, owning systems from schema to deployment.",
  },
  {
    key: "PART_TIME",
    label: "Part-time roles",
    blurb:
      "Client delivery run alongside a full-time role: scope, estimates, stakeholder communication and code.",
  },
  {
    key: "CONTRACT",
    label: "Contract engagements",
    blurb: "Fixed-scope work delivered end to end for an external client.",
  },
  {
    key: "INTERNSHIP",
    label: "Early career",
    blurb: "Where the fundamentals were built.",
  },
];

export default async function ExperiencePage() {
  const profile = await requireProfile();

  const [experiences, educations, certifications] = await Promise.all([
    getExperiences(),
    getEducations(),
    getCertifications(),
  ]);

  const companies = new Set(experiences.map((item) => item.company));
  const current = experiences.filter((item) => item.isCurrent);
  const earliest = experiences.reduce<string | null>((value, item) => {
    if (!value) return item.startDate;
    return item.startDate < value ? item.startDate : value;
  }, null);

  const stats: StatItem[] = [
    {
      icon: <TrendingUp className="h-5 w-5" />,
      value: `${wholeYearsSince(earliest)}+`,
      label: "Years of experience",
      hint: earliest ? `Since ${earliest.slice(0, 4)}` : undefined,
    },
    {
      icon: <Briefcase className="h-5 w-5" />,
      value: String(experiences.length),
      label: "Roles held",
      hint: "Full-time, part-time and contract",
    },
    {
      icon: <Building2 className="h-5 w-5" />,
      value: String(companies.size),
      label: "Companies",
      hint: "Product teams and clients",
    },
    {
      icon: <Clock className="h-5 w-5" />,
      value: String(current.length),
      label: "Current roles",
      hint: "Held at the same time",
    },
  ];

  const groups: TimelineGroup[] = BUCKETS.map((bucket) => ({
    ...bucket,
    items: experiences.filter((item) => item.employmentType === bucket.key),
  }));

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Experience", path: "/experience" },
        ])}
      />

      <Section className="pt-12 sm:pt-16" grid>
        <SectionHeading
          as="h1"
          eyebrow="Experience"
          title={
            <>
              Every role so far,{" "}
              <span className="text-aurora">one system at a time</span>
            </>
          }
          lead={`From junior developer on real-time chat to senior developer and team lead on enterprise ERP. Everything ${profile.fullName} has shipped, newest first within each group.`}
        />

        <div className="mt-10">
          <StatsStrip items={stats} />
        </div>

        <ExperienceTimeline groups={groups} />

        <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-line pt-8">
          <ActionLink href="/contact" variant="primary" icon={<ArrowRight className="h-4 w-4" />}>
            Work with me
          </ActionLink>
          <ActionLink href="/projects" icon={<ArrowRight className="h-4 w-4" />}>
            See the projects
          </ActionLink>
        </div>
      </Section>

      <Section id="education">
        <SectionHeading
          eyebrow="Education & certifications"
          title="The formal part of the record"
          lead="An MBA, an English degree and a postgraduate enterprise-systems diploma — plus the Microsoft vendor exam."
        />
        <EducationSection educations={educations} certifications={certifications} />
      </Section>
    </>
  );
}
