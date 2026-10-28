"use client";

import { useReducedMotion } from "motion/react";
import {
  Boxes,
  Code2,
  Cpu,
  Database,
  LayoutGrid,
  Server,
  Smartphone,
  Wrench,
  type LucideIcon,
} from "lucide-react";

/**
 * Ambient background layer for the public site.
 *
 * A subtle, always-animating backdrop whose motifs echo the owner's work
 * domains (web, mobile, data, industrial). Very low opacity, slow motion,
 * masked to the centre, non-interactive. Honours prefers-reduced-motion by
 * falling back to a static arrangement. Mounted once in the public layout.
 */

interface Glyph {
  Icon: LucideIcon;
  x: number; // percent
  y: number; // percent
  size: number; // px
  duration: number; // seconds
  delay: number; // seconds
  rotate: number; // degrees
  tone: "teal" | "violet" | "cyan";
}

const GLYPHS: Glyph[] = [
  { Icon: Code2, x: 8, y: 14, size: 44, duration: 78, delay: 0, rotate: 12, tone: "teal" },
  { Icon: LayoutGrid, x: 86, y: 10, size: 40, duration: 92, delay: 6, rotate: -8, tone: "cyan" },
  { Icon: Smartphone, x: 74, y: 78, size: 36, duration: 84, delay: 12, rotate: 6, tone: "violet" },
  { Icon: Database, x: 14, y: 72, size: 42, duration: 70, delay: 4, rotate: -10, tone: "teal" },
  { Icon: Server, x: 46, y: 86, size: 34, duration: 96, delay: 18, rotate: 4, tone: "cyan" },
  { Icon: Cpu, x: 90, y: 46, size: 46, duration: 88, delay: 9, rotate: -6, tone: "violet" },
  { Icon: Wrench, x: 30, y: 38, size: 32, duration: 74, delay: 15, rotate: 8, tone: "teal" },
  { Icon: Boxes, x: 58, y: 22, size: 38, duration: 82, delay: 21, rotate: -4, tone: "cyan" },
];

const TONE_CLASS: Record<Glyph["tone"], string> = {
  teal: "ambient-glyph",
  violet: "ambient-glyph ambient-glyph--violet",
  cyan: "ambient-glyph ambient-glyph--cyan",
};

export function AmbientBackground() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="ambient-root" aria-hidden="true">
      <div className="ambient-aurora" />
      <div className="ambient-grid" />
      {GLYPHS.map((glyph, index) => {
        const Icon = glyph.Icon;
        return (
          <span
            key={index}
            className={TONE_CLASS[glyph.tone]}
            style={{
              left: `${glyph.x}%`,
              top: `${glyph.y}%`,
              width: glyph.size,
              height: glyph.size,
              animationDuration: reduceMotion ? "0s" : `${glyph.duration}s`,
              animationDelay: reduceMotion ? "0s" : `${glyph.delay}s`,
              animationIterationCount: reduceMotion ? 1 : "infinite",
              transform: `rotate(${glyph.rotate}deg)`,
            }}
          >
            <Icon
              size={glyph.size}
              strokeWidth={1.25}
              aria-hidden="true"
              focusable={false}
            />
          </span>
        );
      })}
    </div>
  );
}