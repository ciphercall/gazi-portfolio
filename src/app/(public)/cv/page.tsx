import type { Metadata } from "next";
import { CircleCheck, Download, ScanText, Sparkles } from "lucide-react";

import { CV_SLUGS } from "@/lib/pdf/assets";
import { getCvSource, getGeneratedAsset } from "@/lib/queries";
import type { CvSource } from "@/lib/queries";

/**
 * The visitor-facing download page.
 *
 * It has a job beyond holding two buttons: most people who land here do not know
 * why a CV would exist in two formats, so the page explains it — and it shows the
 * profile summary inline, because someone who came for the CV should be able to
 * read the short version without downloading anything.
 *
 * The files themselves are produced by `/api/cv/[kind]`; this page only reads the
 * recorded sizes, and degrades to "no hint" when the database or the assets are
 * not there yet.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Download the CV",
  description:
    "Two versions of Gazi Monir-Uz-Zaman's CV: a designed colour PDF for people, " +
    "and a plain ATS-friendly PDF that applicant tracking systems can read.",
};

const DESIGNED_URL = `/api/cv/${CV_SLUGS.CV_DESIGNED}`;
const ATS_URL = `/api/cv/${CV_SLUGS.CV_ATS}`;

function formatBytes(bytes: number): string | null {
  if (!bytes || bytes <= 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

const FEATURES = {
  designed: [
    "Colour A4 pages built in millimetres, print-ready",
    "Header band, timeline and skill matrix — made to be looked at",
    "Every regeneration prints the current site content",
  ],
  ats: [
    "One column, no tables, no graphics, no images",
    "Real selectable text with conventional section headings",
    "Dates as Month YYYY — exactly what a parser looks for",
  ],
};

const EXPLAINER = [
  {
    title: "Parsers read in one direction",
    body:
      "An applicant tracking system walks the text layer of a PDF and reads it as a " +
      "single stream. Two columns interleave, and a table scrambles into a word salad. " +
      "The ATS file is one column, top to bottom, so the reading order is the design.",
  },
  {
    title: "Text has to stay text",
    body:
      "Graphics, icons and outlined type leave a parser with nothing to read — the " +
      "letters are pictures. The ATS file contains no image objects at all, and its " +
      "text layer extracts cleanly, which is asserted by a test that runs on every build.",
  },
  {
    title: "Conventional headings win",
    body:
      "Section detection keys on familiar wording. The ATS file uses the standard set — " +
      "Professional Summary, Experience, Education, Skills, Certifications, Projects — " +
      "in that order, rather than something more original.",
  },
  {
    title: "The pretty one is for people",
    body:
      "Recruiters look at a CV for a few seconds first. The designed edition spends its " +
      "budget on hierarchy and legibility: your eye lands on the name, the role, then the " +
      "most recent work. Same facts, different reader.",
  },
];

function DownloadButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      download
      className="inline-flex items-center gap-2 rounded-control border border-line-strong bg-panel px-5 py-3 text-sm font-medium text-ink transition-colors hover:border-teal hover:bg-panel-strong"
    >
      <Download className="size-4 text-teal" aria-hidden />
      {label}
    </a>
  );
}

function VariantCard({
  icon,
  eyebrow,
  title,
  body,
  features,
  href,
  sizeHint,
  accent,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  body: string;
  features: string[];
  href: string;
  sizeHint: string | null;
  accent: string;
}) {
  return (
    <article className="glass hairline flex flex-col p-7">
      <div className="flex items-center gap-3">
        <span
          className={`grid size-11 place-items-center rounded-control border border-line ${accent}`}
          aria-hidden
        >
          {icon}
        </span>
        <p className="label-mono">{eyebrow}</p>
      </div>

      <h2 className="mt-5 text-2xl font-semibold text-ink">{title}</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted">{body}</p>

      <ul className="mt-6 space-y-2.5">
        {features.map((feature) => (
          <li key={feature} className="flex gap-2.5 text-sm text-muted">
            <CircleCheck className="mt-0.5 size-4 shrink-0 text-teal" aria-hidden />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto flex flex-wrap items-center gap-4 pt-7">
        <DownloadButton href={href} label="Download PDF" />
        <span className="label-mono">PDF{sizeHint ? ` · ${sizeHint}` : ""}</span>
      </div>
    </article>
  );
}

export default async function CvDownloadPage() {
  let source: CvSource | null = null;
  let sizeHints: Record<"designed" | "ats", string | null> = { designed: null, ats: null };

  try {
    const [cvSource, designed, ats] = await Promise.all([
      getCvSource(),
      getGeneratedAsset("CV_DESIGNED"),
      getGeneratedAsset("CV_ATS"),
    ]);
    source = cvSource;
    sizeHints = {
      designed: designed ? formatBytes(designed.bytes) : null,
      ats: ats ? formatBytes(ats.bytes) : null,
    };
  } catch {
    // The page still explains and links both files; the download route reports
    // its own failure, which is a better error than an empty page here.
  }

  const profile = source?.profile;

  return (
    <main className="relative mx-auto max-w-5xl px-5 pb-24 pt-28 sm:px-8">
      <div className="aurora-mesh" aria-hidden />

      <div className="relative">
        <p className="label-mono">Curriculum vitae</p>
        <h1 className="mt-4 text-display font-semibold text-ink">
          Two CVs. <span className="text-aurora">One set of facts.</span>
        </h1>
        <p className="mt-6 max-w-2xl leading-relaxed text-muted">
          The same career, written for two different readers. Take the designed edition to
          send to a person; take the ATS edition when you are uploading to a job portal that
          feeds an applicant tracking system. Both are generated from this site, so neither
          can quietly go out of date.
        </p>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <VariantCard
            icon={<Sparkles className="size-5 text-teal" />}
            eyebrow="For people"
            title="Designed edition"
            body="A colour A4 document with a header band, a work timeline and a skill matrix — the version that looks like someone cared."
            features={FEATURES.designed}
            href={DESIGNED_URL}
            sizeHint={sizeHints.designed}
            accent="bg-linear-to-br from-teal/15 to-violet/15"
          />
          <VariantCard
            icon={<ScanText className="size-5 text-cyan" />}
            eyebrow="For machines"
            title="ATS-friendly edition"
            body="Deliberately plain: no graphics, no columns, no images. Its beauty is that an applicant tracking system can read every line of it."
            features={FEATURES.ats}
            href={ATS_URL}
            sizeHint={sizeHints.ats}
            accent="bg-linear-to-br from-cyan/15 to-teal/10"
          />
        </div>

        {profile ? (
          <section className="mt-20">
            <h2 className="text-title font-semibold text-ink">The short version</h2>
            <div className="glass hairline mt-8 p-7">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <h3 className="text-2xl font-semibold text-ink">{profile.fullName}</h3>
                <p className="text-sm text-teal">{profile.headline}</p>
              </div>
              <p className="mt-5 max-w-3xl leading-relaxed text-muted">{profile.summary}</p>
              <div className="mt-6 flex flex-wrap gap-2.5">
                <span className="pill">{profile.location}</span>
                <a className="pill" href={`mailto:${profile.email}`}>
                  {profile.email}
                </a>
                <a className="pill" href={profile.linkedinUrl}>
                  LinkedIn
                </a>
                <a className="pill" href={profile.githubUrl}>
                  GitHub
                </a>
              </div>
              {source ? (
                <p className="label-mono mt-6">
                  {source.experiences.length} roles · {source.projects.length} projects ·{" "}
                  {source.skills.reduce((total, group) => total + group.items.length, 0)} skills
                </p>
              ) : null}
            </div>
          </section>
        ) : null}

        <section className="mt-20">
          <h2 className="text-title font-semibold text-ink">Why two versions exist</h2>
          <p className="mt-4 max-w-2xl leading-relaxed text-muted">
            Most CVs that never reach a human are not rejected — they are misread. A design
            that is lovely in a browser can extract as interleaved nonsense, so this site
            ships both and lets you choose.
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {EXPLAINER.map((item) => (
              <article key={item.title} className="glass p-6">
                <h3 className="text-lg font-semibold text-ink">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-20 flex flex-wrap items-center gap-4 border-t border-line pt-8">
          <p className="text-sm text-muted">
            Both files are regenerated automatically whenever the content on this site changes
            — there is no stale copy to download.
          </p>
        </section>
      </div>
    </main>
  );
}
