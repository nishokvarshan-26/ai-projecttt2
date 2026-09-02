"use client";

import { useState } from "react";
import { PIPELINE_STEPS } from "@/lib/config";
import {
  Satellite,
  WandSparkles,
  Droplets,
  Spline,
  Ruler,
  GitCompareArrows,
  RefreshCcw,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/feedback";

const ICONS = [Satellite, WandSparkles, Droplets, Spline, Ruler, GitCompareArrows, RefreshCcw];

/** Interactive lake-detection pipeline visualisation. */
export function PipelineFlow({ vertical = false }: { vertical?: boolean }) {
  const [activeIdx, setActiveIdx] = useState(PIPELINE_STEPS.length - 1);

  return (
    <div>
      <ol
        className={cn(
          "flex gap-0",
          vertical ? "flex-col" : "flex-row items-stretch overflow-x-auto pb-1"
        )}
        aria-label="Lake detection pipeline"
      >
        {PIPELINE_STEPS.map((step, i) => {
          const Icon = ICONS[i % ICONS.length];
          const active = i === activeIdx;
          return (
            <li key={step.id} className={cn("flex", vertical ? "flex-col" : "items-center")}>
              <button
                onClick={() => setActiveIdx(i)}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "group flex min-w-[104px] cursor-pointer flex-col items-center gap-1.5 rounded-lg border px-3 py-2.5 text-center transition-all",
                  active
                    ? "border-primary/60 bg-primary/10 shadow-[0_0_16px_rgba(34,211,238,0.15)]"
                    : "border-border bg-surface hover:border-border-strong"
                )}
              >
                <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted")} aria-hidden />
                <span
                  className={cn(
                    "text-[10px] leading-tight font-semibold tracking-wide uppercase",
                    active ? "text-primary" : "text-muted group-hover:text-text"
                  )}
                >
                  {step.label}
                </span>
                <span className="font-mono text-[9px] text-faint">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </button>
              {i < PIPELINE_STEPS.length - 1 && (
                <ChevronRight
                  className={cn("mx-0.5 shrink-0 text-faint", vertical ? "rotate-90 self-center" : "")}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-3 rounded-lg border border-border bg-elevated px-3.5 py-3">
        <p className="mb-1 flex items-center gap-2 font-display text-xs font-semibold tracking-wide text-text uppercase">
          <Badge tone="primary">{String(activeIdx + 1).padStart(2, "0")}</Badge>
          {PIPELINE_STEPS[activeIdx].label}
        </p>
        <p className="text-xs leading-relaxed text-muted">{PIPELINE_STEPS[activeIdx].detail}</p>
      </div>
    </div>
  );
}
