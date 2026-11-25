import { Download, MapPin, Sparkles } from "lucide-react";

import { ActionLink } from "@/components/ui/ActionLink";
import { Chip } from "@/components/ui/Chip";
import { CV_PATH } from "@/components/site/contact-links";

/**
 * About band: the summary and the at-a-glance panel, side by side. The portrait
 * belongs to the hero; repeating it here made the home page show the same photo
 * twice, so this band carries context instead.
 */

export interface AboutSectionProps {
  headline: string;
  summary: string;
  location: string;
  /** Short chips under the summary — technologies or focus areas. */
  focus?: string[];
}

export function AboutSection({
  headline,
  summary,
  location,
  focus = [],
}: AboutSectionProps) {
  const firstStop = summary.indexOf(". ");
  const lead = firstStop > 0 ? summary.slice(0, firstStop + 1) : summary;
  const rest = firstStop > 0 ? summary.slice(firstStop + 2) : "";

  return (
    <div className="grid gap-3 lg:grid-cols-12 lg:gap-4">
      <div className="glass hairline rounded-card p-4 sm:p-5 lg:col-span-8">
        <p className="label-mono">About</p>
        <h2 className="mt-2 text-title font-semibold">
          Turning requirements into{" "}
          <span className="text-aurora">systems people rely on</span>.
        </h2>

        <div className="mt-3 space-y-3">
          <p className="font-display text-[15px] font-medium leading-snug text-ink sm:text-[17px]">
            {lead}
          </p>
          {rest ? (
            <p className="text-[13.5px] leading-relaxed text-muted">{rest}</p>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <ActionLink href="/experience" icon={<Sparkles className="h-4 w-4" />}>
            Read the full experience
          </ActionLink>
          <ActionLink href={CV_PATH} icon={<Download className="h-4 w-4" />}>
            Download CV
          </ActionLink>
        </div>
      </div>

      <div className="glass hairline flex flex-col rounded-card p-4 lg:col-span-4">
        <p className="label-mono">At a glance</p>

        <dl className="mt-3 grid gap-2 text-[12.5px]">
          <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
            <dt className="text-faint">Role</dt>
            <dd className="text-right font-medium text-ink">
              {headline.split("·")[0]?.trim() || "Software engineer"}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
            <dt className="flex items-center gap-1.5 text-faint">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              Location
            </dt>
            <dd className="text-right font-medium text-ink">{location || "Remote"}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-faint">Focus</dt>
            <dd className="text-right font-medium text-ink">{focus.length} areas</dd>
          </div>
        </dl>

        {focus.length > 0 ? (
          <div className="mt-3">
            <p className="label-mono">What I do most</p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {focus.slice(0, 6).map((item) => (
                <li key={item}>
                  <Chip tone="outline">{item}</Chip>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
