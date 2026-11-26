/**
 * The eight industry silhouettes that morph into each other behind the site.
 *
 * Each silhouette is authored as a small polygon in a 0–1 box, then resampled
 * to a fixed 48-point ring. Equal point counts are what makes one shape
 * interpolate into the next without tearing, and the rings are normalised
 * around their centre so a glyph can be drawn at any size.
 *
 * The mobile app mirrors this list in `lib/widgets/background_field.dart`.
 */

export interface Point {
  x: number;
  y: number;
}

export const GLYPH_NAMES = [
  "database",
  "document",
  "monitor",
  "phone",
  "cloud",
  "shield",
  "chip",
  "code",
] as const;

export type GlyphName = (typeof GLYPH_NAMES)[number];

export const RING_POINTS = 48;

function database(): [number, number][] {
  const points: [number, number][] = [];
  const cx = 0.5;
  const rx = 0.32;
  const ry = 0.1;
  const top = 0.26;
  const bottom = 0.74;

  // Upper half of the top disc, left to right.
  for (let i = 0; i <= 10; i += 1) {
    const angle = Math.PI - (Math.PI * i) / 10;
    points.push([cx + rx * Math.cos(angle), top - ry * Math.sin(angle)]);
  }
  // Right wall.
  points.push([cx + rx, bottom]);
  // Lower half of the bottom disc, right to left.
  for (let i = 0; i <= 10; i += 1) {
    const angle = (Math.PI * i) / 10;
    points.push([cx + rx * Math.cos(angle), bottom + ry * Math.sin(angle)]);
  }
  return points;
}

function document(): [number, number][] {
  return [
    [0.22, 0.12],
    [0.64, 0.12],
    [0.66, 0.14],
    [0.66, 0.3],
    [0.8, 0.3],
    [0.8, 0.88],
    [0.22, 0.88],
  ];
}

function monitor(): [number, number][] {
  return [
    [0.1, 0.18],
    [0.9, 0.18],
    [0.9, 0.64],
    [0.58, 0.64],
    [0.58, 0.76],
    [0.68, 0.76],
    [0.68, 0.82],
    [0.32, 0.82],
    [0.32, 0.76],
    [0.42, 0.76],
    [0.42, 0.64],
    [0.1, 0.64],
  ];
}

function phone(): [number, number][] {
  return [
    [0.32, 0.08],
    [0.42, 0.08],
    [0.42, 0.14],
    [0.58, 0.14],
    [0.58, 0.08],
    [0.68, 0.08],
    [0.72, 0.12],
    [0.72, 0.88],
    [0.68, 0.92],
    [0.32, 0.92],
    [0.28, 0.88],
    [0.28, 0.12],
  ];
}

function cloud(): [number, number][] {
  return Array.from({ length: 20 }, (_, index) => {
    const angle = (index / 20) * Math.PI * 2;
    const radius = 0.34 + 0.055 * Math.sin(3 * angle) + 0.03 * Math.sin(5 * angle + 1.2);
    return [
      0.5 + Math.cos(angle) * radius * 1.3,
      0.54 + Math.sin(angle) * radius * 0.82,
    ] as [number, number];
  });
}

function shield(): [number, number][] {
  return [
    [0.5, 0.1],
    [0.84, 0.22],
    [0.8, 0.56],
    [0.5, 0.9],
    [0.2, 0.56],
    [0.16, 0.22],
  ];
}

function chip(): [number, number][] {
  return [
    [0.3, 0.2],
    [0.4, 0.2],
    [0.4, 0.12],
    [0.48, 0.12],
    [0.48, 0.2],
    [0.56, 0.2],
    [0.56, 0.12],
    [0.64, 0.12],
    [0.64, 0.2],
    [0.74, 0.2],
    [0.74, 0.32],
    [0.82, 0.32],
    [0.82, 0.4],
    [0.74, 0.4],
    [0.74, 0.48],
    [0.82, 0.48],
    [0.82, 0.56],
    [0.74, 0.56],
    [0.74, 0.68],
    [0.64, 0.68],
    [0.64, 0.76],
    [0.56, 0.76],
    [0.56, 0.68],
    [0.48, 0.68],
    [0.48, 0.76],
    [0.4, 0.76],
    [0.4, 0.68],
    [0.3, 0.68],
    [0.3, 0.56],
    [0.22, 0.56],
    [0.22, 0.48],
    [0.3, 0.48],
    [0.3, 0.4],
    [0.22, 0.4],
    [0.22, 0.32],
    [0.3, 0.32],
  ];
}

function code(): [number, number][] {
  return [
    [0.24, 0.2],
    [0.38, 0.2],
    [0.68, 0.5],
    [0.38, 0.8],
    [0.24, 0.8],
    [0.54, 0.5],
  ];
}

const RAW: Record<GlyphName, [number, number][]> = {
  database: database(),
  document: document(),
  monitor: monitor(),
  phone: phone(),
  cloud: cloud(),
  shield: shield(),
  chip: chip(),
  code: code(),
};

/** Resamples a closed polygon to exactly [count] points, evenly by length. */
export function resamplePolygon(points: [number, number][], count = RING_POINTS): Point[] {
  const ring = [...points, points[0]];
  const lengths: number[] = [];
  let total = 0;

  for (let i = 0; i < ring.length - 1; i += 1) {
    const a = ring[i];
    const b = ring[i + 1];
    if (!a || !b) continue;
    const [ax, ay] = a;
    const [bx, by] = b;
    const length = Math.hypot(bx - ax, by - ay);
    lengths.push(length);
    total += length;
  }

  const result: Point[] = [];
  for (let i = 0; i < count; i += 1) {
    let target = (total * i) / count;
    let segment = 0;
    let segmentLength = lengths[0] ?? 0;
    while (segment < lengths.length - 1 && target > segmentLength) {
      target -= segmentLength;
      segment += 1;
      segmentLength = lengths[segment] ?? 0;
    }
    const a = ring[segment];
    const b = ring[segment + 1];
    if (!a || !b) {
      result.push({ x: 0, y: 0 });
      continue;
    }
    const [ax, ay] = a;
    const [bx, by] = b;
    const t = segmentLength === 0 ? 0 : target / segmentLength;
    result.push({ x: ax + (bx - ax) * t, y: ay + (by - ay) * t });
  }

  return result;
}

/** Centres a ring and scales its longest side to 1, so size is set by the caller. */
export function normaliseRing(ring: Point[]): Point[] {
  const xs = ring.map((point) => point.x);
  const ys = ring.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const scale = Math.max(maxX - minX, maxY - minY) || 1;

  return ring.map((point) => ({
    x: (point.x - cx) / scale,
    y: (point.y - cy) / scale,
  }));
}

export const SHAPES: Record<GlyphName, Point[]> = Object.fromEntries(
  GLYPH_NAMES.map((name) => [name, normaliseRing(resamplePolygon(RAW[name]))]),
) as Record<GlyphName, Point[]>;

export const SHAPE_RINGS: Point[][] = GLYPH_NAMES.map((name) => SHAPES[name]);

/** Safe indexing for callers that carry a numeric shape index. */
export function ringAt(index: number): Point[] {
  return SHAPE_RINGS[index] ?? SHAPE_RINGS[0] ?? [];
}

/**
 * The real icon artwork for each element: Lucide outline SVGs vendored under
 * `public/icons/field` (ISC, see the LICENSE beside them). The morph still runs
 * on the equal-point rings above; when a shape settles its downloaded icon is
 * drawn in place, so the artwork is a real icon rather than a hand-made sketch.
 */
export const ICON_ASSETS: Record<GlyphName, string> = {
  database: "/icons/field/database.svg",
  document: "/icons/field/file-text.svg",
  monitor: "/icons/field/monitor.svg",
  phone: "/icons/field/smartphone.svg",
  cloud: "/icons/field/cloud.svg",
  shield: "/icons/field/shield.svg",
  chip: "/icons/field/cpu.svg",
  code: "/icons/field/code-xml.svg",
};

export function iconAssetAt(index: number): string | null {
  const name = GLYPH_NAMES[index];
  return name ? ICON_ASSETS[name] : null;
}

/** Accent pairs (indices into the theme palette) per element. */
export const ICON_TONES: Record<GlyphName, [number, number]> = {
  database: [0, 1],
  document: [1, 2],
  monitor: [2, 0],
  phone: [0, 3],
  cloud: [1, 2],
  shield: [3, 0],
  chip: [2, 1],
  code: [3, 1],
};

export function toneAt(index: number): [number, number] {
  const name = GLYPH_NAMES[index];
  return name ? ICON_TONES[name] : [0, 1];
}
