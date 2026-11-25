"use client";

import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

const EASE_AURORA: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * Route-level entrance: an 8px rise and a fade, keyed to the pathname so a new
 * page animates in without a second state layer. Reduced motion skips it.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      key={pathname}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.22, ease: EASE_AURORA }}
    >
      {children}
    </motion.div>
  );
}
