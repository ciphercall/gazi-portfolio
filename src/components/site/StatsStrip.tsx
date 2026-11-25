import type { ReactNode } from "react";

import { IconBadge } from "@/components/ui/IconBadge";

/**
 * The four-figure strip under the hero. Each figure is an icon, a number and a
 * plain-language label — the number is never left to speak on its own.
 */

export interface StatItem {
  icon: ReactNode;
  value: string;
  label: string;
  hint?: string;
}

export function StatsStrip({ items }: { items: StatItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="glass hairline grid grid-cols-2 gap-x-4 gap-y-4 rounded-card p-3.5 sm:gap-5 sm:p-4 lg:grid-cols-4">
       {items.map((item) => (
         <div key={item.label} className="flex flex-col gap-1.5">
           <IconBadge size="sm">{item.icon}</IconBadge>
           <p className="font-display text-lg font-semibold tabular-nums text-ink sm:text-xl">
             {item.value}
           </p>
          <div>
            <p className="text-[12.5px] font-medium text-ink">{item.label}</p>
            {item.hint ? <p className="mt-0.5 text-[11px] text-faint">{item.hint}</p> : null}
          </div>
        </div>
      ))}
    </div>
  );
}
