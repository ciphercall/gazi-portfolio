import { Download, MapPin, Sparkles } from "lucide-react";

import { ActionLink } from "@/components/ui/ActionLink";
import { Chip } from "@/components/ui/Chip";
import { ImageFrame } from "@/components/ui/ImageFrame";
import { CV_PATH } from "@/components/site/contact-links";

/**
 * About band: portrait plate on the left, the profile summary set in large
 * comfortable type on the right. The portrait falls back to a seeded aurora
 * plate with the subject's monogram when no photo has been uploaded, so the
 * layout never depends on a file existing.
 */

export interface AboutSectionProps {
  fullName: string;
  headline: string;
  summary: string;
  location: string;
  avatarPath: string | null;
  /** Short chips under the summary — technologies or focus areas. */
  focus?: string[];
}

export function AboutSection({
  fullName,
  headline,
  summary,
  location,
  avatarPath,
  focus = [],
}: AboutSectionProps) {
  const firstStop = summary.indexOf(". ");
  const lead = firstStop > 0 ? summary.slice(0, firstStop + 1) : summary;
  const rest = firstStop > 0 ? summary.slice(firstStop + 2) : "";

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:gap-4">
      <div className="flex flex-col gap-3 lg:col-span-3">
        <ImageFrame
          src={avatarPath}
          alt={`Portrait of ${fullName}, ${headline}`}
          seed={fullName}
          label={fullName}
          kind="Portrait"
          className="aspect-[4/5] w-full"
          sizes="(min-width: 1024px) 340px, 45vw"
        />

        <div className="glass flex items-center gap-2.5 p-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-control bg-panel text-teal">
            <MapPin className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="label-mono block">Based in</span>
            <span className="block truncate text-[12.5px] font-medium text-ink">
              {location || "Remote-friendly"}
            </span>
          </span>
        </div>
      </div>

      <div className="glass hairline rounded-card p-4 sm:p-5 lg:col-span-6">
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

      <div className="glass hairline flex flex-col rounded-card p-4 lg:col-span-3">
        <p className="label-mono">At a glance</p>

        <dl className="mt-3 grid gap-2 text-[12.5px]">
          <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
            <dt className="text-faint">Role</dt>
            <dd className="text-right font-medium text-ink">
              {headline.split("·")[0]?.trim() || "Software engineer"}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
            <dt className="text-faint">Location</dt>
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
