import * as React from "react";
import { cn } from "@/lib/utils";

/* ---------------------------------- Badge --------------------------------- */

type BadgeTone =
  | "neutral"
  | "primary"
  | "low"
  | "moderate"
  | "high"
  | "critical"
  | "warning";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "border-border bg-elevated text-muted",
  primary: "border-primary/40 bg-primary/10 text-primary",
  low: "border-low/40 bg-low/10 text-low",
  moderate: "border-moderate/40 bg-moderate/10 text-moderate",
  high: "border-high/40 bg-high/10 text-high",
  critical: "border-critical/40 bg-critical/10 text-critical",
  warning: "border-moderate/50 bg-moderate/10 text-moderate",
};

export function Badge({
  tone = "neutral",
  className,
  children,
  mono,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.06em] uppercase whitespace-nowrap",
        mono && "font-mono tracking-normal normal-case",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/* -------------------------------- Skeleton -------------------------------- */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden="true" />;
}

/* -------------------------------- Progress -------------------------------- */

export function Progress({
  value,
  color = "#22D3EE",
  className,
  height = 6,
  label,
}: {
  value: number;
  color?: string;
  className?: string;
  height?: number;
  label?: string;
}) {
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn("w-full overflow-hidden rounded-full bg-elevated", className)}
      style={{ height }}
    >
      <div
        className="h-full rounded-full transition-[width] duration-700 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }}
      />
    </div>
  );
}

/* ------------------------------- Empty state ------------------------------ */

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-surface/50 px-6 py-10 text-center">
      {icon && <div className="text-faint">{icon}</div>}
      <p className="font-display text-sm font-semibold text-text">{title}</p>
      {description && <p className="max-w-sm text-xs text-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/* --------------------------------- Tooltip -------------------------------- */

export function InfoTip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex items-center align-middle">
      <button
        type="button"
        aria-label={`Info: ${text}`}
        className="ml-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-border text-[9px] font-bold text-faint hover:text-primary hover:border-primary/50 cursor-help"
      >
        i
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-1.5 w-56 -translate-x-1/2 rounded-md border border-border bg-elevated px-2.5 py-2 text-[11px] leading-snug font-normal normal-case tracking-normal text-muted opacity-0 shadow-xl transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}
