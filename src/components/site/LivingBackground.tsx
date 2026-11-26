"use client";

import { useEffect, useRef } from "react";

import {
  FIELD_GLYPHS,
  applyPointerInfluence,
  blendedRing,
  glyphTransform,
  iconAlpha,
  iconShapeIndex,
  morphState,
  rippleProgress,
} from "@/lib/background/field";
import { iconAssetAt, ringAt, toneAt, type Point } from "@/lib/background/glyph-shapes";

/**
 * The site's living background.
 *
 * Industry outlines — database, document, monitor, phone, cloud, shield, chip,
 * code — drift and morph into each other continuously, drawn as colourful
 * outlines with no fill. Whenever a shape settles, the real Lucide icon vendored
 * under `public/icons/field` resolves in its place (gradient-tinted), holds while
 * the shape rests, and dissolves as the next morph begins. The field leans
 * toward the cursor and a click sends a ripple through it.
 *
 * One canvas, no dependencies, `pointer-events: none`. Paused when the tab is
 * hidden, static under `prefers-reduced-motion` (where the icons rest visible),
 * DPR capped so a 4K display does not pay for pixels nobody sees.
 */

interface Rgb {
  r: number;
  g: number;
  b: number;
}

interface Ripple {
  x: number;
  y: number;
  at: number;
}

const FALLBACKS: [Rgb, Rgb, Rgb, Rgb] = [
  { r: 25, g: 211, b: 197 },
  { r: 34, g: 211, b: 238 },
  { r: 167, g: 139, b: 250 },
  { r: 255, g: 122, b: 182 },
];

function parseColor(value: string): Rgb | null {
  const input = value.trim();

  if (/^#[0-9a-f]{6}$/i.test(input)) {
    return {
      r: parseInt(input.slice(1, 3), 16),
      g: parseInt(input.slice(3, 5), 16),
      b: parseInt(input.slice(5, 7), 16),
    };
  }

  if (/^#[0-9a-f]{3}$/i.test(input)) {
    const r = input.slice(1, 2);
    const g = input.slice(2, 3);
    const b = input.slice(3, 4);
    return {
      r: parseInt(r + r, 16),
      g: parseInt(g + g, 16),
      b: parseInt(b + b, 16),
    };
  }

  const match = input.match(/rgba?\(([^)]+)\)/i);
  const channels = match?.[1]?.split(/[ ,/]+/).map(Number);
  if (channels && channels.length >= 3) {
    const [r, g, b] = channels;
    if (r !== undefined && g !== undefined && b !== undefined) {
      if ([r, g, b].every((channel) => Number.isFinite(channel))) return { r, g, b };
    }
  }

  return null;
}

function rgba(color: Rgb, alpha: number): string {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
}

function readPalette(): { accents: Rgb[]; light: boolean } {
  const styles = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: Rgb) => parseColor(styles.getPropertyValue(name)) ?? fallback;

  return {
    accents: [
      read("--c-teal", FALLBACKS[0]),
      read("--c-cyan", FALLBACKS[1]),
      read("--c-violet", FALLBACKS[2]),
      read("--c-rose", FALLBACKS[3]),
    ],
    light: document.documentElement.classList.contains("light"),
  };
}

function traceSmoothRing(context: CanvasRenderingContext2D, points: Point[]): void {
  if (points.length === 0) return;

  const midpoint = (a: Point, b: Point) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const last = points[points.length - 1];
  const first = points[0];
  if (!last || !first) return;
  const start = midpoint(last, first);

  context.beginPath();
  context.moveTo(start.x, start.y);

  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    if (!current || !next) continue;
    const end = midpoint(current, next);
    context.quadraticCurveTo(current.x, current.y, end.x, end.y);
  }

  context.closePath();
}

export function LivingBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = prefersReduced.matches;
    let palette = readPalette();
    let frame = 0;
    let startedAt = performance.now();
    let width = 0;
    let height = 0;

    const pointer = { x: -9999, y: -9999, targetX: -9999, targetY: -9999 };
    let hasPointer = false;
    const ripples: Ripple[] = [];

    // Real vendored icons, rasterised once and gradient-tinted per theme.
    const iconImages = new Map<number, HTMLImageElement>();
    const tintCache = new Map<string, HTMLCanvasElement>();

    const tintedIcon = (index: number, accent: Rgb, second: Rgb): HTMLCanvasElement | null => {
      const image = iconImages.get(index);
      if (!image || !image.complete || image.naturalWidth === 0) return null;

      const key = `${index}:${palette.light ? "l" : "d"}:${accent.r},${accent.g},${accent.b}:${second.r},${second.g},${second.b}`;
      const cached = tintCache.get(key);
      if (cached) return cached;

      const size = 256;
      const offscreen = document.createElement("canvas");
      offscreen.width = size;
      offscreen.height = size;
      const tint = offscreen.getContext("2d");
      if (!tint) return null;

      tint.drawImage(image, 0, 0, size, size);
      tint.globalCompositeOperation = "source-in";
      const gradient = tint.createLinearGradient(0, 0, size, size);
      gradient.addColorStop(0, rgba(accent, 1));
      gradient.addColorStop(1, rgba(second, 1));
      tint.fillStyle = gradient;
      tint.fillRect(0, 0, size, size);

      tintCache.set(key, offscreen);
      return offscreen;
    };

    const preloadIcons = () => {
      for (let index = 0; ; index += 1) {
        const asset = iconAssetAt(index);
        if (!asset) break;
        const image = new Image();
        image.decoding = "async";
        image.src = asset;
        image.onload = () => {
          if (reduced) draw(startedAt);
        };
        iconImages.set(index, image);
      }
    };

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const draw = (now: number) => {
      if (width === 0 || height === 0) return;

      const elapsed = now - startedAt;
      const shortest = Math.min(width, height);
      const outlineAlpha = palette.light ? 0.34 : 0.3;

      pointer.x += (pointer.targetX - pointer.x) * 0.08;
      pointer.y += (pointer.targetY - pointer.y) * 0.08;

      context.clearRect(0, 0, width, height);

      for (let index = 0; index < FIELD_GLYPHS.length; index += 1) {
        const glyph = FIELD_GLYPHS[index];
        if (!glyph) continue;
        const transform = glyphTransform(glyph, elapsed, width, height);
        const state = morphState(elapsed, glyph.phase, glyph.shapeOffset);
        const ring = blendedRing(
          ringAt(state.from),
          ringAt(state.to),
          state.t,
          0.004,
          elapsed,
        );

        const cos = Math.cos(transform.rotation);
        const sin = Math.sin(transform.rotation);
        const placed = ring.map((point) => ({
          x: transform.cx + (point.x * cos - point.y * sin) * transform.size,
          y: transform.cy + (point.x * sin + point.y * cos) * transform.size,
        }));

        const points = applyPointerInfluence(
          placed,
          hasPointer && !reduced ? { x: pointer.x, y: pointer.y } : null,
          shortest * 0.34,
          transform.size * 0.075,
        );

        const accent =
          palette.accents[(index + state.from) % palette.accents.length] ?? FALLBACKS[0];
        const second =
          palette.accents[(index + state.from + 1) % palette.accents.length] ?? FALLBACKS[1];

        // A glyph near the cursor lights up, so moving the mouse visibly stirs
        // the field instead of only nudging geometry nobody can see.
        const proximity =
          hasPointer && !reduced
            ? Math.max(
                0,
                1 -
                  Math.hypot(transform.cx - pointer.x, transform.cy - pointer.y) /
                    (shortest * 0.65),
              )
            : 0;
        // No fills anywhere: the field is colourful outlining only.
        const outline = outlineAlpha * (1 + proximity * 1.3);
        const gradient = context.createLinearGradient(
          transform.cx - transform.size / 2,
          transform.cy - transform.size / 2,
          transform.cx + transform.size / 2,
          transform.cy + transform.size / 2,
        );
        gradient.addColorStop(0, rgba(accent, outline));
        gradient.addColorStop(1, rgba(second, outline * 0.85));

        traceSmoothRing(context, points);
        context.strokeStyle = gradient;
        context.lineWidth = 1.5 + proximity * 1.2;
        context.lineJoin = "round";
        context.stroke();

        // Once the shape has settled, the real downloaded icon resolves in
        // place and fades again as the next morph starts.
        const settle = iconAlpha(elapsed, glyph.phase);
        if (settle > 0.01) {
          const iconIndex = iconShapeIndex(state);
          const [toneA, toneB] = toneAt(iconIndex);
          const iconAccent = palette.accents[toneA % palette.accents.length] ?? FALLBACKS[0];
          const iconSecond = palette.accents[toneB % palette.accents.length] ?? FALLBACKS[1];
          const icon = tintedIcon(iconIndex, iconAccent, iconSecond);

          if (icon) {
            const iconSize = transform.size * 0.84;
            context.save();
            context.globalAlpha = settle * (palette.light ? 0.84 : 0.82);
            context.translate(transform.cx, transform.cy);
            context.rotate(transform.rotation);
            context.drawImage(icon, -iconSize / 2, -iconSize / 2, iconSize, iconSize);
            context.restore();
          }
        }
      }

      for (let index = ripples.length - 1; index >= 0; index -= 1) {
        const ripple = ripples[index];
        if (!ripple) continue;
        const progress = rippleProgress(now - ripple.at);
        if (progress >= 1) {
          ripples.splice(index, 1);
          continue;
        }

        const radius = 18 + progress * shortest * 0.52;
        context.beginPath();
        context.arc(ripple.x, ripple.y, radius, 0, Math.PI * 2);
        context.strokeStyle = rgba(palette.accents[0] ?? FALLBACKS[0], (1 - progress) * 0.28);
        context.lineWidth = 1.4;
        context.stroke();

        context.beginPath();
        context.arc(ripple.x, ripple.y, radius * 0.62, 0, Math.PI * 2);
        context.strokeStyle = rgba(palette.accents[2] ?? FALLBACKS[2], (1 - progress) * 0.16);
        context.lineWidth = 1;
        context.stroke();
      }
    };

    const loop = (now: number) => {
      draw(now);
      frame = requestAnimationFrame(loop);
    };

    const start = () => {
      cancelAnimationFrame(frame);
      if (reduced || document.hidden) return;
      frame = requestAnimationFrame(loop);
    };

    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };

    const onPointerMove = (event: PointerEvent) => {
      hasPointer = true;
      pointer.targetX = event.clientX;
      pointer.targetY = event.clientY;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (reduced) return;
      ripples.push({ x: event.clientX, y: event.clientY, at: performance.now() });
      if (ripples.length > 4) ripples.shift();
    };

    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        startedAt = performance.now();
        start();
      }
    };

    const onMotionPreference = () => {
      reduced = prefersReduced.matches;
      startedAt = performance.now();
      if (reduced) {
        stop();
        draw(startedAt);
      } else {
        start();
      }
    };

    const themeObserver = new MutationObserver(() => {
      palette = readPalette();
      tintCache.clear();
      if (reduced) draw(startedAt);
    });

    resize();
    preloadIcons();
    start();

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    prefersReduced.addEventListener("change", onMotionPreference);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => {
      stop();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("visibilitychange", onVisibility);
      prefersReduced.removeEventListener("change", onMotionPreference);
      themeObserver.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="living-canvas" aria-hidden="true" />;
}
