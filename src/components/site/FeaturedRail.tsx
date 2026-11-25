"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import type { ReactNode } from "react";

/**
 * Scroll-pinned horizontal rail for the featured case studies.
 *
 * The section is taller than the viewport; while it passes, the card row
 * translates sideways. It is decoration around real links, so it is skipped
 * entirely for reduced-motion users (a plain horizontal scroller remains) and
 * the caller keeps a grid fallback below `lg`.
 */
export function FeaturedRail({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const distanceRef = useRef(0);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  // The track is as wide as its cards; a fixed percentage would leave later
  // cards unreachable, so the translation distance is measured. It lives in a
  // ref and drives the outer height imperatively — measuring into React state
  // here produced a zero width on the first paint.
  const x = useTransform(scrollYProgress, (progress) => -progress * distanceRef.current);

  useEffect(() => {
    const track = trackRef.current;
    const viewport = viewportRef.current;
    const outer = ref.current;
    if (!track || !viewport || !outer) return;

    let frame = 0;
    const measure = () => {
      distanceRef.current = Math.max(0, track.scrollWidth - viewport.clientWidth);
      outer.style.height = `calc(100svh + ${Math.round(distanceRef.current * 0.55)}px)`;
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    schedule();
    const observer = new ResizeObserver(schedule);
    observer.observe(track);
    observer.observe(viewport);
    observer.observe(outer);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  if (reduceMotion) {
    return (
      <div className={`flex gap-4 overflow-x-auto pb-2 ${className}`}>{children}</div>
    );
  }

  return (
    <div ref={ref} className={`relative h-[165vh] ${className}`}>
      <div
        ref={viewportRef}
        className="sticky top-20 flex h-[calc(100svh-6rem)] items-center overflow-hidden [mask-image:linear-gradient(to_right,black_0%,black_90%,transparent_100%)]"
      >
        <motion.div
          ref={trackRef}
          style={{ x }}
          className="flex gap-4 will-change-transform"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
