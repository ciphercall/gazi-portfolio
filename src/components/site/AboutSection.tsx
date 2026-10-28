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
    <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-start lg:gap-12">
      <div className="flex flex-col gap-4">
        <div className="relative">
          <ImageFrame
            src={avatarPath}
            alt={`Portrait of ${fullName}, ${headline}`}
            seed={fullName}
            label={fullName}
            kind="Portrait"
            className="aspect-[4/5] w-full"
            sizes="(min-width: 1024px) 360px, 80vw"
          />
        </div>

        <div className="glass-strong hairline flex max-w-full items-center gap-3 p-2.5 sm:w-64">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-control bg-panel text-teal">
            <MapPin className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="label-mono block">Based in</span>
            <span className="block truncate text-sm font-medium text-ink">
              {location || "Remote-friendly"}
            </span>
          </span>
        </div>
      </div>

      <div className="pt-4 lg:pt-0">
        <p className="label-mono">About</p>
        <h2 className="mt-3 text-title font-semibold">
          Turning requirements into{" "}
          <span className="text-aurora">systems people rely on</span>.
        </h2>

        <div className="mt-5 space-y-4">
          <p className="font-display text-lg font-medium leading-snug text-ink sm:text-xl">
            {lead}
          </p>
          {rest ? (
            <p className="max-w-3xl text-base leading-relaxed text-muted">{rest}</p>
          ) : null}
        </div>

        {focus.length > 0 ? (
          <div className="mt-6">
            <p className="label-mono">What I do most</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {focus.map((item) => (
                <li key={item}>
                  <Chip icon={<Sparkles className="h-3.5 w-3.5" />} tone="accent">
                    {item}
                  </Chip>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <ActionLink href="/experience" icon={<Sparkles className="h-4 w-4" />}>
            Read the full experience
          </ActionLink>
          <ActionLink href={CV_PATH} icon={<Download className="h-4 w-4" />}>
            Download CV
          </ActionLink>
        </div>
      </div>
    </div>
  );
}
