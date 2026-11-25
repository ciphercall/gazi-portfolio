import { ArrowUpRight, Download, Globe, Smartphone } from "lucide-react";

import { Reveal } from "@/components/site/Reveal";
import { Section } from "@/components/site/Section";
import { IconBadge } from "@/components/ui/IconBadge";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { AppLinkDto } from "@/lib/queries";

export interface EcosystemSectionProps {
  links: AppLinkDto[];
}

export function EcosystemSection({ links }: EcosystemSectionProps) {
  if (links.length === 0) return null;

  return (
    <Section
      id="apps"
      grid
      rail={
        <SectionHeading
          eyebrow="Ecosystem"
          title={<>Apps &amp; sites</>}
          lead="Other places to find the work — the studio site and the Android builds that carry the same material offline."
        />
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {links.map((link, index) => {
          const isWeb = link.platform === "WEB";
          const PlatformIcon = isWeb ? Globe : Smartphone;

          return (
            <Reveal key={link.slug} delay={index * 0.05}>
              <article className="glass hairline bento-lift flex h-full flex-col rounded-card p-3.5">
                <div className="flex items-start gap-2.5">
                  <IconBadge size="sm">
                    <PlatformIcon className="h-4 w-4" aria-hidden="true" />
                  </IconBadge>
                  <div className="min-w-0">
                    <h3 className="font-display text-[13.5px] font-semibold text-ink">
                      {link.name}
                    </h3>
                    <p className="label-mono mt-0.5">{isWeb ? "Web" : "Android"}</p>
                  </div>
                </div>

                {link.tagline ? (
                  <p className="mt-2.5 line-clamp-2 text-[12px] leading-relaxed text-muted">
                    {link.tagline}
                  </p>
                ) : null}

                <div className="mt-auto pt-3">
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-teal transition hover:text-cyan"
                  >
                    {isWeb ? (
                      <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Download className="h-4 w-4" aria-hidden="true" />
                    )}
                    <span>{isWeb ? "Open site" : "Download APK"}</span>
                  </a>
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}
