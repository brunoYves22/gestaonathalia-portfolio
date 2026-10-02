import { ReactNode, memo } from "react";

/**
 * Lightweight static background for internal pages.
 * Pure CSS — no Canvas / Three.js, no SVG noise — for maximum performance.
 */
export const AppBackground = memo(function AppBackground({
  children,
}: {
  children?: ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full bg-black">
      {/* Soft dark gradient + vignette in a single layer (cheap, GPU-friendly) */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse at top, #1a1a1a 0%, #0a0a0a 45%, #000000 100%)",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
});

export default AppBackground;
