import { LivingBackground } from "@/components/site/LivingBackground";

/**
 * Ambient background shell for the public site.
 *
 * `LivingBackground` paints the morphing industry silhouettes; the grid and
 * grain stay as a flat overlay so the page keeps its technical texture. The
 * whole layer is decorative and inert to pointer events.
 */
export function AmbientBackground() {
  return (
    <div className="ambient-root" aria-hidden="true">
      <LivingBackground />
      <div className="field-veil" />
      <div className="ambient-grid" />
    </div>
  );
}
