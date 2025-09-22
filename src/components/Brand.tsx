// src/components/Brand.tsx
"use client";

import Image from "next/image";
import * as React from "react";

function useIsDark() {
  const [isDark, setIsDark] = React.useState(false);
  React.useEffect(() => {
    const el = document.documentElement;
    const update = () => setIsDark(el.classList.contains("dark"));
    update();
    const obs = new MutationObserver(update);
    obs.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

export default function Brand() {
  const isDark = useIsDark();

  // Keep same asset; switch here later if you add a light/dark variant.
  const src = isDark ? "/brand/xbay.png" : "/brand/xbay.png";

  return (
    <div className="flex items-center gap-3.5">
      <Image
        src={src}
        alt="XBay logo"
        width={40}   // was 36 — slightly larger
        height={40}
        priority
        className="select-none"
      />
      <div className="leading-tight">
        {/* bigger product name */}
        <div className="font-semibold tracking-tight text-[18px] sm:text-[20px]">
          XBay
        </div>
        {/* bigger tagline */}
        <div className="text-[13px] sm:text-[14px] text-[var(--muted)] -mt-0.5">
          Make complex healthcare data simple.
        </div>
      </div>
    </div>
  );
}
