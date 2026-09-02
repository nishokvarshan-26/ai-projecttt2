"use client";

import { useApp } from "@/context/app-context";
import { PageHeader } from "@/components/common/page-header";
import { DataStatusBadge } from "@/components/common/data-status-badge";
import { Select } from "@/components/ui/controls";
import { ChartCard } from "@/components/charts/chart-card";
import { AreaTrend, BarSeries, LineTrend } from "@/components/charts/trends";
import {
  getEnvironmentalSeries,
  getGrowthRates,
  getGlacierRetreat,
  getRiskTrend,
} from "@/data/series";
import { assessRisk } from "@/lib/risk-engine";

export default function LakeAnalyticsPage() {
  const { lakes, selectedLake, selectLake } = useApp();

  const env = getEnvironmentalSeries(selectedLake);
  const growth = getGrowthRates(selectedLake);
  const glacier = getGlacierRetreat(selectedLake);
  const riskTrend = getRiskTrend(selectedLake, assessRisk(selectedLake).score);

  return (
    <div>
      <PageHeader
        title="Lake Analytics"
        subtitle="Multi-year observation series for the selected lake. Each chart isolates one variable."
        dataStatus="DEMO"
        meta={<span className="font-mono">Source: demo observation layer · updated {selectedLake.lastObservationAt.slice(0, 10)}</span>}
        actions={
          <Select
            aria-label="Select lake"
            value={selectedLake.id}
            onChange={(e) => selectLake(e.target.value)}
            className="h-9"
          >
            {lakes.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </Select>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Lake Area Change"
          description={`Observed surface area, ${selectedLake.areaHistory[0].year}–${selectedLake.areaHistory[selectedLake.areaHistory.length - 1].year}`}
          right={<DataStatusBadge status="DEMO" />}
          footer={<span>Current: {selectedLake.areaKm2} km² · total change +{selectedLake.historyAreaChangePct}%</span>}
        >
          <AreaTrend
            data={selectedLake.areaHistory.map((p) => ({ year: String(p.year), areaKm2: p.areaKm2 }))}
            xKey="year"
            yKey="areaKm2"
            unit="km²"
          />
        </ChartCard>

        <ChartCard
          title="Annual Growth Rate"
          description="Year-over-year area change (%)"
          right={<DataStatusBadge status="DEMO" />}
          footer={<span>Mean growth {selectedLake.areaGrowthRatePctPerYear > 0 ? "+" : ""}{selectedLake.areaGrowthRatePctPerYear}% / yr</span>}
        >
          <BarSeries data={growth.map((g) => ({ year: String(g.year), growthPct: g.growthPct }))} xKey="year" yKey="growthPct" unit="%" positiveOnlyColor />
        </ChartCard>

        <ChartCard
          title="Temperature Trend"
          description="Monthly mean air temperature near the lake"
          right={<DataStatusBadge status="DEMO" />}
          footer={<span>12-month rolling window (demo series)</span>}
        >
          <LineTrend
            data={env.map((e) => ({ month: e.month, temperatureC: e.temperatureC }))}
            xKey="month"
            lines={[{ key: "temperatureC", color: "#F97316", name: "Temp °C" }]}
          />
        </ChartCard>

        <ChartCard
          title="Rainfall"
          description="Monthly precipitation totals"
          right={<DataStatusBadge status="DEMO" />}
          footer={<span>Monsoon-dominated regime · recent level: {selectedLake.recentPrecipitation.toLowerCase()}</span>}
        >
          <BarSeries data={env.map((e) => ({ month: e.month, rainfallMm: e.rainfallMm }))} xKey="month" yKey="rainfallMm" unit="mm" color="#0EA5E9" />
        </ChartCard>

        <ChartCard
          title="Risk Trend"
          description="Prototype model estimate, trailing 12 months"
          right={<DataStatusBadge status="MODEL_PREDICTION" />}
          footer={<span>Latest estimate {riskTrend[11].score}/100 ({assessRisk(selectedLake).level})</span>}
        >
          <LineTrend
            data={riskTrend.map((t) => ({ label: t.label, score: t.score }))}
            xKey="label"
            lines={[{ key: "score", color: "#EF4444", name: "Risk %" }]}
            yDomain={[0, 100]}
          />
        </ChartCard>

        <ChartCard
          title="Glacier Change"
          description="Cumulative glacier retreat proxy, 2000–2025"
          right={<DataStatusBadge status="DEMO" />}
          footer={<span>Nearest glacier ~{selectedLake.glacierDistanceKm} km from the current shoreline</span>}
        >
          <AreaTrend
            data={glacier.map((g) => ({ year: String(g.year), retreatM: g.retreatM }))}
            xKey="year"
            yKey="retreatM"
            unit="m"
            color="#A78BFA"
          />
        </ChartCard>
      </div>
    </div>
  );
}
