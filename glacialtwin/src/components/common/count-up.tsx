"use client";

import { useEffect, useRef, useState } from "react";
import { formatNum, prefersReducedMotion } from "@/lib/utils";

/** Animated number counter that respects prefers-reduced-motion. */
export function useCountUp(target: number, durationMs = 900) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setValue(target);
      return;
    }
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(from + (target - from) * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, durationMs]);

  return value;
}

export function CountUp({
  value,
  digits = 0,
  suffix,
  prefix,
  className,
}: {
  value: number;
  digits?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}) {
  const v = useCountUp(value);
  return (
    <span className={className}>
      {prefix}
      {formatNum(v, digits)}
      {suffix}
    </span>
  );
}
