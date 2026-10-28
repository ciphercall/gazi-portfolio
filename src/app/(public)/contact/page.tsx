import type { Metadata } from "next";
import { ArrowRight, Clock, Download, ListChecks, MapPin, Sparkles } from "lucide-react";

import { ActionLink } from "@/components/ui/ActionLink";
import { AvailabilityChip } from "@/components/site/AvailabilityChip";
import { ContactGrid } from "@/components/site/ContactGrid";
import { JsonLd } from "@/components/site/JsonLd";
import { Section } from "@/components/site/Section";
import { contactChannels } from "@/components/site/contact-channels";
import {
  CV_PATH,
  contactLinks,
  whatsappLink,
  type ContactHandles,
} from "@/components/site/contact-links";
import { IconBadge } from "@/components/ui/IconBadge";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { breadcrumbJsonLd, loadProfileSafe, pageMetadata, requireProfile } from "@/lib/seo";

/**
 * Contact page.
 *
 * Every channel is a large card that states what it is for, so nobody has to
 * guess whether WhatsApp or email is appropriate. The WhatsApp link carries a
 * pre-written message built by the same helper the API hands to the mobile app.
 */

const BRIEF_CHECKLIST = [
  "What you are building, in a sentence or two",
  "Which parts you need help with (API, dashboard, mobile, integration)",
  "Your stack, if it is already decided",
  "Timeline and rough budget range",
];

export async function generateMetadata(): Promise<Metadata> {
  const profile = await loadProfileSafe();
  const name = profile?.fullName || "Gazi Monir-Uz-Zaman";

  return pageMetadata({
    title: "Contact",
    description: `Contact ${name} on WhatsApp, Messenger, LinkedIn, email or phone. Available for full-time roles, contract work and Laravel/React/Flutter projects.`,
    path: "/contact",
    keywords: ["contact", "hire Laravel developer", "hire React developer", "WhatsApp"],
  });
}

export default async function ContactPage() {
  const profile = await requireProfile();

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

  // Same rules as everywhere else — only the opening line is tailored here.
  const links = {
    ...contactLinks(handles),
    whatsapp: whatsappLink(
      handles.whatsapp,
      "Hi Gazi! I'd like to talk about a project. Here's a quick brief:",
    ),
  };
  const channels = contactChannels(links, handles);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ])}
      />

      <Section className="pt-14 sm:pt-20" grid>
        <SectionHeading
          as="h1"
          eyebrow="Contact"
          title={
            <>
              Let&apos;s talk about what you need{" "}
              <span className="text-aurora">built next</span>
            </>
          }
          lead="Available for full-time roles, contract work and focused projects. Pick whichever channel suits you — every one of them reaches me directly."
        />

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <AvailabilityChip />
          {profile.location ? (
            <span className="pill text-muted">
              <MapPin className="h-4 w-4 text-faint" aria-hidden="true" />
              <span>{profile.location}</span>
            </span>
          ) : null}
        </div>

        <div className="mt-12">
          <ContactGrid channels={channels} />
        </div>
      </Section>

      <Section id="how-to-reach" tight>
        <div className="grid gap-6 lg:grid-cols-3">
          <section className="glass hairline p-5" aria-labelledby="brief-heading">
            <div className="flex items-center gap-3">
              <IconBadge>
                <ListChecks className="h-5 w-5" aria-hidden="true" />
              </IconBadge>
              <h2 id="brief-heading" className="font-display text-base font-semibold text-ink">
                What to include
              </h2>
            </div>
            <ul className="mt-4 grid gap-3">
              {BRIEF_CHECKLIST.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-relaxed text-muted">
                  <span
                    aria-hidden="true"
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-sm"
                    style={{
                      backgroundImage: "linear-gradient(120deg, var(--c-teal), var(--c-violet))",
                    }}
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="glass hairline p-5" aria-labelledby="reply-heading">
            <div className="flex items-center gap-3">
              <IconBadge toneClassName="text-violet">
                <Clock className="h-5 w-5" aria-hidden="true" />
              </IconBadge>
              <h2 id="reply-heading" className="font-display text-base font-semibold text-ink">
                How I reply
              </h2>
            </div>
            <ul className="mt-4 grid gap-3 text-sm leading-relaxed text-muted">
              <li>
                <span className="block font-medium text-ink">Within business hours</span>
                Most messages get an answer the same working day, Bangladesh time (GMT+6).
              </li>
              <li>
                <span className="block font-medium text-ink">A straight answer on fit</span>
                If the work is not something I can do well, I will say so and point you to someone
                who can.
              </li>
              <li>
                <span className="block font-medium text-ink">A clear next step</span>
                Either a call, a scoped estimate, or a small paid discovery task.
              </li>
            </ul>
          </section>

          <section className="glass hairline p-5" aria-labelledby="cv-heading">
            <div className="flex items-center gap-3">
              <IconBadge toneClassName="text-cyan">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </IconBadge>
              <h2 id="cv-heading" className="font-display text-base font-semibold text-ink">
                In a hurry?
              </h2>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              The CV has the same story in one document: roles, dates, stack and education. Useful
              if you are passing this on to someone else.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ActionLink href={CV_PATH} icon={<Download className="h-4 w-4" />}>
                Download CV
              </ActionLink>
              <ActionLink href="/projects" icon={<ArrowRight className="h-4 w-4" />}>
                See case studies
              </ActionLink>
            </div>
          </section>
        </div>
      </Section>
    </>
  );
}
