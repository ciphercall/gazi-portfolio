/**
 * Shared gradient strings.
 *
 * Every colour reference is a CSS variable from globals.css, so these values
 * follow the theme (`.light` on <html>) without a second definition. Components
 * import them instead of re-typing gradient stops, which is what keeps the
 * aurora language consistent across the site.
 */

export const AURORA_SWEEP =
  "linear-gradient(100deg, var(--c-teal), var(--c-cyan) 42%, var(--c-violet) 88%)";

export const AURORA_LINE =
  "linear-gradient(90deg, transparent, color-mix(in oklab, var(--c-teal) 70%, transparent), color-mix(in oklab, var(--c-violet) 60%, transparent), transparent)";

export const AURORA_TINT =
  "linear-gradient(140deg, color-mix(in oklab, var(--c-teal) 16%, transparent), transparent 55%, color-mix(in oklab, var(--c-violet) 16%, transparent))";

export const AURORA_VIGNETTE =
  "radial-gradient(120% 100% at 22% 0%, transparent 40%, color-mix(in oklab, var(--c-canvas) 55%, transparent))";

/** Deterministic 32-bit hash — the same seed always paints the same artwork. */
export function seedHash(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

const PALETTES: readonly (readonly [string, string])[] = [
  ["var(--c-teal)", "var(--c-cyan)"],
  ["var(--c-cyan)", "var(--c-violet)"],
  ["var(--c-violet)", "var(--c-rose)"],
  ["var(--c-teal)", "var(--c-violet)"],
  ["var(--c-rose)", "var(--c-cyan)"],
  ["var(--c-teal)", "var(--c-rose)"],
];

const ANGLES: readonly number[] = [125, 145, 165, 200, 215, 245, 300];

export interface AuroraBackdrop {
  backgroundImage: string;
  angle: number;
  from: string;
  to: string;
}

/** A stable gradient plus a radial highlight, chosen from the seed. */
export function auroraBackdrop(seed: string): AuroraBackdrop {
  const hash = seedHash(seed);
  const pair = PALETTES[hash % PALETTES.length] ?? PALETTES[0]!;
  const angle = ANGLES[hash % ANGLES.length] ?? 145;
  const from = pair[0];
  const to = pair[1];
  const glow = (hash >>> 8) % 100;

  return {
    angle,
    from,
    to,
    backgroundImage: [
      `radial-gradient(60% 70% at ${glow}% 12%, color-mix(in oklab, ${from} 55%, transparent), transparent 68%)`,
      `linear-gradient(${angle}deg, color-mix(in oklab, ${from} 42%, var(--c-canvas-2)), color-mix(in oklab, ${to} 38%, var(--c-canvas-2)) 62%, var(--c-canvas-2))`,
    ].join(", "),
  };
}
