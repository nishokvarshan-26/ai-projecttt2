"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { RiskContribution } from "@/lib/types";
import { Badge } from "@/components/ui/feedback";

/**
 * SHAP-style horizontal contribution chart.
 * Values shown are outputs of the prototype heuristic engine — clearly
 * labelled DEMO MODEL OUTPUT wherever rendered.
 */
export function ShapChart({
  contributions,
  showPercent = true,
}: {
  contributions: RiskContribution[];
  showPercent?: boolean;
}) {
  const reduce = useReducedMotion();
  const max = Math.max(...contributions.map((c) => c.sharePct), 1);

  return (
    <div>
      <div className="space-y-2.5">
        {contributions.map((c, i) => (
          <div key={c.feature}>
            <div className="mb-1 flex items-baseline justify-between text-xs">
              <span className="text-muted">{c.feature}</span>
              <span className="font-mono text-text">
                {showPercent ? `${c.sharePct.toFixed(1)}%` : `+${c.points.toFixed(1)} pts`}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-elevated">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: "linear-gradient(90deg, #0E7490, #22D3EE)",
                  boxShadow: "0 0 10px rgba(34,211,238,0.35)",
                }}
                initial={reduce ? false : { width: 0 }}
                animate={{ width: `${(c.sharePct / max) * 100}%` }}
                transition={{ duration: 0.7, delay: i * 0.07, ease: "easeOut" }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Badge tone="moderate">Demo model output</Badge>
        <span className="text-[11px] text-faint">
          Prototype weights — not validated SHAP values from a trained model.
        </span>
      </div>
    </div>
  );
}
