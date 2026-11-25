"use client";

import { motion, useReducedMotion, useScroll, useSpring } from "motion/react";

/**
 * A 1px progress line under the floating nav. Purely positional feedback; it is
 * hidden from assistive tech and does not move for reduced-motion users.
 */
export function ScrollProgress() {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 220, damping: 30, mass: 0.3 });

  if (reduceMotion) return null;

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX }}
      className="pointer-events-none absolute inset-x-2 bottom-0 h-px origin-left rounded-full bg-linear-to-r from-teal via-cyan to-violet"
    />
  );
}
