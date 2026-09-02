import type { Lake } from "@/lib/types";
import { FLOOD_DEPTH_CLASSES } from "@/lib/config";

/**
 * SYNTHETIC GEOMETRY (DEMO) — schematic GeoJSON used by the map views.
 * Polygons and lines are procedurally generated around each lake's
 * approximate coordinates to visualise the prototype's data model.
 * They are NOT surveyed boundaries or validated flood extents.
 */

const KM_PER_DEG_LAT = 110.574;

function offset(lake: Lake, dxKm: number, dyKm: number): [number, number] {
  const dLat = dyKm / KM_PER_DEG_LAT;
  const dLon = dxKm / (KM_PER_DEG_LAT * Math.cos((lake.latitude * Math.PI) / 180));
  return [
    Math.round((lake.longitude + dLon) * 1e5) / 1e5,
    Math.round((lake.latitude + dLat) * 1e5) / 1e5,
  ];
}

/** Rough lake polygon sized from the recorded area. */
export function lakePolygon(lake: Lake): GeoJSON.Feature<GeoJSON.Polygon> {
  const radiusKm = Math.sqrt(lake.areaKm2 / Math.PI);
  const rx = radiusKm * 1.35;
  const ry = radiusKm;
  const coords: Array<[number, number]> = [];
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    const wobble = 0.82 + 0.3 * Math.abs(Math.sin(i * 2.7 + lake.latitude));
    coords.push(offset(lake, Math.cos(a) * rx * wobble, Math.sin(a) * ry * wobble));
  }
  coords.push(coords[0]);
  return {
    type: "Feature",
    properties: { id: lake.id, name: lake.name, kind: "lake" },
    geometry: { type: "Polygon", coordinates: [coords] },
  };
}

/** Meandering downstream river centreline (schematic). */
export function riverLine(
  lake: Lake
): GeoJSON.Feature<GeoJSON.LineString> {
  // Downstream is roughly south (180°) unless stated otherwise.
  const points: Array<[number, number]> = [];
  let x = 0;
  for (let i = 0; i <= 14; i++) {
    x = Math.sin(i * 0.9) * 1.6 + i * 0.12;
    points.push(offset(lake, x, -i * 0.85));
  }
  return {
    type: "Feature",
    properties: { id: `${lake.id}-river`, name: `${lake.name} outflow`, kind: "river" },
    geometry: { type: "LineString", coordinates: points },
  };
}

export function settlementPoints(lake: Lake): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: "FeatureCollection",
    features: lake.settlementsDownstream.map((name, i) => ({
      type: "Feature" as const,
      properties: { name, kind: "settlement", distanceKm: (i + 1) * 4.5 },
      geometry: {
        type: "Point" as const,
        coordinates: offset(lake, Math.sin(i * 0.9) * 1.6 + (i + 1) * 0.12, -(i + 1) * 3.4),
      },
    })),
  };
}

export function infrastructurePoints(lake: Lake): GeoJSON.FeatureCollection<GeoJSON.Point> {
  const items = [
    { name: "Suspension bridge", kind: "bridge" },
    { name: "Trail checkpoint", kind: "checkpoint" },
    { name: "Micro-hydro intake", kind: "hydro" },
  ];
  return {
    type: "FeatureCollection",
    features: items.map((it, i) => ({
      type: "Feature" as const,
      properties: { ...it, distanceKm: (i + 1) * 6.2 },
      geometry: {
        type: "Point" as const,
        coordinates: offset(
          lake,
          Math.sin(i * 0.9) * 1.6 + (i + 1.4) * 0.12,
          -(i + 1.4) * 4.6
        ),
      },
    })),
  };
}

function depthClassFor(t: number): string {
  // t: 0 at lake outlet → 1 far downstream
  if (t < 0.15) return "d5";
  if (t < 0.32) return "d4";
  if (t < 0.52) return "d3";
  if (t < 0.74) return "d2";
  return "d1";
}

/**
 * Scenario inundation corridor along the river.
 * `intensity` (1–3) widens the corridor; depths are schematic classes only.
 */
export function inundationZones(
  lake: Lake,
  intensity: number
): GeoJSON.FeatureCollection<GeoJSON.Polygon> {
  const widthBase = 0.35 + intensity * 0.22; // km half-width near outlet
  const features: GeoJSON.Feature<GeoJSON.Polygon>[] = [];
  const N = 10;
  for (let i = 0; i < N; i++) {
    const t0 = i / N;
    const t1 = (i + 1) / N;
    const y0 = -t0 * 13;
    const y1 = -t1 * 13;
    const xc = Math.sin(((t0 + t1) / 2) * N * 0.9) * 1.6 + ((t0 + t1) / 2) * N * 0.12;
    const w0 = widthBase * (1 + t0 * 1.8);
    const w1 = widthBase * (1 + t1 * 1.8);
    const ring: Array<[number, number]> = [
      offset(lake, xc - w0, y0),
      offset(lake, xc + w0, y0),
      offset(lake, xc + w1, y1),
      offset(lake, xc - w1, y1),
      offset(lake, xc - w0, y0),
    ];
    features.push({
      type: "Feature",
      properties: {
        kind: "inundation",
        depthClass: depthClassFor((t0 + t1) / 2),
        segment: i + 1,
      },
      geometry: { type: "Polygon", coordinates: [ring] },
    });
  }
  return { type: "FeatureCollection", features };
}

export function depthColor(classId: string): string {
  return FLOOD_DEPTH_CLASSES.find((c) => c.id === classId)?.color ?? "#22D3EE";
}
