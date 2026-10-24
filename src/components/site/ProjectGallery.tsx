"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight, Expand, ImageIcon, X } from "lucide-react";

import { ImageFrame } from "@/components/ui/ImageFrame";
import type { ProjectImageDto } from "@/components/site/types";

/**
 * Project gallery with a lightbox.
 *
 * Keyboard: Escape closes, ArrowLeft/ArrowRight step through the set, Tab is
 * trapped inside the dialog while it is open, and focus returns to the
 * thumbnail that opened it. Pointer: click a thumbnail, or drag the stage
 * sideways to swipe. Every control is an icon *plus* a visible word.
 */

const EASE_AURORA: [number, number, number, number] = [0.22, 1, 0.36, 1];

export interface ProjectGalleryProps {
  images: ProjectImageDto[];
  projectTitle: string;
}

function altFor(image: ProjectImageDto, projectTitle: string, index: number): string {
  return image.alt.trim() || `${projectTitle} — screenshot ${index + 1}`;
}

function captionFor(image: ProjectImageDto, index: number): string {
  return image.caption?.trim() || `Screenshot ${index + 1}`;
}

export function ProjectGallery({ images, projectTitle }: ProjectGalleryProps) {
  const [index, setIndex] = useState<number | null>(null);
  const [direction, setDirection] = useState(1);
  const reduceMotion = useReducedMotion();

  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const isOpen = index !== null;
  const count = images.length;

  const close = useCallback(() => {
    setIndex(null);
    triggerRef.current?.focus();
    triggerRef.current = null;
  }, []);

  const step = useCallback(
    (delta: number) => {
      if (count === 0) return;
      setDirection(delta);
      setIndex((current) => (current === null ? current : (current + delta + count) % count));
    },
    [count],
  );

  // Lock the page behind the dialog and move focus into it.
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  // Keyboard: close, navigate, and keep Tab inside the dialog.
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
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
  }, [close, isOpen, step]);

  if (count === 0) return null;

  const active = index === null ? null : images[index];
  const activeIndex = index ?? 0;

  return (
    <div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((image, itemIndex) => (
          <li key={`${image.path}-${itemIndex}`}>
            <button
              type="button"
              onClick={(event) => {
                triggerRef.current = event.currentTarget;
                setDirection(1);
                setIndex(itemIndex);
              }}
              className="glass card-lift group block w-full overflow-hidden text-left"
              aria-label={`Open image ${itemIndex + 1} of ${count}: ${captionFor(image, itemIndex)}`}
            >
              <ImageFrame
                src={image.path}
                alt={altFor(image, projectTitle, itemIndex)}
                seed={`${projectTitle}-${itemIndex}`}
                label={captionFor(image, itemIndex)}
                kind="Gallery"
                className="aspect-[16/10] w-full"
                roundedClassName="rounded-none"
                sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 100vw"
              />
              <span className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="label-mono truncate">{captionFor(image, itemIndex)}</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-teal">
                  <Expand className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Enlarge</span>
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <AnimatePresence>
        {isOpen && active ? (
          <motion.div
            key="lightbox"
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.25, ease: EASE_AURORA }}
          >
            <div
              className="absolute inset-0 bg-[color-mix(in_oklab,var(--c-canvas)_88%,transparent)] backdrop-blur-sm"
              onClick={close}
              aria-hidden="true"
            />

            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-label={`${projectTitle} — image gallery`}
              className="glass-strong hairline relative z-10 flex max-h-full w-full max-w-5xl flex-col overflow-hidden"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
                <p className="flex min-w-0 items-center gap-2 text-sm text-muted">
                  <ImageIcon className="h-4 w-4 text-teal" aria-hidden="true" />
                  <span className="truncate">{captionFor(active, activeIndex)}</span>
                  <span className="label-mono shrink-0">
                    {activeIndex + 1} / {count}
                  </span>
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => step(-1)}
                    className="pill"
                    disabled={count < 2}
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    <span>Previous</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => step(1)}
                    className="pill"
                    disabled={count < 2}
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    <span>Next</span>
                  </button>
                  <button
                    ref={closeButtonRef}
                    type="button"
                    onClick={close}
                    className="pill"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                    <span>Close</span>
                  </button>
                </div>
              </div>

              <motion.div
                key={active.path}
                className="relative h-[52svh] w-full sm:h-[64svh]"
                initial={reduceMotion ? false : { opacity: 0, x: direction * 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.35, ease: EASE_AURORA }}
                drag={count > 1 ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.12}
                onDragEnd={(_event, info) => {
                  if (info.offset.x < -60) step(1);
                  else if (info.offset.x > 60) step(-1);
                }}
              >
                <Image
                  src={active.path}
                  alt={altFor(active, projectTitle, activeIndex)}
                  fill
                  sizes="(min-width: 1024px) 1024px, 100vw"
                  unoptimized={active.path.startsWith("/media/")}
                  className="pointer-events-none object-contain p-3 sm:p-5"
                />
              </motion.div>

              {active.caption ? (
                <p className="border-t border-line px-4 py-3 text-sm text-muted">
                  {active.caption}
                </p>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
