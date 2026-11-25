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
import {
  detailsAt,
  ringAt,
  toneAt,
  type IconDetail,
  type Point,
} from "@/lib/background/glyph-shapes";

/**
 * The site's living background.
 *
 * Industry silhouettes — database, document, monitor, phone, cloud, shield,
 * chip, code — drift and morph into each other continuously. Whenever a shape
 * settles, its colourful icon and detail artwork resolve inside the silhouette,
 * hold while the shape rests, and dissolve as the next morph begins. The field
 * leans toward the cursor and a click sends a ripple through it.
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

const WHITE: Rgb = { r: 255, g: 255, b: 255 };

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

/**
 * Draws the settled element as a colourful icon: gradient fill, bold outline,
 * and its interior detail strokes (bands, text lines, screen, tick, pins,
 * chevrons). Details are drawn rigidly inside the icon so they stay legible,
 * unlike the liquid silhouette behind them.
 */
function drawIconLayer(
  context: CanvasRenderingContext2D,
  ring: Point[],
  details: IconDetail[],
  accent: Rgb,
  second: Rgb,
  cx: number,
  cy: number,
  size: number,
  rotation: number,
  opacity: number,
): void {
  if (opacity <= 0.01) return;

  const glow = context.createRadialGradient(cx, cy, 0, cx, cy, size * 0.66);
  glow.addColorStop(0, rgba(accent, 0.13 * opacity));
  glow.addColorStop(1, rgba(accent, 0));
  context.fillStyle = glow;
  context.beginPath();
  context.arc(cx, cy, size * 0.66, 0, Math.PI * 2);
  context.fill();

  context.save();
  context.translate(cx, cy);
  context.rotate(rotation);
  context.scale(size, size);

  const gradient = context.createLinearGradient(-0.5, -0.5, 0.5, 0.5);
  gradient.addColorStop(0, rgba(accent, 0.42 * opacity));
  gradient.addColorStop(1, rgba(second, 0.32 * opacity));

  traceSmoothRing(context, ring);
  context.fillStyle = gradient;
  context.fill();
  context.strokeStyle = rgba(accent, 0.95 * opacity);
  context.lineWidth = 0.02;
  context.lineJoin = "round";
  context.lineCap = "round";
  context.stroke();

  // Bright line work is what makes the silhouette read as an icon even when
  // only part of it shows between the content panels.
  context.strokeStyle = rgba(WHITE, 0.72 * opacity);
  context.lineWidth = 0.03;
  for (const detail of details) {
    context.beginPath();
    if (detail.kind === "polyline") {
      const [first, ...rest] = detail.points;
      if (!first) continue;
      context.moveTo(first[0], first[1]);
      for (const [x, y] of rest) context.lineTo(x, y);
    } else if (detail.kind === "rect") {
      context.rect(detail.x, detail.y, detail.w, detail.h);
    } else {
      context.ellipse(detail.cx, detail.cy, detail.rx, detail.ry, 0, 0, Math.PI * 2);
    }
    context.stroke();
  }

  context.restore();
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
      const fillAlpha = palette.light ? 0.06 : 0.08;
      const strokeAlpha = palette.light ? 0.11 : 0.16;

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
        const fill = fillAlpha * (1 + proximity * 0.9);
        const stroke = strokeAlpha * (1 + proximity * 1.2);

        const bloom = context.createRadialGradient(
          transform.cx,
          transform.cy,
          0,
          transform.cx,
          transform.cy,
          transform.size * 0.75,
        );
        bloom.addColorStop(
          0,
          rgba(accent, (palette.light ? 0.05 : 0.075) * (1 + proximity * 0.7)),
        );
        bloom.addColorStop(1, rgba(accent, 0));
        context.fillStyle = bloom;
        context.beginPath();
        context.arc(transform.cx, transform.cy, transform.size * 0.75, 0, Math.PI * 2);
        context.fill();

        const gradient = context.createLinearGradient(
          transform.cx - transform.size / 2,
          transform.cy - transform.size / 2,
          transform.cx + transform.size / 2,
          transform.cy + transform.size / 2,
        );
        gradient.addColorStop(0, rgba(accent, fill));
        gradient.addColorStop(1, rgba(second, fill * 0.5));

        traceSmoothRing(context, points);
        context.fillStyle = gradient;
        context.fill();
        context.strokeStyle = rgba(accent, stroke);
        context.lineWidth = 1.15;
        context.stroke();

        // Once the shape has settled, its recognisable icon resolves in place
        // and fades again as the next morph starts.
        const settle = iconAlpha(elapsed, glyph.phase);
        if (settle > 0.01) {
          const iconIndex = iconShapeIndex(state);
          const [toneA, toneB] = toneAt(iconIndex);
          const iconAccent = palette.accents[toneA % palette.accents.length] ?? FALLBACKS[0];
          const iconSecond = palette.accents[toneB % palette.accents.length] ?? FALLBACKS[1];

          drawIconLayer(
            context,
            ringAt(iconIndex),
            detailsAt(iconIndex),
            iconAccent,
            iconSecond,
            transform.cx,
            transform.cy,
            transform.size,
            transform.rotation,
            settle,
          );
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
      if (reduced) draw(startedAt);
    });

    resize();
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
