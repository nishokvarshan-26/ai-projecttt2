"use client";

import { useMemo, useState } from "react";
import { BellRing, CheckCheck } from "lucide-react";
import { useApp } from "@/context/app-context";
import { PageHeader } from "@/components/common/page-header";
import { AlertCard } from "@/components/alerts/alert-card";
import { MetricCard } from "@/components/common/metric-card";
import { Button } from "@/components/ui/controls";
import { EmptyState } from "@/components/ui/feedback";
import type { RiskLevel } from "@/lib/types";

type Filter = "ALL" | RiskLevel | "UNACK";

export default function AlertsPage() {
  const { alerts, acknowledgeAlert, reviewAlert } = useApp();
  const [filter, setFilter] = useState<Filter>("ALL");

  const counts = useMemo(
    () => ({
      critical: alerts.filter((a) => a.severity === "CRITICAL").length,
      high: alerts.filter((a) => a.severity === "HIGH").length,
      moderate: alerts.filter((a) => a.severity === "MODERATE").length,
      low: alerts.filter((a) => a.severity === "LOW").length,
      unack: alerts.filter((a) => !a.acknowledged).length,
    }),
    [alerts]
  );

  const filtered = alerts.filter((a) => {
    if (filter === "ALL") return true;
    if (filter === "UNACK") return !a.acknowledged;
    return a.severity === filter;
  });

  const FILTERS: Array<{ id: Filter; label: string }> = [
    { id: "ALL", label: `All (${alerts.length})` },
    { id: "UNACK", label: `Unacknowledged (${counts.unack})` },
    { id: "CRITICAL", label: `Critical (${counts.critical})` },
    { id: "HIGH", label: `High (${counts.high})` },
    { id: "MODERATE", label: `Moderate (${counts.moderate})` },
    { id: "LOW", label: `Low (${counts.low})` },
  ];

  return (
    <div>
      <PageHeader
        title="Early Warning Center"
        subtitle="Prototype trend- and scenario-triggered notifications. These are not official emergency warnings."
        dataStatus="DEMO"
        meta={<span className="font-mono">Alert engine · operational (simulated)</span>}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => alerts.forEach((a) => acknowledgeAlert(a.id))}
            disabled={counts.unack === 0}
          >
            <CheckCheck className="h-3.5 w-3.5" aria-hidden /> Acknowledge all
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard icon={<BellRing className="h-3.5 w-3.5" />} label="Critical" value={counts.critical} sublabel="Require immediate review" accent="#EF4444" />
        <MetricCard icon={<BellRing className="h-3.5 w-3.5" />} label="High" value={counts.high} sublabel="Elevated trend" accent="#F97316" />
        <MetricCard icon={<BellRing className="h-3.5 w-3.5" />} label="Moderate / Low" value={counts.moderate + counts.low} sublabel="Situational awareness" accent="#EAB308" />
        <MetricCard icon={<CheckCheck className="h-3.5 w-3.5" />} label="Unacknowledged" value={counts.unack} sublabel="Awaiting operator action" accent="#22D3EE" />
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            aria-pressed={filter === f.id}
            className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f.id
                ? "border-primary/60 bg-primary/10 text-primary"
                : "border-border bg-surface text-muted hover:text-text"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-3 space-y-3">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<BellRing className="h-6 w-6" aria-hidden />}
            title="No alerts in this view"
            description="Try a different filter — or enjoy the quiet while it lasts."
          />
        ) : (
          filtered.map((a) => (
            <AlertCard key={a.id} alert={a} onAcknowledge={acknowledgeAlert} onReview={reviewAlert} />
          ))
        )}
      </div>
    </div>
  );
}
