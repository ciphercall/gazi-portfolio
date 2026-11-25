import Link from "next/link";
import { ArrowDown, ArrowRight, Download, Mail, MapPin } from "lucide-react";
import type { ReactNode } from "react";

import { ActionLink } from "@/components/ui/ActionLink";
import { BentoCard, BentoGrid } from "@/components/ui/Bento";
import { Chip } from "@/components/ui/Chip";
import { CountUp } from "@/components/ui/CountUp";
import { ImageFrame } from "@/components/ui/ImageFrame";
import { Magnetic } from "@/components/ui/Magnetic";
import { Parallax } from "@/components/ui/Parallax";
import { Spotlight } from "@/components/ui/Spotlight";
import { AvailabilityChip } from "@/components/site/AvailabilityChip";
import { CV_PATH } from "@/components/site/contact-links";

/**
 * The hero as a bento board.
 *
 * One identity tile, a portrait tile, a "currently" tile and a full-width stat
 * ribbon — the right-hand half of the old hero is now occupied by real content
 * instead of aurora. The name is the single oversized type moment; every other
 * line is on the compact scale.
 */

export interface HeroCurrentRole {
  title: string;
  company: string;
  slug: string;
}

export interface HeroStat {
  icon: ReactNode;
  value: number;
  suffix?: string;
  decimals?: number;
  label: string;
  hint?: string;
}

export interface HeroProps {
  fullName: string;
  headline: string;
  subheadline: string;
  location: string;
  currentRoles: HeroCurrentRole[];
  avatarPath?: string | null;
  stats?: HeroStat[];
  /** Technologies or focus areas for the marquee strip. */
  focus?: string[];
}

export function Hero({
  fullName,
  headline,
  subheadline,
  location,
  currentRoles,
  avatarPath = null,
  stats = [],
  focus = [],
}: HeroProps) {
  const parts = fullName.split(/\s+/).filter(Boolean);
  const firstWord = parts[0] ?? fullName;
  const remaining = parts.slice(1).join(" ");
  const hasRoles = currentRoles.length > 0;
  const marquee = focus.length > 0 ? [...focus, ...focus] : [];

  return (
    <section className="relative isolate overflow-hidden px-4 pb-10 pt-6 sm:px-6 sm:pb-12 sm:pt-8 lg:px-8">
      <div className="aurora-mesh" aria-hidden="true" />
      <div className="grid-overlay" aria-hidden="true" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-20"
        style={{ backgroundImage: "linear-gradient(to bottom, transparent, var(--c-canvas))" }}
      />

      <div className="relative z-10 mx-auto w-full max-w-[var(--shell-max)]">
        <BentoGrid>
          <BentoCard span={6} tone="strong" className="p-0">
            <Spotlight className="h-full p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <AvailabilityChip />
                <a
                  href="#about"
                  className="inline-flex items-center gap-1.5 text-[11px] font-medium text-faint transition hover:text-ink"
                >
                  <ArrowDown className="h-3.5 w-3.5 animate-bounce" aria-hidden="true" />
                  <span>Scroll for details</span>
                </a>
              </div>

              <h1 className="name-mask mt-4 text-display font-semibold text-ink">
                <span className="text-aurora">{firstWord}</span>
                {remaining ? <span> {remaining}</span> : null}
              </h1>

              <p className="mt-3 font-display text-[15px] font-medium leading-snug text-ink sm:text-[17px]">
                {headline}
              </p>

              {subheadline ? (
                <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-muted">
                  {subheadline}
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {location ? (
                  <Chip icon={<MapPin className="h-3.5 w-3.5" />} tone="outline">
                    {location}
                  </Chip>
                ) : null}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Magnetic>
                  <ActionLink
                    href="/projects"
                    variant="primary"
                    icon={<ArrowRight className="h-4 w-4" />}
                  >
                    View projects
                  </ActionLink>
                </Magnetic>
                <Magnetic strength={3}>
                  <ActionLink href={CV_PATH} icon={<Download className="h-4 w-4" />}>
                    Download CV
                  </ActionLink>
                </Magnetic>
                <ActionLink href="/contact" icon={<Mail className="h-4 w-4" />}>
                  Contact me
                </ActionLink>
              </div>
            </Spotlight>
          </BentoCard>

          <BentoCard span={3} className="p-2">
            <Parallax className="h-full" distance={10}>
              <ImageFrame
                src={avatarPath}
                alt={`Portrait of ${fullName}, ${headline}`}
                seed={fullName}
                label={fullName}
                kind="Portrait"
                className="aspect-[4/5] h-full w-full"
                sizes="(min-width: 1024px) 320px, 45vw"
              />
            </Parallax>
          </BentoCard>

          {hasRoles ? (
            <BentoCard span={3} className="flex flex-col p-4">
              <p className="label-mono">Currently</p>
              <ul className="mt-2 grid gap-2">
                {currentRoles.map((role) => (
                  <li key={role.slug} className="border-b border-line pb-2 last:border-b-0 last:pb-0">
                    <p className="font-display text-[13.5px] font-semibold leading-snug text-ink">
                      {role.title}
                    </p>
                    <p className="mt-0.5 text-[12px] leading-snug text-muted">{role.company}</p>
                  </li>
                ))}
              </ul>
              {focus.length > 0 ? (
                <div className="mt-3">
                  <p className="label-mono">Focus</p>
                  <ul className="mt-1.5 flex flex-wrap gap-1.5">
                    {focus.slice(0, 4).map((tag) => (
                      <li
                        key={tag}
                        className="rounded-full border border-line bg-panel px-2 py-0.5 text-[11px] text-muted"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <nav className="mt-auto grid gap-1 border-t border-line pt-2.5 text-[12px]">
                {[
                  { href: "/projects", label: "Case studies" },
                  { href: "/experience", label: "Career timeline" },
                  { href: "/contact", label: "Contact channels" },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex items-center justify-between gap-2 rounded-control px-1 py-1 text-muted transition hover:bg-panel hover:text-ink"
                  >
                    <span>{item.label}</span>
                    <ArrowRight
                      className="h-3 w-3 text-faint transition group-hover:translate-x-0.5 group-hover:text-teal"
                      aria-hidden="true"
                    />
                  </Link>
                ))}
              </nav>
            </BentoCard>
          ) : (
            <BentoCard span={3} className="flex flex-col justify-between p-4">
              <p className="label-mono">Explore</p>
              <div className="mt-3 grid gap-2 text-[13px]">
                <Link href="/projects" className="text-muted transition hover:text-ink">
                  Case studies
                </Link>
                <Link href="/experience" className="text-muted transition hover:text-ink">
                  Career timeline
                </Link>
                <Link href="/contact" className="text-muted transition hover:text-ink">
                  Contact channels
                </Link>
              </div>
            </BentoCard>
          )}

          {stats.length > 0 ? (
            <BentoCard span={12} className="p-0">
              <dl className="grid grid-cols-2 divide-line sm:grid-cols-4 sm:divide-x">
                {stats.map((stat) => (
                  <div key={stat.label} className="flex flex-col gap-1 p-3.5 sm:p-4">
                    <dt className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-faint">
                      <span className="grid h-6 w-6 place-items-center rounded-md bg-panel text-teal">
                        {stat.icon}
                      </span>
                      <span className="truncate">{stat.label}</span>
                    </dt>
                    <dd className="mt-1 font-display text-xl font-semibold leading-none text-ink sm:text-2xl">
                      <CountUp
                        value={stat.value}
                        suffix={stat.suffix}
                        decimals={stat.decimals}
                      />
                    </dd>
                    {stat.hint ? (
                      <p className="text-[11.5px] leading-snug text-faint">{stat.hint}</p>
                    ) : null}
                  </div>
                ))}
              </dl>
            </BentoCard>
          ) : null}

          {marquee.length > 0 ? (
            <BentoCard span={12} className="overflow-hidden px-0 py-1.5">
              <div className="marquee-mask relative overflow-hidden" aria-hidden="true">
                <div className="marquee-track hover:[animation-play-state:paused]">
                  {marquee.map((item, index) => (
                    <span
                      key={`${item}-${index}`}
                      className="mr-2.5 inline-flex items-center gap-1.5 rounded-full border border-line bg-panel px-2.5 py-1 text-[12px] text-muted"
                    >
                      <span className="h-1 w-1 rounded-sm bg-teal" />
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </BentoCard>
          ) : null}
        </BentoGrid>
      </div>
    </section>
  );
}
