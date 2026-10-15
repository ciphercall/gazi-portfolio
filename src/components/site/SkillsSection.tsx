import {
  Boxes,
  Code2,
  Cpu,
  Database,
  LayoutGrid,
  Server,
  Smartphone,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import { AURORA_SWEEP } from "@/components/ui/aurora";
import { Chip } from "@/components/ui/Chip";
import { IconBadge } from "@/components/ui/IconBadge";
import { Reveal } from "@/components/site/Reveal";

/**
 * Skills band.
 *
 * Two presentations of the same data: an infinite CSS marquee (decoration, so
 * it is hidden from assistive tech) and a grouped chip cloud that carries the
 * actual semantics — every category is a heading with a count next to it.
 */

export interface SkillGroup {
  category: string;
  items: string[];
}

function categoryIcon(category: string): LucideIcon {
  const key = category.toLowerCase();
  if (key.includes("back")) return Server;
  if (key.includes("front")) return LayoutGrid;
  if (key.includes("mobile")) return Smartphone;
  if (key.includes("database") || key.includes("data")) return Database;
  if (key.includes("industrial") || key.includes("automation")) return Cpu;
  if (key.includes("tool") || key.includes("devops")) return Wrench;
  if (key.includes("lang")) return Code2;
  return Boxes;
}

export function SkillsSection({ groups }: { groups: SkillGroup[] }) {
  const all = groups.flatMap((group) => group.items);
  if (all.length === 0) return null;

  // The track is duplicated so the -50% marquee translation loops seamlessly.
  const track = [...all, ...all];

  return (
    <div className="mt-12">
      <div className="marquee-mask relative overflow-hidden py-2" aria-hidden="true">
        <div className="marquee-track hover:[animation-play-state:paused]">
          {track.map((item, index) => (
            <span
              key={`${item}-${index}`}
              className="mr-3 inline-flex items-center gap-2 rounded-full border border-line bg-panel px-3.5 py-2 text-sm text-muted"
            >
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-sm"
                style={{ backgroundImage: AURORA_SWEEP }}
              />
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((group, index) => {
          const Icon = categoryIcon(group.category);
          return (
            <Reveal key={group.category} delay={index * 0.05}>
              <section
                className="glass hairline h-full p-5"
                aria-label={`${group.category} skills`}
              >
                <div className="flex items-center gap-3">
                  <IconBadge size="sm">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </IconBadge>
                  <div>
                    <h3 className="font-display text-base font-semibold text-ink">
                      {group.category}
                    </h3>
                    <p className="label-mono">{group.items.length} skills</p>
                  </div>
                </div>

                <ul className="mt-4 flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <li key={item}>
                      <Chip tone="outline">{item}</Chip>
                    </li>
                  ))}
                </ul>
              </section>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
