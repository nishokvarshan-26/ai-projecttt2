"use client";

import { RiskBadge } from "./risk-badge";
import { useCountUp } from "./count-up";
import type { RiskLevel } from "@/lib/types";
import { RISK_COLORS } from "@/lib/config";

/** Animated circular risk gauge. */
export function RiskRing({
  score,
  level,
  size = 168,
  label = "Risk score",
}: {
  score: number;
  level: RiskLevel;
  size?: number;
  label?: string;
}) {
  const animated = useCountUp(score, 1100);
  const color = RISK_COLORS[level];
  const stroke = size * 0.075;
  const r = (size - stroke * 2) / 2 - 6;
  const c = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, animated));

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label}: ${Math.round(score)} of 100, ${level}`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#16283f"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (pct / 100) * c}
          style={{ filter: `drop-shadow(0 0 8px ${color}66)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
        <span
          className="font-display text-[34px] leading-none font-bold tracking-tight"
          style={{ color }}
        >
          {Math.round(animated)}
        </span>
        <span className="font-mono text-[10px] text-faint">/ 100</span>
        <RiskBadge level={level} size="sm" />
      </div>
    </div>
  );
}
