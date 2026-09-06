"use client";

import { useState } from "react";
import { RefreshCcw, Satellite, CloudSun, Layers3 } from "lucide-react";
import { useApp } from "@/context/app-context";
import { PageHeader } from "@/components/common/page-header";
import { DataStatusBadge } from "@/components/common/data-status-badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge, EmptyState } from "@/components/ui/feedback";
import { Button, Select } from "@/components/ui/controls";
import { PipelineFlow } from "@/components/pipeline/pipeline-flow";
import { SatelliteComparison } from "@/components/satellite/satellite-comparison";
import { getComparison, getScenesForLake, SATELLITE_SOURCES } from "@/data/satellite";
import { formatDateTime } from "@/lib/utils";

export default function SatelliteIntelligencePage() {
  const { lakes, selectedLake, selectLake } = useApp();
  const comparison = getComparison(selectedLake.id);
  const scenes = getScenesForLake(selectedLake.id);

  // Demo error/retry state for the latest acquisition
  const [retryState, setRetryState] = useState<"idle" | "retrying" | "ok">("idle");

  return (
    <div>
      <PageHeader
        title="Satellite Intelligence"
        subtitle="Observation sources, lake detection pipeline and surface-area change analysis."
        dataStatus="DEMO"
        meta={<span className="font-mono">Latest processed scene: 2026-08-18 (demo)</span>}
        actions={
          <Select aria-label="Select lake" value={selectedLake.id} onChange={(e) => selectLake(e.target.value)} className="h-9">
            {lakes.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </Select>
        }
      />

      {/* Sources */}
      <div className="grid gap-3 sm:grid-cols-3">
        {SATELLITE_SOURCES.map((s) => (
          <Card key={s.id} elevated className="p-4">
            <div className="flex items-center justify-between">
              <Satellite className="h-4 w-4 text-primary" aria-hidden />
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-low uppercase">
                <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-low" />
                {s.status}
              </span>
            </div>
            <h2 className="mt-2.5 font-display text-sm font-bold text-text">{s.name}</h2>
            <p className="text-[11px] text-faint">{s.agency}</p>
            <dl className="mt-3 space-y-1 text-xs">
              <div className="flex justify-between border-b border-border/60 pb-1">
                <dt className="text-muted">Resolution</dt>
                <dd className="font-mono text-text">{s.resolutionM} m</dd>
              </div>
              <div className="flex justify-between border-b border-border/60 pb-1">
                <dt className="text-muted">Revisit</dt>
                <dd className="font-mono text-text">{s.revisitDays ? `${s.revisitDays} days` : "Static"}</dd>
              </div>
              <div className="flex justify-between pt-0.5">
                <dt className="text-muted">Used for</dt>
                <dd className="text-right text-text">{s.use}</dd>
              </div>
            </dl>
          </Card>
        ))}
      </div>

      {/* Detection pipeline */}
      <Card elevated className="mt-4 p-4">
        <CardHeader className="px-0 pt-0">
          <div>
            <CardTitle>Lake Detection Pipeline</CardTitle>
            <CardDescription>From raw scene to Digital Twin update — click a step to inspect it</CardDescription>
          </div>
          <DataStatusBadge status="DEMO" />
        </CardHeader>
        <PipelineFlow />
      </Card>

      {/* Comparison */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card elevated className="p-4 lg:col-span-2">
          <CardHeader className="px-0 pt-0">
            <div>
              <CardTitle>Surface Change — {selectedLake.name}</CardTitle>
              <CardDescription>Before / after comparison with detected boundary overlay</CardDescription>
            </div>
            <Badge tone="warning">Synthetic imagery</Badge>
          </CardHeader>
          {comparison ? (
            <>
              <SatelliteComparison data={comparison} />
              <p className="mt-3 text-[11px] leading-relaxed text-faint">
                The scenes above are procedurally generated visualizations of the demo observation
                record — not real satellite pixels. The area statistics reflect the demo data layer.
              </p>
            </>
          ) : (
            <EmptyState title="No comparison available" description="This lake has insufficient observation history." />
          )}
        </Card>

        <div className="space-y-4">
          {/* Error state demo */}
          <Card elevated className="p-4">
            <CardTitle className="mb-1">Acquisition Status</CardTitle>
            {retryState === "ok" ? (
              <div className="rounded-md border border-low/40 bg-low/[0.08] px-3 py-3 text-xs text-low">
                Synchronization complete. Latest scene ingested into the pipeline (demo).
              </div>
            ) : retryState === "retrying" ? (
              <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-3 text-xs text-muted">
                <RefreshCcw className="h-3.5 w-3.5 animate-spin text-primary" aria-hidden />
                Contacting catalogue… (simulated)
              </div>
            ) : (
              <div className="rounded-md border border-high/40 bg-high/[0.06] px-3 py-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-high">
                  <CloudSun className="h-3.5 w-3.5" aria-hidden /> Latest pass overcast
                </p>
                <p className="mt-1 text-[11px] text-muted">Last successful observation: 14 hours ago.</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={() => {
                    setRetryState("retrying");
                    setTimeout(() => setRetryState("ok"), 1600);
                  }}
                >
                  <RefreshCcw className="h-3 w-3" aria-hidden /> Retry synchronization
                </Button>
              </div>
            )}
          </Card>

          {/* Scene catalogue */}
          <Card elevated className="p-4">
            <CardTitle className="mb-2">Scene Catalogue</CardTitle>
            <ul className="space-y-2">
              {scenes.map((sc) => (
                <li key={sc.id} className="rounded-md border border-border bg-surface px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-text">{sc.platform}</span>
                    <Badge tone={sc.processing === "PROCESSED" ? "low" : sc.processing === "PROCESSING" ? "moderate" : "neutral"}>
                      {sc.processing.toLowerCase()}
                    </Badge>
                  </div>
                  <p className="mt-0.5 truncate font-mono text-[10px] text-faint">{sc.sceneId}</p>
                  <dl className="mt-1.5 grid grid-cols-3 gap-1 text-[10px]">
                    <div>
                      <dt className="text-faint">Acquired</dt>
                      <dd className="font-mono text-muted">{sc.acquiredAt.slice(0, 10)}</dd>
                    </div>
                    <div>
                      <dt className="text-faint">Cloud</dt>
                      <dd className="font-mono text-muted">{sc.cloudCoverPct}%</dd>
                    </div>
                    <div>
                      <dt className="text-faint">Res.</dt>
                      <dd className="font-mono text-muted">{sc.resolutionM} m</dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          </Card>

          <Card elevated className="p-4">
            <div className="flex items-center gap-2">
              <Layers3 className="h-4 w-4 text-primary" aria-hidden />
              <CardTitle>Water Detection Method</CardTitle>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Open water is isolated using the Normalized Difference Water Index,
              NDWI = (Green − NIR) / (Green + NIR), thresholded at &gt; 0.15 and refined with cloud
              masking and morphological filtering. In this prototype the inputs are simulated.
            </p>
          </Card>
        </div>
      </div>

      {/* Full catalogue table */}
      <Card elevated className="mt-4 overflow-hidden">
        <CardHeader>
          <div>
            <CardTitle>All Tracked Scenes</CardTitle>
            <CardDescription>Demo catalogue across monitored lakes</CardDescription>
          </div>
          <DataStatusBadge status="DEMO" />
        </CardHeader>
        <CardContent className="overflow-x-auto px-0 pb-0">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead>
              <tr className="border-y border-border bg-elevated text-[10px] tracking-[0.1em] text-faint uppercase">
                <th scope="col" className="px-4 py-2.5 font-semibold">Platform</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Scene ID</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Acquired</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Cloud</th>
                <th scope="col" className="px-3 py-2.5 font-semibold">Bands</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">Processing</th>
              </tr>
            </thead>
            <tbody>
              {lakes.flatMap((l) =>
                getScenesForLake(l.id).map((sc) => (
                  <tr key={sc.id} className="border-b border-border/50 last:border-0 hover:bg-elevated/60">
                    <td className="px-4 py-2.5">
                      <span className="text-text">{sc.platform}</span>
                      <span className="block text-[10px] text-faint">{l.name}</span>
                    </td>
                    <td className="max-w-[220px] truncate px-3 py-2.5 font-mono text-[10.5px] text-muted">{sc.sceneId}</td>
                    <td className="px-3 py-2.5 font-mono text-muted">{formatDateTime(sc.acquiredAt)}</td>
                    <td className="px-3 py-2.5 font-mono text-muted">{sc.cloudCoverPct}%</td>
                    <td className="px-3 py-2.5 text-muted">{sc.bandsUsed}</td>
                    <td className="px-4 py-2.5">
                      <Badge tone={sc.processing === "PROCESSED" ? "low" : "moderate"}>{sc.processing.toLowerCase()}</Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
