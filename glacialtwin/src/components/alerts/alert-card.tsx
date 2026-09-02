"use client";

import { useState } from "react";
import Link from "next/link";
import type { AlertItem } from "@/lib/types";
import { RiskBadge } from "@/components/common/risk-badge";
import { Badge } from "@/components/ui/feedback";
import { Button } from "@/components/ui/controls";
import { formatDateTime, timeAgo } from "@/lib/utils";
import { CheckCheck, Eye, FileText, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function AlertCard({
  alert,
  onAcknowledge,
  onReview,
}: {
  alert: AlertItem;
  onAcknowledge: (id: string) => void;
  onReview: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article
      className={cn(
        "rounded-lg border bg-surface transition-colors",
        alert.severity === "CRITICAL" && !alert.acknowledged
          ? "border-critical/40 shadow-[0_0_20px_rgba(239,68,68,0.08)]"
          : "border-border"
      )}
      aria-label={`Alert: ${alert.title}`}
    >
      <div className="flex flex-wrap items-start gap-3 p-4">
        <RiskBadge level={alert.severity} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <Link
              href={`/digital-twin/${alert.lakeId}`}
              className="font-display text-sm font-semibold text-text hover:text-primary"
            >
              {alert.lakeName}
            </Link>
            <span className="font-mono text-[10px] text-faint">{timeAgo(alert.createdAt)}</span>
            {alert.acknowledged && <Badge tone="low">Acknowledged</Badge>}
            {alert.reviewed && <Badge tone="primary">Reviewed</Badge>}
          </div>
          <p className="mt-0.5 text-[13px] text-text/90">{alert.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">{alert.reason}</p>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px]">
            <Badge tone={alert.basis === "SCENARIO_EVALUATION" ? "high" : "moderate"}>
              {alert.basis === "SCENARIO_EVALUATION" ? "Scenario evaluation" : "Model trend"}
            </Badge>
            {alert.previousScore !== undefined && alert.currentScore !== undefined && (
              <span className="font-mono text-faint">
                {alert.previousScore}% → {alert.currentScore}%
              </span>
            )}
            <span className="font-mono text-faint">{formatDateTime(alert.createdAt)}</span>
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center gap-1.5 sm:w-auto sm:flex-col sm:items-end">
          {!alert.acknowledged && (
            <Button size="sm" variant="subtle" onClick={() => onAcknowledge(alert.id)}>
              <CheckCheck className="h-3.5 w-3.5" aria-hidden /> Acknowledge
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => onReview(alert.id)}>
            <Eye className="h-3.5 w-3.5" aria-hidden /> Mark reviewed
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setExpanded((e) => !e)}
            aria-expanded={expanded}
          >
            Details <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")} aria-hidden />
          </Button>
          <Link
            href={`/reports?lake=${alert.lakeId}`}
            className="inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-muted transition-colors hover:bg-elevated hover:text-text"
          >
            <FileText className="h-3.5 w-3.5" aria-hidden /> Report
          </Link>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border/60 bg-elevated/50 px-4 py-3 text-xs leading-relaxed text-muted">
          <p>
            <span className="font-semibold text-text">Basis:</span>{" "}
            {alert.basis === "SCENARIO_EVALUATION"
              ? "This alert was raised by evaluating a what-if scenario against the prototype risk model. It represents a simulated condition, not a measured event."
              : "This alert reflects the prototype model's trend over recent demo observations."}
          </p>
          <p className="mt-1.5">
            <span className="font-semibold text-text">Disclaimer:</span> GlacialTwin AI is a research
            prototype. This notification is not an official emergency warning.
          </p>
        </div>
      )}
    </article>
  );
}
