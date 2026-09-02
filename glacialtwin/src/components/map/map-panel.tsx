"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Map as MapLibreMap,
  Popup,
  NavigationControl,
  ScaleControl,
  FullscreenControl,
  GeoJSONSource,
  type Map as MlMap,
  type StyleSpecification,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Crosshair,
  Layers,
  Maximize2,
  Mountain,
  MapPin,
  Ruler,
  Satellite,
  Trash2,
  Waves,
  Building2,
  RotateCcw,
} from "lucide-react";
import type { Lake } from "@/lib/types";
import { FLOOD_DEPTH_CLASSES, MAP_BASEMAPS, type BasemapId } from "@/lib/config";
import {
  infrastructurePoints,
  inundationZones,
  lakePolygon,
  riverLine,
  settlementPoints,
  depthColor,
} from "@/data/geo";
import { cn } from "@/lib/utils";

function styleFor(id: BasemapId): StyleSpecification {
  const b = MAP_BASEMAPS[id];
  return {
    version: 8,
    sources: {
      base: {
        type: "raster",
        tiles: [...b.tiles],
        tileSize: 256,
        attribution: b.attribution,
        maxzoom: b.maxzoom,
      },
    },
    layers: [{ id: "base", type: "raster", source: "base" }],
  };
}

function haversineKm(a: [number, number], b: [number, number]) {
  const R = 6371;
  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLon = ((b[0] - a[0]) * Math.PI) / 180;
  const la1 = (a[1] * Math.PI) / 180;
  const la2 = (b[1] * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export interface MapLayerVisibility {
  lake: boolean;
  river: boolean;
  settlements: boolean;
  infrastructure: boolean;
  inundation: boolean;
}

const DEFAULT_VIS: MapLayerVisibility = {
  lake: true,
  river: true,
  settlements: true,
  infrastructure: false,
  inundation: true,
};

export function MapPanel({
  lake,
  inundationIntensity,
  heightClass = "h-[420px]",
  showLegend = true,
  className,
}: {
  lake: Lake;
  /** When provided, the scenario inundation layer is enabled at this intensity (1–3). */
  inundationIntensity?: number;
  heightClass?: string;
  showLegend?: boolean;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const visRef = useRef<MapLayerVisibility>(DEFAULT_VIS);
  const [ready, setReady] = useState(false);
  const [basemap, setBasemap] = useState<BasemapId>("satellite");
  const [vis, setVis] = useState<MapLayerVisibility>(DEFAULT_VIS);
  visRef.current = vis;
  const [measuring, setMeasuring] = useState(false);
  const [measurePts, setMeasurePts] = useState<Array<[number, number]>>([]);
  const [cursor, setCursor] = useState<string>("");

  const zoom = useMemo(() => 11.5, []);

  const data = useMemo(
    () => ({
      lake: lakePolygon(lake),
      river: riverLine(lake),
      settlements: settlementPoints(lake),
      infra: infrastructurePoints(lake),
      inundation: inundationZones(lake, inundationIntensity ?? 2),
    }),
    [lake, inundationIntensity]
  );

  /* ------------------------------ Layer plumbing ----------------------------- */
  const applySourcesAndLayers = useCallback(
    (map: MlMap) => {
      const addSource = (id: string, d: GeoJSON.FeatureCollection | GeoJSON.Feature) => {
        if (!map.getSource(id)) map.addSource(id, { type: "geojson", data: d as never });
        else (map.getSource(id) as GeoJSONSource).setData(d as never);
      };

      addSource("gx-lake", { type: "FeatureCollection", features: [data.lake] });
      addSource("gx-river", { type: "FeatureCollection", features: [data.river] });
      addSource("gx-settlements", data.settlements);
      addSource("gx-infra", data.infra);
      addSource("gx-inundation", data.inundation);
      addSource("gx-measure", {
        type: "FeatureCollection",
        features: [],
      });

      const has = (id: string) => !!map.getLayer(id);

      if (!has("fill-inundation")) {
        map.addLayer({
          id: "fill-inundation",
          type: "fill",
          source: "gx-inundation",
          paint: {
            "fill-color": ["get", ["get", "depthClass"], ["literal", Object.fromEntries(FLOOD_DEPTH_CLASSES.map((c) => [c.id, c.color]))]],
            "fill-opacity": 0.42,
          },
        });
        map.addLayer({
          id: "line-inundation",
          type: "line",
          source: "gx-inundation",
          paint: { "line-color": "#ffffff33", "line-width": 0.6 },
        });
      }
      if (!has("line-river")) {
        map.addLayer({
          id: "line-river",
          type: "line",
          source: "gx-river",
          paint: { "line-color": "#38BDF8", "line-width": 2.4, "line-blur": 0.4 },
        });
      }
      if (!has("line-lake")) {
        map.addLayer({
          id: "line-lake",
          type: "line",
          source: "gx-lake",
          paint: { "line-color": "#22D3EE", "line-width": 2.6 },
        });
        map.addLayer({
          id: "fill-lake",
          type: "fill",
          source: "gx-lake",
          paint: { "fill-color": "#22D3EE", "fill-opacity": 0.28 },
        });
      }
      if (!has("circle-settlements")) {
        map.addLayer({
          id: "circle-settlements",
          type: "circle",
          source: "gx-settlements",
          paint: {
            "circle-color": "#F8FAFC",
            "circle-radius": 5,
            "circle-stroke-color": "#F97316",
            "circle-stroke-width": 2,
          },
        });
      }
      if (!has("circle-infra")) {
        map.addLayer({
          id: "circle-infra",
          type: "circle",
          source: "gx-infra",
          paint: {
            "circle-color": "#EAB308",
            "circle-radius": 5,
            "circle-stroke-color": "#0b1422",
            "circle-stroke-width": 1.5,
          },
        });
      }
      if (!has("line-measure")) {
        map.addLayer({
          id: "line-measure",
          type: "line",
          source: "gx-measure",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": "#A78BFA", "line-width": 2, "line-dasharray": [2, 1.5] },
        });
      }

      // Popups
      map.on("click", "circle-settlements", (e) => {
        const f = e.features?.[0];
        if (!f) return;
        new Popup({ offset: 12, closeButton: false })
          .setLngLat((f.geometry as GeoJSON.Point).coordinates.slice(0, 2) as [number, number])
          .setHTML(
            `<strong>${f.properties?.name}</strong><br/><span style="color:#94a3b8">~${f.properties?.distanceKm} km downstream · demo</span>`
          )
          .addTo(map);
      });
      map.on("click", "circle-infra", (e) => {
        const f = e.features?.[0];
        if (!f) return;
        new Popup({ offset: 12, closeButton: false })
          .setLngLat((f.geometry as GeoJSON.Point).coordinates.slice(0, 2) as [number, number])
          .setHTML(
            `<strong>${f.properties?.name}</strong><br/><span style="color:#94a3b8">critical infrastructure · demo</span>`
          )
          .addTo(map);
      });
    },
    [data]
  );

  const syncVisibility = useCallback((map: MlMap, v: MapLayerVisibility) => {
    const set = (layer: string, visible: boolean) => {
      if (map.getLayer(layer)) {
        map.setLayoutProperty(layer, "visibility", visible ? "visible" : "none");
      }
    };
    set("fill-lake", v.lake);
    set("line-lake", v.lake);
    set("line-river", v.river);
    set("circle-settlements", v.settlements);
    set("circle-infra", v.infrastructure);
    set("fill-inundation", v.inundation);
    set("line-inundation", v.inundation);
  }, []);

  const applyRef = useRef(applySourcesAndLayers);
  applyRef.current = applySourcesAndLayers;
  const syncRef = useRef(syncVisibility);
  syncRef.current = syncVisibility;

  /* --------------------------------- Init ---------------------------------- */
  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    const map = new MapLibreMap({
      container,
      style: styleFor(basemap),
      center: [lake.longitude, lake.latitude - 0.06],
      zoom,
      attributionControl: { compact: true },
      dragRotate: false,
    });
    mapRef.current = map;

    map.addControl(new NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new ScaleControl({ maxWidth: 110, unit: "metric" }), "bottom-left");
    map.addControl(new FullscreenControl(), "top-right");

    map.on("load", () => {
      applyRef.current(map);
      syncRef.current(map, visRef.current);
      setReady(true);
    });

    map.on("styledata", () => {
      if (map.isStyleLoaded()) {
        applyRef.current(map);
        syncRef.current(map, visRef.current);
      }
    });

    map.on("mousemove", (e) => {
      setCursor(`${e.lngLat.lat.toFixed(4)}, ${e.lngLat.lng.toFixed(4)}`);
    });

    map.on("click", (e) => {
      if (!measuring) return;
      setMeasurePts((prev) => {
        const next = [...prev, [e.lngLat.lng, e.lngLat.lat] as [number, number]];
        updateMeasure(map, next);
        return next;
      });
    });

    function updateMeasure(map: MlMap, pts: Array<[number, number]>) {
      const src = map.getSource("gx-measure") as GeoJSONSource | undefined;
      if (!src) return;
      src.setData({
        type: "FeatureCollection",
        features:
          pts.length >= 2
            ? [
                {
                  type: "Feature" as const,
                  properties: {},
                  geometry: { type: "LineString" as const, coordinates: pts },
                },
              ]
            : [],
      });
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* --------------------------- Data / view updates -------------------------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    applySourcesAndLayers(map);
    map.flyTo({ center: [lake.longitude, lake.latitude - 0.06], zoom, duration: 900 });
  }, [lake, ready, applySourcesAndLayers, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    syncVisibility(map, vis);
  }, [vis, ready, syncVisibility]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    map.setStyle(styleFor(basemap));
  }, [basemap, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const src = map.getSource("gx-measure") as GeoJSONSource | undefined;
    src?.setData({ type: "FeatureCollection", features: [] });
    setMeasurePts([]);
  }, [measuring, ready]);

  const measureDistanceKm = useMemo(() => {
    let d = 0;
    for (let i = 1; i < measurePts.length; i++) d += haversineKm(measurePts[i - 1], measurePts[i]);
    return d;
  }, [measurePts]);

  const resetView = () => {
    mapRef.current?.flyTo({ center: [lake.longitude, lake.latitude - 0.06], zoom, duration: 800 });
  };

  const LAYER_TOGGLES: Array<{ key: keyof MapLayerVisibility; label: string; icon: React.ReactNode }> = [
    { key: "lake", label: "Lake", icon: <Waves className="h-3 w-3" /> },
    { key: "river", label: "River", icon: <MapPin className="h-3 w-3" /> },
    { key: "settlements", label: "Settlements", icon: <Building2 className="h-3 w-3" /> },
    { key: "infrastructure", label: "Infrastructure", icon: <Mountain className="h-3 w-3" /> },
    ...(inundationIntensity
      ? [{ key: "inundation" as keyof MapLayerVisibility, label: "Inundation", icon: <Layers className="h-3 w-3" /> }]
      : []),
  ];

  return (
    <div className={cn("relative overflow-hidden rounded-lg border border-border bg-surface", className)}>
      <div ref={containerRef} className={heightClass} />

      {/* Top-left control stack */}
      <div className="absolute top-2 left-2 z-10 flex max-w-[calc(100%-90px)] flex-wrap items-center gap-1">
        <div className="glass flex items-center gap-0.5 rounded-md p-0.5">
          {(Object.keys(MAP_BASEMAPS) as BasemapId[]).map((id) => (
            <button
              key={id}
              onClick={() => setBasemap(id)}
              aria-pressed={basemap === id}
              title={`${MAP_BASEMAPS[id].label} basemap`}
              className={cn(
                "flex cursor-pointer items-center gap-1 rounded px-1.5 py-1 text-[10px] font-medium transition-colors",
                basemap === id ? "bg-primary/20 text-primary" : "text-muted hover:text-text"
              )}
            >
              {id === "satellite" ? <Satellite className="h-3 w-3" /> : id === "dark" ? <Mountain className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
              <span className="hidden sm:inline">{MAP_BASEMAPS[id].label}</span>
            </button>
          ))}
        </div>

        <div className="glass flex items-center gap-0.5 rounded-md p-0.5">
          {LAYER_TOGGLES.map((t) => (
            <button
              key={t.key}
              onClick={() => setVis((v) => ({ ...v, [t.key]: !v[t.key] }))}
              aria-pressed={vis[t.key]}
              title={`Toggle ${t.label}`}
              className={cn(
                "flex cursor-pointer items-center gap-1 rounded px-1.5 py-1 text-[10px] font-medium transition-colors",
                vis[t.key] ? "bg-primary/20 text-primary" : "text-muted hover:text-text"
              )}
            >
              {t.icon}
              <span className="hidden md:inline">{t.label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => setMeasuring((m) => !m)}
          aria-pressed={measuring}
          title="Measure distance (click points on the map)"
          className={cn(
            "glass flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-medium transition-colors",
            measuring ? "text-primary ring-1 ring-primary/50" : "text-muted hover:text-text"
          )}
        >
          <Ruler className="h-3 w-3" /> <span className="hidden sm:inline">Measure</span>
        </button>
        <button
          onClick={resetView}
          title="Reset view"
          className="glass flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-medium text-muted transition-colors hover:text-text"
        >
          <RotateCcw className="h-3 w-3" /> <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      {/* Measure readout */}
      {measuring && (
        <div className="glass absolute top-14 left-2 z-10 flex items-center gap-2 rounded-md px-2 py-1.5 text-[10px]">
          <Crosshair className="h-3 w-3 text-primary" />
          <span className="font-mono text-text">
            {measurePts.length >= 2 ? `${measureDistanceKm.toFixed(2)} km` : "Click points…"}
          </span>
          {measurePts.length > 0 && (
            <button
              onClick={() => {
                setMeasurePts([]);
                const map = mapRef.current;
                const src = map?.getSource("gx-measure") as GeoJSONSource | undefined;
                src?.setData({ type: "FeatureCollection", features: [] });
              }}
              className="cursor-pointer text-muted hover:text-critical"
              title="Clear measurement"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      {/* Depth legend */}
      {showLegend && inundationIntensity && (
        <div className="glass absolute right-2 bottom-8 z-10 hidden rounded-md px-2.5 py-2 sm:block">
          <p className="mb-1 text-[9px] font-semibold tracking-wider text-faint uppercase">Depth</p>
          <ul className="space-y-0.5">
            {FLOOD_DEPTH_CLASSES.map((c) => (
              <li key={c.id} className="flex items-center gap-1.5 text-[10px] text-muted">
                <span className="inline-block h-2 w-4 rounded-sm" style={{ background: c.color }} />
                {c.label}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Coordinate readout */}
      <div className="glass absolute bottom-2 left-1/2 z-10 hidden -translate-x-1/2 items-center gap-1.5 rounded px-2 py-0.5 md:flex">
        <Maximize2 className="h-2.5 w-2.5 text-faint" aria-hidden />
        <span className="font-mono text-[9.5px] text-muted">{cursor || "—"}</span>
      </div>

      {/* Loading skeleton */}
      {!ready && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-surface">
          <div className="skeleton h-2 w-36" />
          <p className="font-mono text-[11px] text-faint">Loading map layers…</p>
        </div>
      )}
    </div>
  );
}

export { depthColor };
