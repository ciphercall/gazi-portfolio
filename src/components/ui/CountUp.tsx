"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "motion/react";

/**
 * A stat that counts to its value when it first becomes visible.
 *
 * Used for the hero ribbon and the experience metrics. Reduced motion shows the
 * final number immediately; the announcement is the text content, so the count
 * never changes what a screen reader reads at rest.
 */
export interface CountUpProps {
  value: number;
  /** Appended directly, e.g. "+" or " yrs". */
  suffix?: string;
  decimals?: number;
  className?: string;
  durationMs?: number;
}

export function CountUp({
  value,
  suffix = "",
  decimals = 0,
  className = "",
  durationMs = 1200,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduceMotion = useReducedMotion();
  const [progress, setProgress] = useState<number | null>(null);

  useEffect(() => {
    if (!inView || reduceMotion) return;

    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const next = Math.min(1, (now - start) / durationMs);
      setProgress(next);
      if (next < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [durationMs, inView, reduceMotion]);

  const display =
    reduceMotion
      ? value
      : progress === null
        ? 0
        : value * (1 - Math.pow(1 - progress, 3));

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
}
