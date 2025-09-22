// src/components/Logo.tsx
"use client";

import * as React from "react";

type Props = React.SVGProps<SVGSVGElement> & {
  topColor?: string;     // top “X” color
  bottomColor?: string;  // bottom wave/V color
  glow?: boolean;        // optional soft halo
};

/**
 * XBay logo (tight-cropped, background-free).
 * - Cropped viewBox removes the “big margins”.
 * - display:block removes inline-SVG baseline gap.
 */
export default function Logo({
  topColor = "#35A8FF",
  bottomColor = "#0E4F85",
  glow = false,
  className,
  style,
  ...rest
}: Props) {
  const glowId = React.useId();
  const maskId = React.useId();

  return (
    <svg
      // TIGHT bounds around the drawing
      viewBox="12 12 104 108"
      role="img"
      aria-label="XBay logo"
      fill="none"
      className={className}
      style={{ display: "block", ...style }}
      {...rest}
    >
      <defs>
        {/* Soft glow (optional) */}
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="
              0 0 0 0 0.21
              0 0 0 0 0.63
              0 0 0 0 1
              0 0 0 0.55 0"
          />
        </filter>

        {/* Mask to shape the stylized 'X' and subtract the lower notch */}
        <mask id={maskId} maskUnits="userSpaceOnUse" x="12" y="12" width="104" height="108">
          {/* Start transparent */}
          <rect x="12" y="12" width="104" height="108" fill="black" />
          {/* Two rounded capsules forming the X */}
          <g transform="translate(0,-6)">
            <rect
              x="28" y="26" width="72" height="20" rx="10"
              fill="white" transform="rotate(45 64 36)"
            />
            <rect
              x="28" y="26" width="72" height="20" rx="10"
              fill="white" transform="rotate(-45 64 36)"
            />
          </g>
          {/* Lower notch so the X sweeps into the bay */}
          <path
            d="
              M34 66
              C 52 60, 76 60, 94 66
              C 86 68, 80 74, 75 80
              C 69 88, 59 88, 53 80
              C 48 74, 42 68, 34 66 Z
            "
            fill="black"
          />
        </mask>
      </defs>

      {/* --- TOP: 'X' (with optional glow) --- */}
      {glow && (
        <rect
          x="12" y="12" width="104" height="108"
          mask={`url(#${maskId})`}
          fill={topColor}
          filter={`url(#${glowId})`}
        />
      )}
      <rect
        x="12" y="12" width="104" height="108"
        mask={`url(#${maskId})`}
        fill={topColor}
      />

      {/* --- BOTTOM: bay / wave + supporting V --- */}
      <g
        stroke={bottomColor}
        strokeWidth={16}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Wave band */}
        <path d="M20 96 C 42 72, 86 72, 108 96" />
        {/* Central supporting V */}
        <path d="M48 112 L64 88 L80 112" />
      </g>
    </svg>
  );
}
