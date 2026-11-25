"use client";

import { useRef } from "react";
import type { ReactNode } from "react";

/**
 * Sets the pointer position on a `.spotlight-card` as `--mx`/`--my`.
 *
 * The highlight itself is CSS (and hidden on coarse pointers), so this wrapper
 * costs no React state and no re-render per mouse move.
 */
export function Spotlight({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  return (
    <div
      ref={ref}
      className={`spotlight-card rounded-card ${className}`}
      onPointerMove={(event) => {
        if (event.pointerType !== "mouse") return;
        const node = ref.current;
        if (!node) return;
        const rect = node.getBoundingClientRect();
        node.style.setProperty("--mx", `${event.clientX - rect.left}px`);
        node.style.setProperty("--my", `${event.clientY - rect.top}px`);
      }}
    >
      {children}
    </div>
  );
}
