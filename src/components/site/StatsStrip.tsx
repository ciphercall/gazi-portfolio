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
    <div className="glass hairline grid grid-cols-2 gap-x-4 gap-y-6 p-5 sm:gap-6 sm:p-6 lg:grid-cols-4">
       {items.map((item) => (
         <div key={item.label} className="flex flex-col gap-2.5">
           <IconBadge size="sm">{item.icon}</IconBadge>
           <p className="font-display text-xl font-semibold tabular-nums text-ink sm:text-2xl">
             {item.value}
           </p>
          <div>
            <p className="text-sm font-medium text-ink/90">{item.label}</p>
            {item.hint ? <p className="mt-1 text-xs text-faint">{item.hint}</p> : null}
          </div>
        </div>
      ))}
    </div>
  );
}
