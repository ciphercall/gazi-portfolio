"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Maximize2,
  Minimize2,
  MoveHorizontal,
  X,
} from "lucide-react";

import type { ProjectImageDto } from "@/components/site/types";

/**
 * Near-fullscreen image viewer for a project gallery.
 *
 * The slot is the viewport minus a small gutter, so a screenshot's own UI text
 * is legible without downloading it. Clicking the image (or the labelled control)
 * zooms to 2× and the image becomes draggable, which is how a dense dashboard
 * capture gets read. The keyboard contract is the same one the old inline
 * lightbox had: Escape closes, arrows step, Tab stays inside, focus returns to
 * whatever opened it (the gallery owns that last part).
 */

const EASE_AURORA: [number, number, number, number] = [0.22, 1, 0.36, 1];

export interface ImageLightboxProps {
  images: ProjectImageDto[];
  projectTitle: string;
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

function altFor(image: ProjectImageDto, projectTitle: string, index: number): string {
  return image.alt.trim() || `${projectTitle} — screenshot ${index + 1}`;
}

function captionFor(image: ProjectImageDto, index: number): string {
  return image.caption?.trim() || `Screenshot ${index + 1}`;
}

export function ImageLightbox({
  images,
  projectTitle,
  index,
  onClose,
  onIndexChange,
}: ImageLightboxProps) {
  const reduceMotion = useReducedMotion();
  const count = images.length;
  const safeIndex = Math.min(Math.max(index, 0), Math.max(count - 1, 0));
  const active = images[safeIndex];

  const [zoomed, setZoomed] = useState(false);

  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const draggedRef = useRef(false);

  const step = useCallback(
    (delta: number) => {
      if (count === 0) return;
      setZoomed(false);
      onIndexChange((safeIndex + delta + count) % count);
    },
    [count, onIndexChange, safeIndex],
  );

  // Lock the page behind the dialog and move focus into it.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  // Keyboard: close, navigate, and keep Tab inside the dialog.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        step(1);
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        step(-1);
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, step]);

  // The gallery sits inside a `Section`, which is `isolate` — its z-index would
  // trap a fixed dialog underneath the sticky nav. Rendering into `body` puts
  // the viewer in the page's own stacking context, above the header.
  if (!active || typeof document === "undefined") return null;

  return createPortal(
    <motion.div
      key="image-lightbox"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.25, ease: EASE_AURORA }}
    >
      <div
        className="absolute inset-0 bg-[color-mix(in_oklab,var(--c-canvas)_92%,transparent)] backdrop-blur-md"
        onClick={onClose}
        aria-hidden="true"
      />

      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${projectTitle} — image ${safeIndex + 1} of ${count}`}
        className="hairline relative z-10 flex h-full w-full flex-col overflow-hidden rounded-card border border-line-strong bg-canvas shadow-lift"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.985 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={reduceMotion ? undefined : { opacity: 0, scale: 0.99 }}
        transition={{ duration: reduceMotion ? 0 : 0.3, ease: EASE_AURORA }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-2 sm:px-4 sm:py-3">
          <p className="flex min-w-0 items-center gap-2 text-[12.5px] text-muted">
            <ImageIcon className="h-4 w-4 shrink-0 text-teal" aria-hidden="true" />
            <span className="truncate">{captionFor(active, safeIndex)}</span>
            <span className="label-mono shrink-0">
              {safeIndex + 1} / {count}
            </span>
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setZoomed((value) => !value)}
              aria-pressed={zoomed}
              className="pill px-3 py-1.5 text-[12px]"
            >
              {zoomed ? (
                <Minimize2 className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Maximize2 className="h-4 w-4" aria-hidden="true" />
              )}
              <span>{zoomed ? "Fit" : "Zoom 2×"}</span>
            </button>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="pill px-3 py-1.5 text-[12px]"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              <span>Close</span>
            </button>
          </div>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden bg-canvas-2">
          <motion.div
            key={`${active.path}-${zoomed ? "zoom" : "fit"}`}
            className={`absolute inset-0 ${
              zoomed ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"
            }`}
            drag={zoomed}
            dragMomentum={false}
            dragElastic={0.06}
            onDragStart={() => {
              draggedRef.current = true;
            }}
            onDragEnd={() => {
              window.setTimeout(() => {
                draggedRef.current = false;
              }, 80);
            }}
            onClick={() => {
              if (draggedRef.current) return;
              setZoomed((value) => !value);
            }}
            initial={false}
            animate={{ scale: zoomed ? 2 : 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.28, ease: EASE_AURORA }}
          >
            <Image
              src={active.path}
              alt={altFor(active, projectTitle, safeIndex)}
              fill
              sizes="(min-width: 1700px) 1700px, 96vw"
              quality={90}
              unoptimized={active.path.startsWith("/media/")}
              draggable={false}
              className="pointer-events-none object-contain"
            />
          </motion.div>

          <button
            type="button"
            onClick={() => step(-1)}
            disabled={count < 2}
            className="pill absolute left-2 top-1/2 z-10 -translate-y-1/2 bg-canvas/80 backdrop-blur sm:left-4"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Previous</span>
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            disabled={count < 2}
            className="pill absolute right-2 top-1/2 z-10 -translate-y-1/2 bg-canvas/80 backdrop-blur sm:right-4"
            aria-label="Next image"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Next</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-3 py-2 sm:px-4 sm:py-3">
          <p className="min-w-0 truncate text-xs text-muted sm:text-sm">
            {active.caption?.trim() || `Screenshot ${safeIndex + 1}`}
          </p>
          <p className="label-mono hidden items-center gap-1.5 sm:flex">
            <MoveHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
            {zoomed ? "Drag to pan · Esc closes" : "Zoom 2× for detail · Esc closes"}
          </p>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
