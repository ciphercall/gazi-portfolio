"use client";

import { useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import type { ReactNode } from "react";

/**
 * A small magnetic pull for primary actions.
 *
 * The wrapper moves at most `strength` pixels towards the pointer; the child
 * keeps every bit of its own semantics, so this is decoration over a normal
 * link or button, never a replacement for it. Pointer-coarse devices and
 * reduced-motion users get the untouched child.
 */
export interface MagneticProps {
  children: ReactNode;
  strength?: number;
  className?: string;
}

export function Magnetic({ children, strength = 5, className = "" }: MagneticProps) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 320, damping: 24, mass: 0.4 });
  const y = useSpring(rawY, { stiffness: 320, damping: 24, mass: 0.4 });

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ x, y }}
      onPointerMove={(event) => {
        if (event.pointerType !== "mouse") return;
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        const dx = (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
        const dy = (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
        rawX.set(Math.max(-strength, Math.min(strength, dx * strength)));
        rawY.set(Math.max(-strength, Math.min(strength, dy * strength)));
      }}
      onPointerLeave={() => {
        rawX.set(0);
        rawY.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}
