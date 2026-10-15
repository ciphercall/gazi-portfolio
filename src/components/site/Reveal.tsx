"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Scroll-triggered entrance.
 *
 * This is the only motion wrapper on the site: sections reveal once, when they
 * come into view, and never move again. With `prefers-reduced-motion` the
 * children render immediately with no transform — the CSS in globals.css would
 * neutralise the animation anyway, but skipping the JS path also keeps the
 * reduced-motion experience snappy.
 */

const EASE_AURORA: [number, number, number, number] = [0.22, 1, 0.36, 1];

export interface RevealProps {
  children: ReactNode;
  /** Seconds. Use small increments to stagger siblings. */
  delay?: number;
  /** Travel distance in pixels. */
  y?: number;
  className?: string;
  /** Portion of the element that must be visible before it reveals. */
  amount?: number;
}

export function Reveal({ children, delay = 0, y = 20, className, amount = 0.15 }: RevealProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration: 0.65, delay, ease: EASE_AURORA }}
    >
      {children}
    </motion.div>
  );
}
