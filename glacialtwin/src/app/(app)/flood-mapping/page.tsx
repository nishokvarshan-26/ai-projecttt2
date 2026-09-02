"use client";

import { useMemo } from "react";
import { TriangleAlert } from "lucide-react";
import { useApp } from "@/context/app-context";
import { PageHeader } from "@/components/common/page-header";
import { DataStatusBadge } from "@/components/common/data-status-badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/feedback";
import { MapPanel } from "@/components/map/map-panel";
import { inundationZones } from "@/data/geo";
import { FLOOD_DEPTH_CLASSES } from "@/lib/config";
import { Select } from "@/components/ui/controls";
import { cn } from "@/lib/utils";

export default function FloodMappingPage() {
  const { lakes, selectedLake, selectLake } = useApp();
  const intensity = 2;

  const exposure = useMemo(() => {
    const zones = inundationZones(selectedLake, intensity);
    return selectedLake.settlementsDownstream.map((name, i) => {
      const seg = Math.min(zones.features.length - 1, i + 1);
      const cls = (zones.features[seg]?.properties as { depthClass?: string } | undefined)?.depthClass ?? "d1";
      const label = FLOOD_DEPTH_CLASSES.find((c) => c.id === cls)?.label ?? "—";
      return { name, depthLabel: label, distanceKm: (i + 1) * 4.5 };
    });
  }, [selectedLake]);

  return (
    <div>
      <PageHeader
        title="Potential Inundation Analysis"
        subtitle="Scenario-based downstream flood corridor visualization with schematic depth classes."
        dataStatus="SCENARIO"
        meta={<span>Corridor model: simplified kinematic prototype — not a hydrodynamic simulation</span>}
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

      <div className="mb-3 flex items-start gap-2.5 rounded-lg border border-moderate/35 bg-moderate/[0.07] px-4 py-3">
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-moderate" aria-hidden />
        <p className="text-xs leading-relaxed text-moderate">
          <span className="font-semibold">Scenario-based visualization.</span> The inundation layer is a
          schematic corridor generated for research and demonstration. It is not a validated
          hydrodynamic flood extent and must not be used for emergency planning.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card elevated className="p-3 lg:col-span-2">
          <MapPanel
            lake={selectedLake}
            inundationIntensity={intensity}
            heightClass="h-[420px] sm:h-[520px]"
          />
        </Card>

        <div className="space-y-4">
          <Card elevated>
            <CardHeader>
              <div>
                <CardTitle>Depth Legend</CardTitle>
                <CardDescription>Schematic classes along the corridor</CardDescription>
              </div>
              <DataStatusBadge status="SCENARIO" />
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {FLOOD_DEPTH_CLASSES.map((c) => (
                  <li key={c.id} className="flex items-center gap-2.5 text-xs">
                    <span className="h-3 w-8 rounded-sm" style={{ background: c.color }} aria-hidden />
                    <span className="font-mono text-muted">{c.label}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card elevated>
            <CardHeader>
              <div>
                <CardTitle>Potentially Exposed Zones</CardTitle>
                <CardDescription>Analytical estimate — {selectedLake.name} corridor</CardDescription>
              </div>
              <Badge tone="neutral">Estimate</Badge>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {exposure.map((e) => (
                  <li key={e.name} className="flex items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 py-2">
                    <div>
                      <p className="text-xs font-medium text-text">{e.name}</p>
                      <p className="font-mono text-[10px] text-faint">~{e.distanceKm} km downstream</p>
                    </div>
                    <Badge tone={e.depthLabel.includes("3") ? "critical" : e.depthLabel.startsWith("2") ? "high" : "primary"}>
                      {e.depthLabel}
                    </Badge>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[11px] leading-relaxed text-faint">
                Exposure figures describe the demo dataset's analytical estimate of downstream
                elements within the scenario corridor. They are not population counts.
              </p>
            </CardContent>
          </Card>

          <Card elevated className="p-4">
            <CardTitle className="mb-2">Map Controls</CardTitle>
            <ul className={cn("space-y-1.5 text-xs text-muted")}>
              <li>• Switch satellite / dark / streets basemaps</li>
              <li>• Toggle lake, river, settlements, infrastructure & inundation layers</li>
              <li>• Measure distances with the ruler tool (click points)</li>
              <li>• Fullscreen, zoom and scale controls on the map</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
