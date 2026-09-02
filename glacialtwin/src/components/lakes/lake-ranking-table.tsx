"use client";

import Link from "next/link";
import { assessRisk } from "@/lib/risk-engine";
import { getRiskTrend } from "@/data/series";
import type { Lake } from "@/lib/types";
import { RiskBadge, TrendArrow } from "@/components/common/risk-badge";
import { Badge } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";

/** Sortable regional risk ranking. Rows navigate to the lake's Digital Twin. */
export function LakeRankingTable({
  lakes,
  className,
}: {
  lakes: Lake[];
  className?: string;
}) {
  const rows = lakes
    .map((lake) => {
      const risk = assessRisk(lake);
      const trend = getRiskTrend(lake, risk.score);
      const prev = trend[trend.length - 2].score;
      const delta = risk.score - prev;
      const areaChange =
        ((lake.areaHistory[lake.areaHistory.length - 1].areaKm2 -
          lake.areaHistory[0].areaKm2) /
          lake.areaHistory[0].areaKm2) *
        100;
      return { lake, risk, delta, areaChange };
    })
    .sort((a, b) => b.risk.score - a.risk.score);

  return (
    <div className={cn("overflow-hidden rounded-lg border border-border", className)}>
      {/* Desktop table */}
      <table className="hidden w-full text-left text-xs md:table">
        <thead>
          <tr className="border-b border-border bg-elevated text-[10px] tracking-[0.1em] text-faint uppercase">
            <th scope="col" className="px-4 py-2.5 font-semibold">Lake</th>
            <th scope="col" className="px-3 py-2.5 font-semibold">Risk</th>
            <th scope="col" className="px-3 py-2.5 font-semibold">Trend</th>
            <th scope="col" className="px-3 py-2.5 font-semibold">Area change</th>
            <th scope="col" className="px-3 py-2.5 font-semibold">Last observation</th>
            <th scope="col" className="px-4 py-2.5 text-right font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ lake, risk, delta, areaChange }) => (
            <tr
              key={lake.id}
              tabIndex={0}
              className="group cursor-pointer border-b border-border/50 transition-colors last:border-0 hover:bg-primary/[0.05] focus-visible:bg-primary/[0.05]"
              onKeyDown={(e) => e.key === "Enter" && window.open(`/digital-twin/${lake.id}`, "_self")}
              onClick={() => window.open(`/digital-twin/${lake.id}`, "_self")}
            >
              <td className="px-4 py-3">
                <span className="font-medium text-text group-hover:text-primary">{lake.name}</span>
                <span className="block font-mono text-[10px] text-faint">
                  {lake.country} · {lake.elevationM.toLocaleString()} m
                </span>
              </td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-2">
                  <RiskBadge level={risk.level} size="sm" />
                  <span className="font-mono font-bold text-text">{risk.score}</span>
                </div>
              </td>
              <td className="px-3 py-3">
                <TrendArrow
                  direction={delta > 1 ? "UP" : delta < -1 ? "DOWN" : "STABLE"}
                  delta={Math.round(delta)}
                />
              </td>
              <td className="px-3 py-3 font-mono text-high">
                +{areaChange.toFixed(0)}%
              </td>
              <td className="px-3 py-3 font-mono text-[11px] text-muted">
                {lake.twinSyncMinutesAgo <= 60 ? "Recent" : `${Math.round(lake.twinSyncMinutesAgo / 60)} h ago`}
              </td>
              <td className="px-4 py-3 text-right">
                <Badge tone={risk.level === "CRITICAL" ? "critical" : risk.level === "HIGH" ? "high" : risk.level === "MODERATE" ? "moderate" : "low"}>
                  {risk.level}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile cards */}
      <ul className="divide-y divide-border/50 md:hidden">
        {rows.map(({ lake, risk, delta, areaChange }) => (
          <li key={lake.id}>
            <Link
              href={`/digital-twin/${lake.id}`}
              className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-primary/[0.05]"
            >
              <div>
                <p className="text-sm font-medium text-text">{lake.name}</p>
                <p className="font-mono text-[10px] text-faint">
                  Area +{areaChange.toFixed(0)}% · obs{" "}
                  {lake.twinSyncMinutesAgo <= 60 ? "recent" : `${Math.round(lake.twinSyncMinutesAgo / 60)} h ago`}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <RiskBadge level={risk.level} score={risk.score} size="sm" />
                <TrendArrow direction={delta > 1 ? "UP" : delta < -1 ? "DOWN" : "STABLE"} />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
