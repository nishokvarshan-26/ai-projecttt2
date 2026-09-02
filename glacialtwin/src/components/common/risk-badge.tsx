import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/lib/types";
import { RISK_COLORS } from "@/lib/config";
import {
  CircleDot,
  TriangleAlert,
  OctagonAlert,
  ShieldCheck,
} from "lucide-react";

const ICONS: Record<RiskLevel, React.ReactNode> = {
  LOW: <ShieldCheck className="h-3 w-3" aria-hidden />,
  MODERATE: <CircleDot className="h-3 w-3" aria-hidden />,
  HIGH: <TriangleAlert className="h-3 w-3" aria-hidden />,
  CRITICAL: <OctagonAlert className="h-3 w-3" aria-hidden />,
};

export function RiskBadge({
  level,
  score,
  size = "md",
  className,
}: {
  level: RiskLevel;
  score?: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const color = RISK_COLORS[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border font-semibold uppercase tracking-[0.08em]",
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-[11px]",
        className
      )}
      style={{
        color,
        borderColor: `${color}55`,
        background: `${color}14`,
      }}
    >
      {ICONS[level]}
      {level}
      {score !== undefined && (
        <span className="font-mono font-bold" style={{ color }}>
          {Math.round(score)}
        </span>
      )}
    </span>
  );
}

export function TrendArrow({
  direction,
  delta,
}: {
  direction: "UP" | "DOWN" | "STABLE";
  delta?: number;
}) {
  const up = direction === "UP";
  const stable = direction === "STABLE";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 font-mono text-xs",
        stable ? "text-muted" : up ? "text-high" : "text-low"
      )}
      aria-label={stable ? "Trend stable" : up ? "Trend increasing" : "Trend decreasing"}
    >
      {stable ? "→" : up ? "↑" : "↓"}
      {delta !== undefined && !stable && (
        <span>
          {delta > 0 ? "+" : ""}
          {delta}%
        </span>
      )}
    </span>
  );
}
