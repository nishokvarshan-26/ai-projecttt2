"use client";

import { CountUp } from "./count-up";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function MetricCard({
  icon,
  label,
  value,
  digits = 0,
  suffix,
  sublabel,
  delta,
  deltaDirection = "up",
  footer,
  accent = "#22D3EE",
  badge,
  className,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  digits?: number;
  suffix?: string;
  sublabel?: string;
  delta?: string;
  deltaDirection?: "up" | "down" | "flat";
  footer?: ReactNode;
  accent?: string;
  badge?: ReactNode;
  className?: string;
}) {
  return (
    <Card
      elevated
      className={cn(
        "group relative overflow-hidden p-4 hover:border-border-strong",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-70"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}66, transparent)` }}
      />
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-muted">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-md border"
            style={{ borderColor: `${accent}44`, background: `${accent}12`, color: accent }}
          >
            {icon}
          </span>
          <span className="text-[11px] font-semibold tracking-[0.1em] uppercase">
            {label}
          </span>
        </div>
        {badge}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <CountUp
          value={value}
          digits={digits}
          suffix={suffix}
          className="font-display text-[30px] leading-none font-bold tracking-tight text-text"
        />
      </div>

      <div className="mt-1.5 flex items-center gap-2 text-xs">
        {sublabel && <span className="text-muted">{sublabel}</span>}
        {delta && (
          <span
            className={cn(
              "font-mono text-[11px]",
              deltaDirection === "up" && "text-high",
              deltaDirection === "down" && "text-low",
              deltaDirection === "flat" && "text-muted"
            )}
          >
            {deltaDirection === "up" ? "↑" : deltaDirection === "down" ? "↓" : "→"} {delta}
          </span>
        )}
      </div>
      {footer && <div className="mt-3">{footer}</div>}
    </Card>
  );
}
