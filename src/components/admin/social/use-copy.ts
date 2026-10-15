"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Clipboard copy with an explicit outcome.
 *
 * The panel reports whether the copy actually happened rather than silently
 * changing a label, because a "Copied" badge that lies is worse than no badge:
 * the owner would paste stale text and publish it. The generated text is also
 * `select-all` in a sunk block, so if the Clipboard API is unavailable the copy
 * can still be done by hand — and the failure message says exactly that.
 */

export type CopyState = "idle" | "copied" | "failed";

export interface UseCopyResult {
  state: CopyState;
  copy: (text: string) => void;
}

export function useCopy(resetAfterMs = 2400): UseCopyResult {
  const [state, setState] = useState<CopyState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const copy = useCallback(
    (text: string) => {
      const finish = (next: CopyState) => {
        setState(next);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setState("idle"), resetAfterMs);
      };

      if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
        finish("failed");
        return;
      }

      navigator.clipboard.writeText(text).then(
        () => finish("copied"),
        () => finish("failed"),
      );
    },
    [resetAfterMs],
  );

  return { state, copy };
}
