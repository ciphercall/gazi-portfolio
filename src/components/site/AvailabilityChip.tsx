import { CircleCheck } from "lucide-react";

/**
 * The "available for work" status chip.
 *
 * The state is carried by a word and an icon as well as by the dot, so it reads
 * correctly in greyscale, for colour-blind visitors and for screen readers.
 */

export interface AvailabilityChipProps {
  label?: string;
  className?: string;
}

export function AvailabilityChip({
  label = "Available for work",
  className = "",
}: AvailabilityChipProps) {
  return (
    <span className={`pill ${className}`}>
      <span className="relative flex h-2 w-2" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal opacity-70" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-teal" />
      </span>
      <CircleCheck className="h-4 w-4 text-teal" aria-hidden="true" />
      <span className="font-medium text-ink">{label}</span>
    </span>
  );
}
