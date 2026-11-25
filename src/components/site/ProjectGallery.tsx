"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  Expand,
  ImageIcon,
  Pause,
  Play,
} from "lucide-react";

import { ImageFrame } from "@/components/ui/ImageFrame";
import { ImageLightbox } from "@/components/site/ImageLightbox";
import type { ProjectImageDto } from "@/components/site/types";

/**
 * Project gallery as a slideshow.
 *
 * One large stage, a caption/counter row, explicit Previous/Next/Play controls
 * and a thumbnail strip. It auto-advances every five seconds, but only while
 * the visitor is not reading it: hovering or focusing the gallery pauses it,
 * a hidden tab pauses it, and any manual navigation stops it until Play is
 * pressed again. With `prefers-reduced-motion` the slideshow never starts and
 * every transition collapses to zero duration.
 *
 * Clicking the stage (or Enlarge) opens `ImageLightbox` at that slide. The
 * image order is the admin panel's array order — the same `ProjectImageDto[]`
 * the gallery editor saves — so reordering in `/admin` reorders the slideshow,
 * and alt text and captions render exactly as typed there.
 */

const EASE_AURORA: [number, number, number, number] = [0.22, 1, 0.36, 1];
const AUTOPLAY_MS = 5000;

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
  const count = images.length;
  const reduceMotion = useReducedMotion();

  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [autoPlay, setAutoPlay] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pageHidden, setPageHidden] = useState(false);

  const triggerRef = useRef<HTMLElement | null>(null);
  const activeThumbRef = useRef<HTMLButtonElement | null>(null);
  const draggedRef = useRef(false);

  const safeIndex = Math.min(index, Math.max(count - 1, 0));

  const autoEnabled =
    !reduceMotion &&
    autoPlay &&
    count > 1 &&
    !hovered &&
    !focused &&
    !pageHidden &&
    lightboxIndex === null;

  useEffect(() => {
    const onVisibility = () => setPageHidden(document.hidden);
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    if (!autoEnabled) return;
    const id = window.setInterval(() => {
      setDirection(1);
      setIndex((current) => (current + 1) % count);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [autoEnabled, count]);

  useEffect(() => {
    activeThumbRef.current?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, [safeIndex, reduceMotion]);

  const step = useCallback(
    (delta: number) => {
      if (count === 0) return;
      setAutoPlay(false);
      setDirection(delta);
      setIndex((current) => (current + delta + count) % count);
    },
    [count],
  );

  const goTo = useCallback(
    (next: number) => {
      if (count === 0) return;
      setAutoPlay(false);
      setDirection(next >= safeIndex ? 1 : -1);
      setIndex(((next % count) + count) % count);
    },
    [count, safeIndex],
  );

  const openLightbox = useCallback((target: number, trigger: HTMLElement) => {
    triggerRef.current = trigger;
    setAutoPlay(false);
    setIndex(target);
    setLightboxIndex(target);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
    triggerRef.current?.focus();
    triggerRef.current = null;
  }, []);

  if (count === 0) return null;

  const active = images[safeIndex];
  if (!active) return null;

  const caption = captionFor(active, safeIndex);

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label={`${projectTitle} gallery`}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") {
          event.preventDefault();
          step(1);
        } else if (event.key === "ArrowLeft") {
          event.preventDefault();
          step(-1);
        }
      }}
      className="rounded-card"
    >
      <div
        className="relative h-[clamp(15rem,46svh,38rem)] w-full overflow-hidden rounded-card border border-line bg-canvas-2/60 sm:h-[clamp(20rem,56svh,44rem)]"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setFocused(false);
          }
        }}
      >
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={`${active.path}-${safeIndex}`}
            className="absolute inset-0"
            initial={reduceMotion ? false : { opacity: 0, x: direction * 48 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, x: direction * -48 }}
            transition={{ duration: reduceMotion ? 0 : 0.42, ease: EASE_AURORA }}
            drag={count > 1 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.08}
            onDragStart={() => {
              draggedRef.current = true;
            }}
            onDragEnd={(_event, info) => {
              if (info.offset.x < -60) step(1);
              else if (info.offset.x > 60) step(-1);
              window.setTimeout(() => {
                draggedRef.current = false;
              }, 80);
            }}
          >
            <button
              type="button"
              onClick={(event) => {
                if (draggedRef.current) return;
                openLightbox(safeIndex, event.currentTarget);
              }}
              className="block h-full w-full cursor-zoom-in"
              aria-label={`Enlarge image ${safeIndex + 1} of ${count}: ${caption}`}
            >
              <ImageFrame
                src={active.path}
                alt={altFor(active, projectTitle, safeIndex)}
                seed={`${projectTitle}-${safeIndex}`}
                label={caption}
                kind="Gallery"
                fit="contain"
                className="h-full w-full"
                roundedClassName="rounded-none"
                sizes="(min-width: 1024px) 1400px, 100vw"
                priority={safeIndex === 0}
                quality={88}
              />
            </button>
          </motion.div>
        </AnimatePresence>

        <button
          type="button"
          onClick={() => step(-1)}
          disabled={count < 2}
          className="pill absolute left-3 top-1/2 z-10 -translate-y-1/2 bg-canvas/80 backdrop-blur"
          aria-label="Previous image"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Previous</span>
        </button>
        <button
          type="button"
          onClick={() => step(1)}
          disabled={count < 2}
          className="pill absolute right-3 top-1/2 z-10 -translate-y-1/2 bg-canvas/80 backdrop-blur"
          aria-label="Next image"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Next</span>
        </button>

        <button
          type="button"
          onClick={(event) => openLightbox(safeIndex, event.currentTarget)}
          className="pill absolute right-3 top-3 z-10 bg-canvas/80 backdrop-blur"
        >
          <Expand className="h-4 w-4" aria-hidden="true" />
          <span>Enlarge</span>
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="flex min-w-0 items-center gap-2 text-[12.5px] text-muted">
          <ImageIcon className="h-3.5 w-3.5 shrink-0 text-teal" aria-hidden="true" />
          <span className="truncate">{caption}</span>
          <span className="label-mono shrink-0" aria-live="polite">
            {safeIndex + 1} / {count}
          </span>
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setAutoPlay((value) => !value)}
            aria-pressed={autoPlay}
            disabled={count < 2 || Boolean(reduceMotion)}
            className="pill px-3 py-1.5 text-[12px]"
            title={reduceMotion ? "Auto-play is off because reduced motion is enabled" : undefined}
          >
            {autoPlay ? (
              <Pause className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Play className="h-4 w-4" aria-hidden="true" />
            )}
            <span>{autoPlay ? "Pause" : "Play"}</span>
          </button>
          <button
            type="button"
            onClick={() => step(-1)}
            disabled={count < 2}
            className="pill px-3 py-1.5 text-[12px]"
          >
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Previous</span>
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            disabled={count < 2}
            className="pill px-3 py-1.5 text-[12px]"
          >
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Next</span>
          </button>
        </div>
      </div>

      {count > 1 ? (
        <ul className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
          {images.map((image, itemIndex) => {
            const isActive = itemIndex === safeIndex;
            const label = `Go to image ${itemIndex + 1} of ${count}: ${captionFor(image, itemIndex)}`;

            return (
              <li key={`${image.path}-${itemIndex}`} className="shrink-0">
                <button
                  ref={isActive ? activeThumbRef : undefined}
                  type="button"
                  onClick={() => goTo(itemIndex)}
                  aria-current={isActive ? "true" : undefined}
                  aria-label={label}
                  className={`relative block h-14 w-20 overflow-hidden rounded-control border transition sm:h-16 sm:w-24 ${
                    isActive
                      ? "border-teal ring-2 ring-[color-mix(in_oklab,var(--c-teal)_35%,transparent)]"
                      : "border-line opacity-70 hover:opacity-100"
                  }`}
                >
                  <ImageFrame
                    src={image.path}
                    alt=""
                    seed={`${projectTitle}-${itemIndex}`}
                    label={captionFor(image, itemIndex)}
                    fit="cover"
                    className="h-full w-full"
                    roundedClassName="rounded-none"
                    sizes="128px"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      <AnimatePresence>
        {lightboxIndex !== null ? (
          <ImageLightbox
            images={images}
            projectTitle={projectTitle}
            index={lightboxIndex}
            onClose={closeLightbox}
            onIndexChange={(next) => {
              setIndex(next);
              setLightboxIndex(next);
            }}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
