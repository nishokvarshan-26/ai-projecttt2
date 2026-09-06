"use client";

import { ArrowRight, ServerCog, Satellite, RadioTower, Gauge, Activity as ActivityIcon } from "lucide-react";
import type { AlertItem } from "@/lib/types";
import type { TwinState } from "@/lib/twin-types";
import { featureDeltas } from "@/lib/twin-engine";
import { RISK_COLORS } from "@/lib/config";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { RiskRing } from "@/components/common/risk-ring";
import { RiskBadge } from "@/components/common/risk-badge";
import { DataStatusBadge } from "@/components/common/data-status-badge";
import { Badge, EmptyState } from "@/components/ui/feedback";
import { ButtonLink } from "@/components/ui/controls";
import { ShapChart } from "@/components/charts/shap-chart";
import { AlertCard } from "@/components/alerts/alert-card";

const SYNC_ITEMS = [
  { label: "Sensor network", icon: <RadioTower className="h-3 w-3" aria-hidden /> },
  { label: "Slope monitoring", icon: <Gauge className="h-3 w-3" aria-hidden /> },
  { label: "Seismic network", icon: <ActivityIcon className="h-3 w-3" aria-hidden /> },
  { label: "Satellite feed", icon: <Satellite className="h-3 w-3" aria-hidden /> },
  { label: "Twin AI engine", icon: <ServerCog className="h-3 w-3" aria-hidden /> },
];

export function TwinRiskPanel({
  twin,
  twinBaseline,
  scenarioActive,
  alerts,
  onAcknowledge,
  onReview,
}: {
  twin: TwinState;
  twinBaseline: TwinState;
  scenarioActive: boolean;
  alerts: AlertItem[];
  onAcknowledge: (id: string) => void;
  onReview: (id: string) => void;
}) {
  const delta = twin.riskDelta;
  const deltas = featureDeltas(twin.contributions, twinBaseline.contributions).sort(
    (a, b) => Math.abs(b.delta) - Math.abs(a.delta)
  );

  return (
    <div className="space-y-4">
      <Card elevated className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.1em] text-faint uppercase">AI Risk Intelligence</p>
            <h2 className="font-display text-lg font-bold text-text">Live Twin Risk</h2>
          </div>
          <DataStatusBadge status="SCENARIO" />
        </div>

        <div className="mt-3 flex items-start gap-4">
          <RiskRing score={twin.riskScore} level={twin.riskLevel} size={128} label="Twin risk (prototype)" />
          <div className="min-w-0 flex-1 pt-1">
            <RiskBadge level={twin.riskLevel} score={twin.riskScore} />
            <p className="mt-2 font-mono text-[11px] text-muted">Baseline {twinBaseline.riskScore}</p>
            <p className="font-mono text-[11px]">
              {delta > 0 ? (
                <span className="font-semibold" style={{ color: RISK_COLORS.HIGH }}>
                  ▲ +{Math.round(delta)} pts vs baseline
                </span>
              ) : delta < 0 ? (
                <span className="font-semibold" style={{ color: RISK_COLORS.LOW }}>
                  ▼ {Math.round(delta)} pts vs baseline
                </span>
              ) : (
                <span className="text-muted">— at baseline</span>
              )}
            </p>
            {scenarioActive && (
              <Badge tone="high" className="mt-2">
                Scenario active
              </Badge>
            )}
          </div>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-[11px] font-semibold tracking-wider text-faint uppercase">
            Why this level? {scenarioActive ? "· scenario mover" : "· prototype model"}
          </p>
          {scenarioActive ? (
            <ul className="space-y-1">
              {deltas.slice(0, 5).map((d) => (
                <li key={d.feature} className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate text-muted">{d.feature}</span>
                  <span
                    className={`font-mono font-semibold ${d.delta > 0 ? "text-high" : d.delta < 0 ? "text-low" : "text-faint"}`}
                  >
                    {d.delta > 0 ? "+" : ""}
                    {d.delta.toFixed(1)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <ShapChart contributions={twin.contributions.slice(0, 4)} />
          )}
        </div>

        <div className="mt-4">
          <p className="mb-2 text-[11px] font-semibold tracking-wider text-faint uppercase">Twin sync checklist</p>
          <ul className="space-y-1">
            {SYNC_ITEMS.map((i) => (
              <li key={i.label} className="flex items-center justify-between gap-2 text-[11px]">
                <span className="flex items-center gap-2 text-muted">
                  <span className="text-primary">{i.icon}</span>
                  {i.label}
                </span>
                <Badge tone={scenarioActive ? "high" : "low"}>{scenarioActive ? "Scenario" : "Live"}</Badge>
              </li>
            ))}
          </ul>
        </div>

        <ButtonLink href="/risk-monitoring" variant="ghost" size="sm" className="mt-3 w-full">
          Full risk analysis <ArrowRight className="h-3 w-3" aria-hidden />
        </ButtonLink>
      </Card>

      <Card elevated className="p-4">
        <CardHeader className="px-0 pt-0">
          <div>
            <CardTitle>Live Alerts</CardTitle>
            <CardDescription>Autopromoted from the active twin state</CardDescription>
          </div>
          <ButtonLink href="/alerts" variant="ghost" size="sm">
            Alert Center <ArrowRight className="h-3 w-3" aria-hidden />
          </ButtonLink>
        </CardHeader>
        <CardContent className="max-h-64 space-y-2 overflow-y-auto px-0 no-scrollbar">
          {alerts.length === 0 ? (
            <EmptyState title="No active alerts" description="Alerts will appear here live as the twin evolves." />
          ) : (
            alerts.slice(0, 3).map((a) => (
              <AlertCard key={a.id} alert={a} onAcknowledge={onAcknowledge} onReview={onReview} />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}