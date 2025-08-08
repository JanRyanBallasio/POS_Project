"use client";
import React, { useEffect, useState } from "react";

const breakpoints = [
  { name: "2xl", min: 1536 },
  { name: "xl", min: 1280 },
  { name: "lg", min: 1024 },
  { name: "md", min: 768 },
  { name: "sm", min: 640 },
  { name: "xs", min: 0 },
];

function getBreakpoint(width: number) {
  const bp = breakpoints.find(b => width >= b.min) || breakpoints[breakpoints.length - 1];
  return `${bp.name}:${bp.min}`;
}

export default function BreakpointIndicator() {
  const [breakpoint, setBreakpoint] = useState<string | null>(null);

  useEffect(() => {
    const updateBreakpoint = () => setBreakpoint(getBreakpoint(window.innerWidth));
    updateBreakpoint();
    window.addEventListener("resize", updateBreakpoint);
    return () => window.removeEventListener("resize", updateBreakpoint);
  }, []);

  if (!breakpoint) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: 8,
        bottom: 8,
        zIndex: 9999,
        background: "#222",
        color: "#fff",
        padding: "4px 12px",
        borderRadius: 6,
        fontSize: 14,
        opacity: 0.7,
        pointerEvents: "none",
      }}
    >
      {breakpoint}
    </div>
  );
}