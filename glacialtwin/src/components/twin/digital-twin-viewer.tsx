"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { X, ChartLine as LineChartIcon, Footprints } from "lucide-react";
import Link from "next/link";
import type { Lake } from "@/lib/types";
import { RISK_COLORS } from "@/lib/config";
import { formatCoord, hashString, mulberry32 } from "@/lib/utils";
import { Badge } from "@/components/ui/feedback";
import { Button, ButtonLink } from "@/components/ui/controls";
import type { ScenarioKind, TwinState, ViewMode } from "@/lib/twin-types";
import { failureColor, SLOPE_DEFS } from "@/lib/twin-engine";

/**
 * DIGITAL TWIN 3D VIEWER
 *
 * A stylised pseudo-3D Himalayan terrain rendered from the lake's live twin
 * state. The scene reacts to the application state:
 *   – water level / area follow the twin lake state
 *   – slope zones recolor from slope instability
 *   – a sensor network streams readings and communication links
 *   – seismic rings + camera shake appear during earthquake scenarios
 *   – a debris flow advances toward the lake during landslide scenarios
 *   – a scenario flood corridor propagates downstream
 * Click objects to inspect them (lake, sensor, slope, settlement, river).
 */

const SIZE = 380;
const SEG = 128;

function makeNoise(seed: number) {
  const rand = mulberry32(seed);
  const P = 256;
  const table = Array.from({ length: P * P }, () => rand());
  const at = (x: number, y: number) => table[((y & 255) * P + (x & 255)) % table.length];
  const smooth = (t: number) => t * t * (3 - 2 * t);
  const value = (x: number, y: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const tx = smooth(x - xi);
    const ty = smooth(y - yi);
    const a = at(xi, yi);
    const b = at(xi + 1, yi);
    const c = at(xi, yi + 1);
    const d = at(xi + 1, yi + 1);
    return a * (1 - tx) * (1 - ty) + b * tx * (1 - ty) + c * (1 - tx) * ty + d * tx * ty;
  };
  return (x: number, y: number, octaves = 4) => {
    let amp = 0.5;
    let freq = 1;
    let sum = 0;
    let norm = 0;
    for (let o = 0; o < octaves; o++) {
      sum += amp * value(x * freq, y * freq);
      norm += amp;
      amp *= 0.5;
      freq *= 2.07;
    }
    return sum / norm;
  };
}

function makeImpressionTexture(kind: "satellite" | "elevation", seed: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const rand = mulberry32(seed + (kind === "satellite" ? 7 : 13));
  ctx.fillStyle = kind === "satellite" ? "#1c2a1a" : "#0b2438";
  ctx.fillRect(0, 0, 512, 512);
  // coarse terrain noise blotches
  for (let i = 0; i < 900; i++) {
    const x = rand() * 512;
    const y = rand() * 512;
    const r = 6 + rand() * 40;
    if (kind === "satellite") {
      const t = rand();
      ctx.fillStyle =
        t < 0.42
          ? `rgba(${52 + rand() * 30},${70 + rand() * 34},${48 + rand() * 24},0.5)`
          : t < 0.75
            ? `rgba(120,118,112,0.35)`
            : `rgba(238,242,244,0.85)`;
    } else {
      const band = Math.floor(rand() * 4);
      ctx.fillStyle =
        band === 0
          ? "rgba(16,52,84,0.5)"
          : band === 1
            ? "rgba(56,103,64,0.45)"
            : band === 2
              ? "rgba(122,90,58,0.45)"
              : "rgba(232,234,238,0.85)";
    }
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // lake ellipse
  ctx.fillStyle = "rgba(24,182,216,0.9)";
  ctx.beginPath();
  ctx.ellipse(290, 170, 96, 62, 0, 0, Math.PI * 2);
  ctx.fill();
  // meltwater plume downstream
  ctx.fillStyle = "rgba(47,201,232,0.65)";
  ctx.beginPath();
  ctx.moveTo(330, 220);
  ctx.quadraticCurveTo(365, 300, 330, 430);
  ctx.quadraticCurveTo(300, 470, 350, 500);
  ctx.lineTo(400, 500);
  ctx.quadraticCurveTo(400, 320, 350, 220);
  ctx.closePath();
  ctx.fill();
  if (kind === "elevation") {
    ctx.strokeStyle = "rgba(12,22,36,0.35)";
    ctx.lineWidth = 1.4;
    for (let c = 0; c < 10; c++) {
      const yy = 120 + c * 34;
      ctx.beginPath();
      ctx.moveTo(0, yy);
      for (let x = 0; x <= 512; x += 32) {
        ctx.lineTo(x, yy + Math.sin(x * 0.045 + c * 2) * 8);
      }
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2.2, 2.2);
  return tex;
}

type TwinLabel = { id: string; caption: string; value: string; color: string };

const VIEW_MODES: Array<{ id: ViewMode; label: string }> = [
  { id: "NORMAL", label: "Terrain" },
  { id: "SATELLITE", label: "Satellite" },
  { id: "ELEVATION", label: "Elevation" },
  { id: "SLOPE_RISK", label: "Slope risk" },
  { id: "LANDSLIDE", label: "Landslide" },
  { id: "FLOOD", label: "Flood" },
  { id: "SEISMIC", label: "Seismic" },
  { id: "SENSORS", label: "Sensors" },
];

interface SceneHandles {
  terrain: THREE.Mesh;
  terrainMat: THREE.MeshStandardMaterial;
  satTex: THREE.CanvasTexture | null;
  elevTex: THREE.CanvasTexture | null;
  water: THREE.Mesh;
  waterMat: THREE.MeshPhysicalMaterial;
  ring: THREE.Mesh;
  slopeMeshes: Map<string, THREE.Mesh>;
  sensorMarkers: Map<string, THREE.Mesh>;
  sensorRings: Map<string, THREE.Mesh>;
  gateways: THREE.Mesh[];
  commLines: THREE.LineSegments;
  settlementMeshes: THREE.Mesh[];
  river: THREE.Mesh;
  glacier: THREE.Mesh;
  floodGeo: THREE.TubeGeometry;
  floodMat: THREE.MeshBasicMaterial;
  flood: THREE.Mesh;
  epicenterRings: THREE.Mesh[];
  seismicGroup: THREE.Group;
  debris: THREE.Group;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  shake: { target: number; level: number };
  epicCenter: THREE.Vector3;
  setVisible: (obj: THREE.Object3D, v: boolean) => void;
}

export function DigitalTwinViewer({
  lake,
  twin,
  scenarioActive,
  scenarioKind,
  onSimulate,
  className,
}: {
  lake: Lake;
  twin: TwinState;
  scenarioActive: boolean;
  scenarioKind: ScenarioKind;
  onSimulate?: () => void;
  className?: string;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const anchorRefs = useRef<Map<string, THREE.Vector3>>(new Map());
  const handlesRef = useRef<SceneHandles | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("NORMAL");
  const [sel, setSel] = useState<{
    kind: "lake" | "sensor" | "slope" | "settlement" | "river";
    id?: string;
  } | null>(null);
  const [timeMode, setTimeMode] = useState<"hist" | "cur" | "scen">("cur");

  const displayRef = useRef({
    area: twin.lake.areaKm2,
    level: twin.lake.levelAnomalyM,
    elev: lake.elevationM,
    coords: formatCoord(lake.latitude, lake.longitude),
    risk: twin.riskScore,
  });

  const floodActive =
    viewMode === "FLOOD" ||
    (scenarioActive && (scenarioKind === "COMPOUND" || scenarioKind === "LANDSLIDE") && twin.step >= 0.85);

  /* ----------------------------- Build scene ------------------------------ */
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    } catch {
      setFailed(true);
      return;
    }

    setSel(null);
    setReady(false);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seed = hashString(lake.id);
    const noise = makeNoise(seed);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050b14);
    scene.fog = new THREE.Fog(0x050b14, 240, 560);

    const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 1200);
    camera.position.set(120, 105, 130);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";
    renderer.domElement.style.touchAction = "none";
    renderer.domElement.style.cursor = "grab";

    const hemi = new THREE.HemisphereLight(0xbdd7ff, 0x141d2b, 0.95);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff2dc, 1.35);
    sun.position.set(140, 180, 60);
    scene.add(sun);

    const LAKE_C = new THREE.Vector2(-10, -46);
    const OUTLET = new THREE.Vector2(-6, -12);
    const lakeR = 16 + Math.sqrt(lake.areaKm2) * 9;
    const riverX = (z: number) => Math.sin(z * 0.045) * 22 + (z + 12) * 0.06;
    const riverDist = (x: number, z: number) => {
      let minD = Infinity;
      for (let rz = OUTLET.y; rz <= SIZE / 2; rz += 6) {
        const dx = x - riverX(rz);
        const dz = z - rz;
        minD = Math.min(minD, Math.sqrt(dx * dx + dz * dz));
      }
      return minD;
    };
    const heightAt = (x: number, z: number): number => {
      let h =
        noise(x * 0.011 + 9, z * 0.011 + 3, 5) * 46 +
        noise(x * 0.05, z * 0.05, 3) * 7 -
        8;
      h += Math.max(0, -(z + 60)) * 0.34;
      h += Math.max(0, Math.abs(x) - 90) * 0.28;
      const rd = riverDist(x, z);
      h -= 14 * Math.exp(-(rd * rd) / (2 * 13 * 13));
      const dx = x - LAKE_C.x;
      const dz = z - LAKE_C.y;
      const d = Math.sqrt(dx * dx + dz * dz);
      const bowl = 1 - THREE.MathUtils.smoothstep(d, lakeR * 0.45, lakeR);
      h -= 17 * bowl;
      return h;
    };

    const WATER_Y = 7.2;
    const SNOW_LINE = 30;

    const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    let maxY = -Infinity;
    let maxPt = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h = heightAt(x, z);
      pos.setY(i, h);
      if (h > maxY) {
        maxY = h;
        maxPt.set(x, h, z);
      }
      const hx = heightAt(x + 2, z) - heightAt(x - 2, z);
      const hz = heightAt(x, z + 2) - heightAt(x, z - 2);
      const slope = Math.min(1, Math.sqrt(hx * hx + hz * hz) / 9);
      const dxl = x - LAKE_C.x;
      const dzl = z - LAKE_C.y;
      const dl = Math.sqrt(dxl * dxl + dzl * dzl);
      if (dl < lakeR * 1.15 && h < WATER_Y + 2.2) {
        c.setRGB(0.48, 0.42, 0.3);
      } else if (z < -78 && h > WATER_Y + 4) {
        const n = noise(x * 0.09, z * 0.09, 2);
        c.setRGB(0.72 + n * 0.2, 0.8 + n * 0.15, 0.92);
      } else if (h > SNOW_LINE || (h > SNOW_LINE - 8 && slope < 0.35)) {
        c.setRGB(0.88, 0.91, 0.95);
      } else if (slope > 0.62) {
        c.setRGB(0.33, 0.29, 0.27);
      } else {
        const t = THREE.MathUtils.clamp((h + 8) / 46, 0, 1);
        c.setRGB(0.24 + t * 0.22, 0.3 + t * 0.2, 0.26 + t * 0.18);
        if (z > 60 && slope < 0.4) c.setRGB(0.2, 0.32, 0.22);
      }
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.94, metalness: 0.04 });
    const terrain = new THREE.Mesh(geo, terrainMat);
    terrain.userData.kind = "terrain";
    scene.add(terrain);

    const satTex = makeImpressionTexture("satellite", seed);
    const elevTex = makeImpressionTexture("elevation", seed);

    /* -------------------------------- Water --------------------------------- */
    const waterGeo = new THREE.CircleGeometry(lakeR * 0.96, 64);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshPhysicalMaterial({
      color: 0x18b6d8,
      transparent: true,
      opacity: 0.82,
      roughness: 0.12,
      metalness: 0.1,
      transmission: 0.35,
      clearcoat: 0.6,
      emissive: 0x0a4a5c,
      emissiveIntensity: 0.35,
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.userData.kind = "lake";
    water.position.set(LAKE_C.x, WATER_Y, LAKE_C.y);
    water.scale.set(1.15, 1, 0.86);

    const ringGeo = new THREE.RingGeometry(lakeR * 0.96, lakeR * 1.02, 72);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.9, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(LAKE_C.x, WATER_Y + 0.25, LAKE_C.y);
    ring.scale.set(1.15, 1, 0.86);
    scene.add(water, ring);

    /* ------------------------------- Glacier -------------------------------- */
    const glacierGeo = new THREE.PlaneGeometry(64, 96, 10, 16);
    glacierGeo.rotateX(-Math.PI / 2);
    const gPos = glacierGeo.attributes.position as THREE.BufferAttribute;
    const gColors = new Float32Array(gPos.count * 3);
    for (let i = 0; i < gPos.count; i++) {
      const gx = gPos.getX(i) - 4;
      const gz = gPos.getZ(i) - 108;
      gPos.setX(i, gx);
      gPos.setZ(i, gz);
      gPos.setY(i, heightAt(gx, gz) + 0.7);
      const n = noise(gx * 0.14, gz * 0.14, 2);
      c.setRGB(0.78 + n * 0.16, 0.86 + n * 0.1, 0.97);
      gColors[i * 3] = c.r;
      gColors[i * 3 + 1] = c.g;
      gColors[i * 3 + 2] = c.b;
    }
    glacierGeo.setAttribute("color", new THREE.BufferAttribute(gColors, 3));
    glacierGeo.computeVertexNormals();
    const glacier = new THREE.Mesh(
      glacierGeo,
      new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.32, metalness: 0.05 })
    );
    glacier.userData.kind = "glacier";
    scene.add(glacier);

    /* ---------------------------- Downstream river --------------------------- */
    const riverPts: THREE.Vector3[] = [];
    for (let z = OUTLET.y; z <= 175; z += 8) {
      const x = riverX(z);
      riverPts.push(new THREE.Vector3(x, heightAt(x, z) + 0.9, z));
    }
    const riverCurve = new THREE.CatmullRomCurve3(riverPts);
    const riverGeo = new THREE.TubeGeometry(riverCurve, 80, 1.5, 8, false);
    const river = new THREE.Mesh(
      riverGeo,
      new THREE.MeshStandardMaterial({
        color: 0x2fc9e8,
        emissive: 0x0e5f74,
        emissiveIntensity: 0.7,
        roughness: 0.25,
      })
    );
    river.userData.kind = "river";
    scene.add(river);

    const coneGeo = new THREE.ConeGeometry(1.6, 4.5, 10);
    const coneMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9 });
    [0.25, 0.55, 0.85].forEach((t) => {
      const p = riverCurve.getPointAt(t);
      const tangent = riverCurve.getTangentAt(t);
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.position.copy(p).add(new THREE.Vector3(0, 2.4, 0));
      cone.lookAt(p.clone().add(tangent));
      cone.rotateX(Math.PI / 2);
      scene.add(cone);
    });

    /* ------------------------------- Slopes --------------------------------- */
    const slopeMeshes = new Map<string, THREE.Mesh>();
    SLOPE_DEFS.forEach((def) => {
      const radius = Math.max(def.width, def.depth) * 0.62;
      const sGeo = new THREE.CircleGeometry(radius, 40);
      sGeo.rotateX(-Math.PI / 2);
      const sm = new THREE.Mesh(
        sGeo,
        new THREE.MeshStandardMaterial({ color: 0x22c55e, transparent: true, opacity: 0.4, roughness: 0.7 })
      );
      const y = heightAt(def.x, def.z) + 0.35;
      sm.position.set(def.x, y, def.z);
      sm.rotation.z = def.rot ?? 0;
      sm.userData = { kind: "slope", id: def.id, name: def.name };
      sm.renderOrder = 2;
      slopeMeshes.set(def.id, sm);
      scene.add(sm);
    });

    /* ------------------------------ Sensors --------------------------------- */
    const sensorMarkers = new Map<string, THREE.Mesh>();
    const sensorRings = new Map<string, THREE.Mesh>();
    const gateways: THREE.Mesh[] = [];
    twin.sensors.forEach((s) => {
      const y = heightAt(s.x, s.z) + 3.6;
      const group = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.75, 2.6, 8), new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.5 }));
      group.position.set(s.x, y - 1.3, s.z);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.62, 12, 10), new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 0.5, roughness: 0.35 }));
      head.position.set(0, 2.2, 0);
      group.add(head);
      group.userData = { kind: "sensor", id: s.id, code: s.code };
      const ringGeo2 = new THREE.RingGeometry(0.9, 1.15, 24);
      ringGeo2.rotateX(-Math.PI / 2);
      const ringM = new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0, side: THREE.DoubleSide });
      const pulse = new THREE.Mesh(ringGeo2, ringM);
      pulse.position.set(s.x, y + 1.9, s.z);
      const baseHead = head as THREE.Mesh;
      baseHead.material = new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 0.5, roughness: 0.35 });
      sensorMarkers.set(s.id, baseHead);
      sensorRings.set(s.id, pulse);
      scene.add(group, pulse);
      void ringGeo2;
    });

    // IoT gateway + communication lines
    const gw = new THREE.Mesh(
      new THREE.CylinderGeometry(1.4, 2.1, 4.2, 6),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0e7490, emissiveIntensity: 0.4, roughness: 0.4 })
    );
    gw.position.set(LAKE_C.x + 6, 12, LAKE_C.y + 22);
    gw.rotation.y = 0.5;
    gw.userData = { kind: "gateway" };
    gateways.push(gw);
    scene.add(gw);

    const commPts: number[] = [];
    twin.sensors.forEach((s) => {
      const y = heightAt(s.x, s.z) + 3.6;
      commPts.push(s.x, y + 0.2, s.z);
      commPts.push(gw.position.x, gw.position.y + 0.2, gw.position.z);
    });
    const commGeo = new THREE.BufferGeometry();
    commGeo.setAttribute("position", new THREE.Float32BufferAttribute(commPts, 3));
    const commMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35 });
    const commLines = new THREE.LineSegments(commGeo, commMat);
    commLines.visible = false;
    scene.add(commLines);

    /* ---------------------------- Settlements ------------------------------- */
    const settlementMeshes: THREE.Mesh[] = [];
    const settleNames = lake.settlementsDownstream.length >= 3 ? lake.settlementsDownstream : ["Village A", "Village B", "Village C"];
    [34, 72, 112].forEach((z, i) => {
      const x = riverX(z);
      const y = heightAt(x, z) + 0.4;
      const hut = new THREE.Mesh(new THREE.BoxGeometry(4.4, 2.4, 3.4), new THREE.MeshStandardMaterial({ color: 0xc2a27a, roughness: 0.85 }));
      hut.position.set(x - 6, y + 1.2, z + 2);
      hut.userData = { kind: "settlement", id: `st-${i}`, name: settleNames[i] ?? `Settlement ${i + 1}` };
      const roof = new THREE.Mesh(new THREE.ConeGeometry(3.4, 1.6, 4), new THREE.MeshStandardMaterial({ color: 0x7c6f52, roughness: 0.9 }));
      roof.position.set(x - 6, y + 3.1, z + 2);
      roof.rotation.y = Math.PI / 4;
      scene.add(hut, roof);
      settlementMeshes.push(hut);
    });

    /* ------------------------------ Flood mesh ------------------------------ */
    const floodGeo = new THREE.TubeGeometry(riverCurve, 80, 3.4, 8, false);
    const floodMat = new THREE.MeshBasicMaterial({ color: 0xff6b4a, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });

    /* ------------------------------ Seismic --------------------------------- */
    const seismicGroup = new THREE.Group();
    const epicCenter = new THREE.Vector3(70, heightAt(70, -24) + 2, -24);
    const epicenterRings: THREE.Mesh[] = [];
    for (let i = 0; i < 3; i++) {
      const rg = new THREE.RingGeometry(6, 9, 48);
      rg.rotateX(-Math.PI / 2);
      const rm = new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
      const ringM2 = new THREE.Mesh(rg, rm);
      ringM2.position.copy(epicCenter);
      seismicGroup.add(ringM2);
      epicenterRings.push(ringM2);
    }
    const epicMarker = new THREE.Mesh(new THREE.SphereGeometry(2.2, 16, 14), new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.6 }));
    epicMarker.position.copy(epicCenter).add(new THREE.Vector3(0, 2, 0));
    seismicGroup.add(epicMarker);
    seismicGroup.visible = false;
    scene.add(seismicGroup);

    /* -------------------------------- Debris -------------------------------- */
    const debris = new THREE.Group();
    const debrisMat = new THREE.MeshStandardMaterial({ color: 0x9a6b4a, roughness: 0.95 });
    const debrisBall = new THREE.Mesh(new THREE.SphereGeometry(1.8, 14, 12), debrisMat);
    debris.add(debrisBall);
    const debrisBall2 = new THREE.Mesh(new THREE.SphereGeometry(1.2, 10, 10), debrisMat);
    debrisBall2.position.set(1.6, 1.1, 0.9);
    debris.add(debrisBall2);
    debris.visible = false;
    scene.add(debris);

    /* ------------------------------- Controls ------------------------------- */
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(LAKE_C.x, WATER_Y + 6, LAKE_C.y + 26);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 55;
    controls.maxDistance = 320;
    controls.maxPolarAngle = 1.42;
    controls.autoRotate = !reduceMotion;
    controls.autoRotateSpeed = 0.45;
    controls.addEventListener("start", () => {
      controls.autoRotate = false;
    });

    const handle = Ref_h(
      scene, camera, renderer, controls,
      terrain, terrainMat, satTex, elevTex, water, ring,
      slopeMeshes, sensorMarkers, sensorRings, gateways, commLines,
      settlementMeshes, river, glacier, floodGeo, floodMat,
      epicenterRings, seismicGroup, epicCenter, debris,
    );
    handle.flood.renderOrder = 3;
    handle.flood.userData.kind = "flood";
    scene.add(handle.flood);
    handlesRef.current = handle;

    /* --------------------------- Anchors & labels ---------------------------- */
    anchorRefs.current = new Map();
    anchorRefs.current.set("area", new THREE.Vector3(LAKE_C.x, WATER_Y + 9, LAKE_C.y));
    anchorRefs.current.set("level", new THREE.Vector3(LAKE_C.x + lakeR * 1.3, WATER_Y + 4, LAKE_C.y));
    anchorRefs.current.set("elev", maxPt.clone().add(new THREE.Vector3(0, 10, 0)));
    anchorRefs.current.set("coords", new THREE.Vector3(LAKE_C.x, WATER_Y + 3, LAKE_C.y + lakeR * 1.6));
    anchorRefs.current.set("risk", new THREE.Vector3(OUTLET.x, WATER_Y + 8, OUTLET.y + 6));

    /* ------------------------------ Click -------------------------------- */
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const pickables = [
      water, river, ...Array.from(slopeMeshes.values()),
      ...Array.from(sensorMarkers.values()), gw, ...settlementMeshes,
    ];
    const onClick = (e: MouseEvent) => {
      const rect = (renderer.domElement as HTMLCanvasElement).getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(pickables, false);
      const hit = hits.find((h) => h.object.userData.kind && h.object.userData.kind !== "terrain");
      if (!hit) {
        setSel(null);
        return;
      }
      const o = hit.object;
      if (o.userData.kind === "sensor") setSel({ kind: "sensor", id: o.userData.id });
      else if (o.userData.kind === "slope") setSel({ kind: "slope", id: o.userData.id });
      else if (o.userData.kind === "settlement") setSel({ kind: "settlement", id: o.userData.id });
      else if (o.userData.kind === "river") setSel({ kind: "river" });
      else if (o.userData.kind === "lake") setSel({ kind: "lake" });
    };
    renderer.domElement.addEventListener("click", onClick);

    const onMove = (e: MouseEvent) => {
      const rect = (renderer.domElement as HTMLCanvasElement).getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(pickables, false);
      const over = hits.some((h) => h.object.userData.kind && h.object.userData.kind !== "terrain");
      renderer.domElement.style.cursor = over ? "pointer" : "grab";
    };
    renderer.domElement.addEventListener("mousemove", onMove);

    /* ------------------------------ Resize -------------------------------- */
    const resize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    const updateLabels = (cam: THREE.PerspectiveCamera, mountEl: HTMLDivElement, h: SceneHandles | null) => {
      const w = mountEl.clientWidth;
      const hgt = mountEl.clientHeight;
      const tmpV = new THREE.Vector3();
      anchorRefs.current.forEach((anchor, id) => {
        const el = labelRefs.current.get(id);
        if (!el || !h) return;
        tmpV.copy(anchor).project(cam);
        if (tmpV.z > 1 || tmpV.z < -1) {
          el.style.opacity = "0";
          return;
        }
        el.style.opacity = "1";
        const x = ((tmpV.x + 1) / 2) * w;
        const y = ((-tmpV.y + 1) / 2) * hgt;
        el.style.transform = `translate(-50%, -110%) translate(${x}px, ${y}px)`;
      });
    };

    /* ---------------------------- Render loop ------------------------------ */
    let raf = 0;
    const clock = new THREE.Clock();
    let firstFrame = true;
    const anim = () => {
      raf = requestAnimationFrame(anim);
      const t = clock.getElapsedTime();

      // scan pulse
      const scan = !reduceMotion && viewMode === "NORMAL";
      if (handle) {
        const ringObj = handle.ring;
        if (scan) {
          const s = 1 + ((t * 0.35) % 1) * 0.9;
          ringObj.scale.set(1.15 * s, 1, 0.86 * s);
          (ringObj.material as THREE.MeshBasicMaterial).opacity = 0.5 * (1 - ((t * 0.35) % 1));
        } else {
          ringObj.scale.set(1.15, 1, 0.86);
          (ringObj.material as THREE.MeshBasicMaterial).opacity = 0.9;
        }

        // sensor pulses
        if (viewMode === "SENSORS" || floodActive) {
          handle.sensorRings.forEach((r) => {
            const d = 1 + ((t * 0.6 + (r.position.x * 13)) % 1) * 1.4;
            r.scale.set(d, d, 1);
            (r.material as THREE.MeshBasicMaterial).opacity = 0.5 * (1 - ((t * 0.6 + r.position.x * 0.13) % 1));
          });
        }

        // seismic rings
        if (viewMode === "SEISMIC" || ((scenarioKind === "EARTHQUAKE" || scenarioKind === "COMPOUND") && scenarioActive)) {
          handle.epicenterRings.forEach((ringObj, i) => {
            const ph = (t * 0.55 + i / 3) % 1;
            const rad = 8 + ph * 34;
            ringObj.scale.set(rad / 8, 1, rad / 8);
            const m = ringObj.material as THREE.MeshBasicMaterial;
            m.opacity = 0.55 * (1 - ph);
            m.color.setHex(ph > 0.55 ? 0xf59e0b : 0xef4444);
          });
        }

        // flood pulse
        if ((floodActive && handle.floodMat.opacity > 0.3) || viewMode === "FLOOD") {
          const f = (t * 0.7) % 1;
          handle.floodMat.opacity = 0.34 + Math.sin(t * 3) * 0.14;
          handle.flood.scale.set(1 + f * 0.12, 1, 1 + f * 0.12);
        }

        // debris motion toward the lake
        if (handle.debris.visible) {
          const dz = handle.debris;
          const failing = twin.slopes.find((s) => s.failing);
          const from =
            failing
              ? new THREE.Vector3(failing.x, 0, failing.z)
              : new THREE.Vector3(SLOPE_DEFS[0].x, 0, SLOPE_DEFS[0].z);
          const to = new THREE.Vector3(-6, 0, -44);
          const k = Math.min(1, Math.max(0, (twin.step - 0.4) / 0.55));
          dz.position.lerpVectors(from, to, k);
          dz.position.y = 4 + (1 - k) * 3 + Math.sin(t * 9) * 0.25;
        }

        // camera shake
        const shakeLevel = handle.shake.level;
        if (shakeLevel > 0.01) {
          camera.position.x += Math.cos(t * 31) * 0.28 * shakeLevel;
          camera.position.y += Math.sin(t * 27) * 0.22 * shakeLevel;
        }
      }

      controls.update();
      renderer.render(scene, camera);
      updateLabels(camera, mount, handle);
      if (firstFrame) {
        firstFrame = false;
        setReady(true);
      }
    };
    anim();

    /* ---------------------------- Shake decay ------------------------------- */
    const shakeDriver = () => {
      const h = handlesRef.current;
      if (!h) return;
      const driving =
        (scenarioKind === "EARTHQUAKE" || scenarioKind === "COMPOUND") &&
        scenarioActive &&
        twin.step > 0.04 &&
        twin.step < 1;
      const target = driving ? 0.9 * (1 - twin.step * 0.35) : viewMode === "SEISMIC" ? 0.25 : 0;
      h.shake.level += (target - h.shake.level) * 0.12;
    };
    shakeDriver();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener("click", onClick);
      renderer.domElement.removeEventListener("mousemove", onMove);
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const m = obj.material;
          if (Array.isArray(m)) m.forEach((mm) => mm.dispose());
          else m.dispose();
        }
      });
      commGeo.dispose();
      commMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
      handlesRef.current = null;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lake.id]);

  /* --------------------- Dynamic material/visibility sync ------------------- */
  useEffect(() => {
    const h = handlesRef.current;
    if (!h) return;
    const t = twin;

    // Slope zone coloring
    for (const slope of t.slopes) {
      const m = h.slopeMeshes.get(slope.id);
      if (!m) continue;
      const mat = m.material as THREE.MeshStandardMaterial;
      const col = new THREE.Color(failureColor(slope.failureProbPct));
      mat.color.copy(col);
      mat.emissive.copy(col).multiplyScalar(0.25);
      mat.opacity = slope.failing ? 0.85 : 0.42;
      // failing zone pulse handled in render loop by material color shift
      if (slope.failing) mat.color.multiplyScalar(0.6 + 0.4 * Math.abs(Math.sin(Date.now() * 0.008)));
    }

    // Sensor status coloring + ring emission
    for (const s of t.sensors) {
      const marker = h.sensorMarkers.get(s.id);
      if (marker) {
        const m = marker.material as THREE.MeshStandardMaterial;
        const col =
          s.status === "ALERT" ? "#EF4444" : s.status === "WARNING" ? "#F59E0B" : "#10B981";
        m.color.set(col);
        m.emissive.set(col);
      }
      const ring = h.sensorRings.get(s.id);
      if (ring) {
        const m = ring.material as THREE.MeshBasicMaterial;
        m.color.set(s.status === "ALERT" ? 0xef4444 : s.status === "WARNING" ? 0xf59e0b : 0x67e8f9);
      }
    }

    // Water level & area follow twin lake state
    const baseLevel = displayRef.current.level;
    const dy = (t.lake.levelAnomalyM - baseLevel) * 0.55;
    h.water.position.y = 7.2 + dy;
    h.ring.position.y = 7.2 + dy + 0.25;
    const areaScale = 1 + ((t.lake.areaKm2 - displayRef.current.area) / Math.max(0.01, displayRef.current.area)) * 0.5;
    h.water.scale.set(1.15 * areaScale, 1, 0.86 * areaScale);
    h.ring.scale.set(1.15 * areaScale, 1, 0.86 * areaScale);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [twin, viewMode === "SEISMIC" || viewMode === "SENSORS"]);

  /* ------------------------------- View mode -------------------------------- */
  useEffect(() => {
    const h = handlesRef.current;
    if (!h) return;
    const { setVisible } = h;

    // terrain material
    if (viewMode === "SATELLITE" && h.satTex) {
      h.terrain.material = new THREE.MeshStandardMaterial({ map: h.satTex, roughness: 0.9, metalness: 0.03 });
    } else if (viewMode === "ELEVATION" && h.elevTex) {
      h.terrain.material = new THREE.MeshStandardMaterial({ map: h.elevTex, roughness: 0.92 });
    } else {
      h.terrain.material = h.terrainMat;
    }

    setVisible(h.water, true);
    setVisible(h.ring, true);
    setVisible(h.glacier, viewMode !== "SENSORS");
    setVisible(h.river, true);
    for (const [, m] of h.slopeMeshes) setVisible(m, viewMode === "SLOPE_RISK" || viewMode === "LANDSLIDE");
    for (const m of h.settlementMeshes) setVisible(m, true);
    setVisible(h.commLines, viewMode === "SENSORS");
    for (const [, ring] of h.sensorRings) setVisible(ring, viewMode === "SENSORS" || viewMode === "FLOOD" || viewMode === "SEISMIC");
    for (const [, marker] of h.sensorMarkers) {
      const parent = marker.parent;
      if (parent) setVisible(parent, viewMode === "SENSORS" || viewMode === "SEISMIC" || viewMode === "FLOOD" || viewMode === "SLOPE_RISK" || viewMode === "LANDSLIDE");
    }
    for (const gw of h.gateways) setVisible(gw, viewMode === "SENSORS");
    setVisible(h.seismicGroup, viewMode === "SEISMIC" || ((scenarioKind === "EARTHQUAKE" || scenarioKind === "COMPOUND") && scenarioActive && twin.step > 0.04));
    h.floodMat.opacity = floodActive ? 0.42 : 0;
    h.floodMat.color.set(viewMode === "FLOOD" ? 0xff6b4a : 0xff9f43);
    setVisible(h.flood, viewMode === "FLOOD" || floodActive);
    h.debris.visible =
      scenarioActive && (scenarioKind === "LANDSLIDE" || scenarioKind === "COMPOUND") && twin.step > 0.38;

    // anchors
    if (viewMode === "SLOPE_RISK" || viewMode === "LANDSLIDE") {
      twin.slopes.forEach((sl) => {
        anchorRefs.current.set(`zone:${sl.id}`, new THREE.Vector3(sl.x, 12, sl.z));
      });
    } else {
      twin.slopes.forEach((sl) => anchorRefs.current.delete(`zone:${sl.id}`));
    }
    if (viewMode === "SENSORS") {
      twin.sensors.forEach((s) => {
        anchorRefs.current.set(`sensor:${s.code}`, new THREE.Vector3(s.x, 10, s.z));
      });
    } else {
      twin.sensors.forEach((s) => anchorRefs.current.delete(`sensor:${s.code}`));
    }
    if (viewMode === "SEISMIC" || ((scenarioKind === "EARTHQUAKE" || scenarioKind === "COMPOUND") && scenarioActive)) {
      anchorRefs.current.set("epic", h.epicCenter.clone().add(new THREE.Vector3(0, 8, 0)));
    } else {
      anchorRefs.current.delete("epic");
    }
    if (viewMode === "FLOOD") {
      anchorRefs.current.set("flood", new THREE.Vector3(-6, 14, 24));
    } else {
      anchorRefs.current.delete("flood");
    }

    // shake target
    h.shake.target =
      (scenarioKind === "EARTHQUAKE" || scenarioKind === "COMPOUND") && scenarioActive && twin.step > 0.04 && twin.step < 1
        ? 0.9 * (1 - twin.step * 0.35)
        : viewMode === "SEISMIC"
          ? 0.22
          : 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, scenarioActive, scenarioKind, twin.step]);

  /* ------------------------------ Label values ------------------------------ */
  const riskColor =
    twin.riskLevel === "CRITICAL"
      ? RISK_COLORS.CRITICAL
      : twin.riskLevel === "HIGH"
        ? RISK_COLORS.HIGH
        : twin.riskLevel === "MODERATE"
          ? RISK_COLORS.MODERATE
          : RISK_COLORS.LOW;

  const labels: TwinLabel[] = [];
  labels.push(
    { id: "area", caption: "Lake Area", value: `${twin.lake.areaKm2.toFixed(2)} km²`, color: "#F8FAFC" },
    { id: "level", caption: "Water Level", value: `${twin.lake.levelAnomalyM >= 0 ? "+" : ""}${twin.lake.levelAnomalyM.toFixed(2)} m`, color: "#F8FAFC" },
    { id: "elev", caption: "Elevation", value: `${lake.elevationM.toLocaleString()} m`, color: "#F8FAFC" },
    { id: "coords", caption: "Coordinates", value: displayRef.current.coords, color: "#F8FAFC" },
    {
      id: "risk",
      caption: "Estimated Risk",
      value: `${Math.round(twin.riskScore)}${twin.riskDelta !== 0 ? ` (${twin.riskDelta > 0 ? "+" : ""}${twin.riskDelta})` : ""}`,
      color: riskColor,
    }
  );
  if (viewMode === "SLOPE_RISK" || viewMode === "LANDSLIDE") {
    for (const sl of twin.slopes) {
      labels.push({ id: `zone:${sl.id}`, caption: sl.name, value: `${sl.failureProbPct.toFixed(0)}%`, color: failureColor(sl.failureProbPct) });
    }
  }
  if (viewMode === "SENSORS") {
    for (const s of twin.sensors) {
      const col = s.status === "ALERT" ? "#EF4444" : s.status === "WARNING" ? "#F59E0B" : "#10B981";
      labels.push({ id: `sensor:${s.code}`, caption: s.label, value: `${s.value.toFixed(s.decimals)} ${s.unit}`, color: col });
    }
  }
  if (viewMode === "SEISMIC") {
    labels.push({
      id: "epic",
      caption: "Seismic",
      value: twin.seismic.magnitude ? `M${twin.seismic.magnitude.toFixed(1)} detected` : "Network idle",
      color: "#F59E0B",
    });
  }
  if (viewMode === "FLOOD") {
    labels.push({ id: "flood", caption: "Scenario Corridor", value: "Estimate", color: "#FF6B4A" });
  }

  /* ------------------------------ Selection panel --------------------------- */
  const selSensor = sel?.kind === "sensor" ? twin.sensors.find((s) => s.id === sel.id) : undefined;
  const selSlope = sel?.kind === "slope" ? twin.slopes.find((s) => s.id === sel.id) : undefined;
  const selSettlementName =
    sel?.kind === "settlement"
      ? lake.settlementsDownstream[Number(sel.id?.replace("st-", ""))] ?? "Settlement"
      : undefined;

  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-border bg-bg ${className ?? ""}`}
      role="img"
      aria-label={`3D Digital Twin of ${lake.name}. Estimated risk ${Math.round(twin.riskScore)} of 100 (${twin.riskLevel}).`}
    >
      <div ref={mountRef} className="h-full w-full" />

      {/* Labels */}
      {!failed &&
        labels.map((l) => (
          <div
            key={l.id}
            ref={(el) => {
              if (el) labelRefs.current.set(l.id, el);
              else labelRefs.current.delete(l.id);
            }}
            className="pointer-events-none absolute top-0 left-0 z-10 opacity-0 transition-opacity duration-300 will-change-transform"
          >
            <div className="glass rounded-md px-2 py-1 shadow-lg">
              <p className="text-[8.5px] font-semibold tracking-[0.14em] text-faint uppercase">{l.caption}</p>
              <p className="font-mono text-[11px] leading-tight font-semibold" style={{ color: l.color }}>
                {l.value}
              </p>
            </div>
          </div>
        ))}

      {/* Top-left: view mode controls */}
      <div className="absolute top-2 left-2 z-30 max-w-[calc(100%-1rem)]">
        <div className="no-scrollbar flex max-w-full gap-1 overflow-x-auto rounded-lg border border-border bg-surface/90 p-1 backdrop-blur">
          {VIEW_MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setViewMode(m.id)}
              aria-pressed={viewMode === m.id}
              className={`cursor-pointer whitespace-nowrap rounded-md px-2 py-1 text-[10.5px] font-medium transition-colors ${
                viewMode === m.id ? "bg-primary/20 text-primary" : "text-muted hover:bg-elevated hover:text-text"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Time mode (conceptual) */}
        <div className="mt-1 inline-flex items-center gap-0.5 rounded-md border border-border bg-surface/90 px-1 py-0.5 backdrop-blur">
          {(
            [
              ["hist", "Hist"],
              ["cur", "Current"],
              ["scen", "Scenario"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTimeMode(id)}
              className={`cursor-pointer rounded px-1.5 py-0.5 text-[9px] font-medium ${
                timeMode === id ? "bg-primary/20 text-primary" : "text-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Scenario active flag */}
      {scenarioActive && (
        <div className="absolute top-2 right-2 z-30 flex items-center gap-1.5 rounded-md border border-high/50 bg-high/15 px-2 py-1 backdrop-blur">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-high opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-high" />
          </span>
          <span className="text-[10px] font-semibold tracking-wider text-high uppercase">Scenario active</span>
        </div>
      )}

      {/* Bottom overlay */}
      <div className="absolute right-2 bottom-2 z-20 flex items-center gap-1.5">
        <Badge tone={scenarioActive ? "high" : "primary"}>
          {scenarioActive ? `Simulating · ${Math.round(twin.step * 100)}%` : "Digital twin · demo"}
        </Badge>
      </div>
      <p className="pointer-events-none absolute bottom-2 left-2 z-10 hidden font-mono text-[9px] text-faint sm:block">
        click objects to inspect · drag rotate · scroll zoom
      </p>

      {/* Selection panel */}
      {sel && (
        <div className="absolute right-2 bottom-10 z-30 w-64 max-w-[calc(100%-1rem)]">
          <div className="rounded-lg border border-border bg-surface/95 p-3 shadow-xl backdrop-blur">
            <div className="mb-2 flex items-start justify-between gap-2">
              <p className="font-display text-xs font-bold tracking-wide uppercase">
                {sel.kind === "lake" && lake.name}
                {sel.kind === "sensor" && (selSensor?.label ?? "Sensor")}
                {sel.kind === "slope" && (selSlope?.name ?? "Slope zone")}
                {sel.kind === "settlement" && (selSettlementName ?? "Settlement")}
                {sel.kind === "river" && "Downstream river"}
              </p>
              {sel.kind !== "river" && sel.kind !== "settlement" && (
                <span className="font-mono text-[9px] text-faint">{sel.kind === "sensor" ? selSensor?.code : selSlope?.id}</span>
              )}
              <button
                onClick={() => setSel(null)}
                aria-label="Close inspection panel"
                className="cursor-pointer text-faint hover:text-text"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {sel.kind === "lake" && (
              <dl className="space-y-1 text-[11px]">
                <Row k="Elevation" v={`${lake.elevationM.toLocaleString()} m`} />
                <Row k="Area" v={`${twin.lake.areaKm2.toFixed(2)} km²`} />
                <Row k="Est. volume" v={`${twin.lake.volumeMm3} Mm³`} />
                <Row k="Water level" v={`${twin.lake.levelAnomalyM >= 0 ? "+" : ""}${twin.lake.levelAnomalyM.toFixed(2)} m`} />
                <Row k="Area trend" v={lake.areaGrowthRatePctPerYear > 6 ? "↑ Increasing" : "→ Stable"} highlight />
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-[10px] text-faint">GLOF risk</span>
                  <span className="font-mono text-xs font-semibold" style={{ color: riskColor }}>
                    {Math.round(twin.riskScore)}% · {twin.riskLevel}
                  </span>
                </div>
                <div className="pt-2">
                  <ButtonLink href="/lake-analytics" variant="outline" size="sm" className="w-full">
                    <LineChartIcon className="h-3 w-3" aria-hidden /> View lake analytics
                  </ButtonLink>
                </div>
              </dl>
            )}

            {sel.kind === "sensor" && selSensor && (
              <dl className="space-y-1 text-[11px]">
                <Row k="Type" v={selSensor.label} />
                <Row k="Current" v={`${selSensor.value.toFixed(selSensor.decimals)} ${selSensor.unit}`} highlight />
                <Row k="Trend" v={selSensor.trend === "up" ? "↑ Increasing" : selSensor.trend === "down" ? "↓ Decreasing" : "→ Stable"} highlight />
                <Row k="Status" v={selSensor.status} />
                <Row k="Battery" v={`${selSensor.batteryPct}%`} />
                <Row k="Last update" v={`${selSensor.lastUpdateSecAgo}s ago`} />
                <div className="mt-1.5 flex gap-1 rounded border border-border bg-elevated p-1.5" aria-label="Sensor mini trend">
                  {sensorSpark(selSensor.code).map((v, i) => (
                    <span
                      key={i}
                      className="h-6 w-1.5 rounded-sm"
                      style={{
                        background: selSensor.status === "ALERT" ? "#EF4444" : selSensor.trend === "up" ? "#F97316" : "#22D3EE",
                        opacity: 0.35 + (v / 100) * 0.65,
                      }}
                    />
                  ))}
                </div>
              </dl>
            )}

            {sel.kind === "slope" && selSlope && (
              <dl className="space-y-1 text-[11px]">
                <Row k="Stability" v={`${selSlope.stabilityPct.toFixed(0)}%`} />
                <Row k="Ground displacement" v={`${selSlope.displacementMmDay.toFixed(1)} mm/day`} highlight />
                <Row k="Pore pressure" v={`${selSlope.porePressureKPa.toFixed(1)} kPa`} />
                <Row k="Soil moisture" v={`${selSlope.soilMoisturePct.toFixed(0)}%`} />
                <Row k="Rainfall" v={`${twin.telemetry.rainfallMmHr.toFixed(1)} mm/hr`} />
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-[10px] text-faint">Failure probability</span>
                  <span className="font-mono text-xs font-semibold" style={{ color: failureColor(selSlope.failureProbPct) }}>
                    {selSlope.failureProbPct.toFixed(0)}%
                  </span>
                </div>
                {!scenarioActive && onSimulate && (
                  <div className="pt-2">
                    <Button size="sm" variant="danger" className="w-full" onClick={onSimulate}>
                      <Footprints className="h-3 w-3" aria-hidden /> Simulate failure
                    </Button>
                  </div>
                )}
              </dl>
            )}

            {sel.kind === "settlement" && (
              <dl className="space-y-1 text-[11px]">
                <Row k="Type" v="Settlement (demo)" />
                <Row k="Exposure estimate" v={`${(lake.exposureEstimate / Math.max(1, lake.settlementsDownstream.length)).toFixed(0)} people-equivalent`} />
                <Row k="Distance downstream" v={`~${(Number(sel.id?.replace("st-", "")) + 1) * 4.5} km`} />
                {floodActive && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-[10px] text-faint">Scenario flood risk</span>
                    <span className="font-mono text-xs font-semibold text-critical">HIGH</span>
                  </div>
                )}
              </dl>
            )}

            {sel.kind === "river" && (
              <dl className="space-y-1 text-[11px]">
                <Row k="Flow" v="Melt + rainfall fed (demo)" />
                <Row k="Scenario corridor" v={floodActive ? "Flood wave propagating downstream" : "Baseline channel"} />
                <Row k="Depth classes" v="d1–d5 schematic" />
              </dl>
            )}

            {/* Source attribution */}
            <p className="mt-2 text-[9px] leading-snug text-faint">
              Prototype state · not a real observation. Scenario outputs are estimates.
            </p>
          </div>
        </div>
      )}

      {/* Loading */}
      {!ready && !failed && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 bg-bg">
          <div className="skeleton h-2 w-44" />
          <p className="font-mono text-xs text-muted">Initializing digital twin…</p>
          <div className="w-56">
            <div className="skeleton h-1.5 w-full" />
          </div>
        </div>
      )}

      {failed && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-2 bg-bg p-6 text-center">
          <p className="text-sm font-semibold text-text">3D view unavailable</p>
          <p className="max-w-xs text-xs text-muted">
            WebGL could not be initialised in this browser. All Digital Twin metrics remain available
            in the panels around it.
          </p>
        </div>
      )}
    </div>
  );
}

function Row({ k, v, highlight }: { k: string; v: string; highlight?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-[10px] tracking-wide text-faint uppercase">{k}</dt>
      <dd className={`font-mono text-[11px] ${highlight ? "font-semibold text-text" : "text-muted"}`}>{v}</dd>
    </div>
  );
}

function sensorSpark(seedStr: string) {
  const rand = mulberry32(hashString(`spark:${seedStr}`));
  let v = 30 + rand() * 30;
  const out: number[] = [];
  for (let i = 0; i < 12; i++) {
    out.push(Math.round(v));
    v += (rand() - 0.42) * 22;
    v = Math.max(4, Math.min(100, v));
  }
  return out;
}

function Ref_h(
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer,
  controls: OrbitControls,
  terrain: THREE.Mesh,
  terrainMat: THREE.MeshStandardMaterial,
  satTex: THREE.CanvasTexture | null,
  elevTex: THREE.CanvasTexture | null,
  water: THREE.Mesh,
  ring: THREE.Mesh,
  slopeMeshes: Map<string, THREE.Mesh>,
  sensorMarkers: Map<string, THREE.Mesh>,
  sensorRings: Map<string, THREE.Mesh>,
  gateways: THREE.Mesh[],
  commLines: THREE.LineSegments,
  settlementMeshes: THREE.Mesh[],
  river: THREE.Mesh,
  glacier: THREE.Mesh,
  floodGeo: THREE.TubeGeometry,
  floodMat: THREE.MeshBasicMaterial,
  epicenterRings: THREE.Mesh[],
  seismicGroup: THREE.Group,
  epicCenter: THREE.Vector3,
  debris: THREE.Group,
): SceneHandles {
  const flood = new THREE.Mesh(floodGeo, floodMat);
  const setVisible = (obj: THREE.Object3D, v: boolean) => {
    obj.visible = v;
  };
  return {
    terrain,
    terrainMat,
    satTex,
    elevTex,
    water,
    waterMat: water.material as THREE.MeshPhysicalMaterial,
    ring,
    slopeMeshes,
    sensorMarkers,
    sensorRings,
    gateways,
    commLines,
    settlementMeshes,
    river,
    glacier,
    floodGeo,
    floodMat,
    flood,
    epicenterRings,
    seismicGroup,
    debris,
    camera,
    controls,
    renderer,
    scene,
    shake: { target: 0, level: 0 },
    epicCenter,
    setVisible,
  };
}