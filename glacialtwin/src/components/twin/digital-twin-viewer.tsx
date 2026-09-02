"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { Lake } from "@/lib/types";
import { RISK_COLORS } from "@/lib/config";
import { formatCoord, hashString, mulberry32 } from "@/lib/utils";
import { Badge } from "@/components/ui/feedback";

/**
 * DIGITAL TWIN 3D VIEWER
 *
 * A stylised pseudo-3D terrain representation driven entirely by the lake's
 * Digital Twin state (area, water level, elevation, coordinates, risk).
 * Terrain is procedurally generated per-lake; swap this renderer for real
 * DEM tiles / Cesium without changing the data layer.
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

interface LabelDef {
  id: string;
  caption: string;
  anchor: THREE.Vector3;
}

export function DigitalTwinViewer({
  lake,
  riskScore,
  className,
}: {
  lake: Lake;
  riskScore: number;
  className?: string;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const anchorRefs = useRef<LabelDef[]>([]);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  // Keep latest display values available to the render loop without rebuilding the scene.
  const displayRef = useRef({ area: lake.areaKm2, level: lake.waterLevelAnomalyM, elev: lake.elevationM, coords: formatCoord(lake.latitude, lake.longitude), risk: riskScore });
  displayRef.current = { area: lake.areaKm2, level: lake.waterLevelAnomalyM, elev: lake.elevationM, coords: formatCoord(lake.latitude, lake.longitude), risk: riskScore };

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

    const seed = hashString(lake.id);
    const noise = makeNoise(seed);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ------------------------------ Scene setup ----------------------------- */
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050b14);
    scene.fog = new THREE.Fog(0x050b14, 240, 560);

    const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 1200);
    camera.position.set(120, 105, 130);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";
    renderer.domElement.style.touchAction = "none";

    const hemi = new THREE.HemisphereLight(0xbdd7ff, 0x141d2b, 0.95);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff2dc, 1.35);
    sun.position.set(140, 180, 60);
    scene.add(sun);

    /* --------------------------- Terrain definition -------------------------- */
    const LAKE_C = new THREE.Vector2(-10, -46); // lake centre (x,z)
    const OUTLET = new THREE.Vector2(-6, -12);
    const lakeR = 16 + Math.sqrt(lake.areaKm2) * 9;

    const riverX = (z: number) => Math.sin(z * 0.045) * 22 + (z + 12) * 0.06;

    const riverDist = (x: number, z: number) => {
      // Sample river centreline coarsely
      let minD = Infinity;
      for (let rz = OUTLET.y; rz <= SIZE / 2; rz += 6) {
        const dx = x - riverX(rz);
        const dz = z - rz;
        const d = Math.sqrt(dx * dx + dz * dz);
        if (d < minD) minD = d;
      }
      return minD;
    };

    const heightAt = (x: number, z: number): number => {
      let h =
        noise(x * 0.011 + 9, z * 0.011 + 3, 5) * 46 +
        noise(x * 0.05, z * 0.05, 3) * 7 -
        8;
      // Mountain wall rising to the north (glacier zone)
      h += Math.max(0, -(z + 60)) * 0.34;
      // Eastern & western ridges frame the valley
      h += Math.max(0, Math.abs(x) - 90) * 0.28;
      // Carve downstream valley
      const rd = riverDist(x, z);
      h -= 14 * Math.exp(-(rd * rd) / (2 * 13 * 13));
      // Lake basin
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

      // Slope estimate
      const hx = heightAt(x + 2, z) - heightAt(x - 2, z);
      const hz = heightAt(x, z + 2) - heightAt(x, z - 2);
      const slope = Math.min(1, Math.sqrt(hx * hx + hz * hz) / 9);

      const dxl = x - LAKE_C.x;
      const dzl = z - LAKE_C.y;
      const dl = Math.sqrt(dxl * dxl + dzl * dzl);

      if (dl < lakeR * 1.15 && h < WATER_Y + 2.2) {
        c.setRGB(0.48, 0.42, 0.3); // shore
      } else if (z < -78 && h > WATER_Y + 4) {
        // Glacier zone — icy blue-white
        const n = noise(x * 0.09, z * 0.09, 2);
        c.setRGB(0.72 + n * 0.2, 0.8 + n * 0.15, 0.92);
      } else if (h > SNOW_LINE || (h > SNOW_LINE - 8 && slope < 0.35)) {
        c.setRGB(0.88, 0.91, 0.95); // snow
      } else if (slope > 0.62) {
        c.setRGB(0.33, 0.29, 0.27); // cliff rock
      } else {
        const t = THREE.MathUtils.clamp((h + 8) / 46, 0, 1);
        c.setRGB(0.24 + t * 0.22, 0.3 + t * 0.2, 0.26 + t * 0.18); // rock / scree
        if (z > 60 && slope < 0.4) c.setRGB(0.2, 0.32, 0.22); // sparse valley vegetation
      }
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.94,
      metalness: 0.04,
    });
    const terrain = new THREE.Mesh(geo, terrainMat);
    scene.add(terrain);

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
    water.position.set(LAKE_C.x, WATER_Y, LAKE_C.y);
    water.scale.set(1.15, 1, 0.86);
    scene.add(water);

    // Glowing boundary ring
    const ringGeo = new THREE.RingGeometry(lakeR * 0.96, lakeR * 1.02, 72);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(LAKE_C.x, WATER_Y + 0.25, LAKE_C.y);
    ring.scale.set(1.15, 1, 0.86);
    scene.add(ring);

    // Scan pulse (skipped under reduced motion)
    let scanRing: THREE.Mesh | null = null;
    if (!reduceMotion) {
      const scanGeo = new THREE.RingGeometry(lakeR * 1.05, lakeR * 1.1, 72);
      scanGeo.rotateX(-Math.PI / 2);
      const scanMat = new THREE.MeshBasicMaterial({
        color: 0x22d3ee,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      });
      scanRing = new THREE.Mesh(scanGeo, scanMat);
      scanRing.position.set(LAKE_C.x, WATER_Y + 0.3, LAKE_C.y);
      scanRing.scale.set(1.15, 1, 0.86);
      scene.add(scanRing);
    }

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
      const h = heightAt(gx, gz) + 0.7;
      gPos.setY(i, h);
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
    scene.add(glacier);

    /* ---------------------------- Downstream river --------------------------- */
    const riverPts: THREE.Vector3[] = [];
    for (let z = OUTLET.y; z <= 170; z += 8) {
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
    scene.add(river);

    // Flow-direction markers
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

    /* -------------------------------- Labels -------------------------------- */
    anchorRefs.current = [
      { id: "area", caption: "Lake Area", anchor: new THREE.Vector3(LAKE_C.x, WATER_Y + 9, LAKE_C.y) },
      { id: "level", caption: "Water Level", anchor: new THREE.Vector3(LAKE_C.x + lakeR * 1.3, WATER_Y + 4, LAKE_C.y) },
      { id: "elev", caption: "Elevation", anchor: maxPt.clone().add(new THREE.Vector3(0, 10, 0)) },
      { id: "coords", caption: "Coordinates", anchor: new THREE.Vector3(LAKE_C.x, WATER_Y + 3, LAKE_C.y + lakeR * 1.6) },
      { id: "risk", caption: "Current Risk", anchor: new THREE.Vector3(OUTLET.x, WATER_Y + 8, OUTLET.y + 6) },
    ];

    const tmpV = new THREE.Vector3();
    const updateLabels = () => {
      const w = mount.clientWidth;
      const hgt = mount.clientHeight;
      for (const def of anchorRefs.current) {
        const el = labelRefs.current.get(def.id);
        if (!el) continue;
        tmpV.copy(def.anchor).project(camera);
        if (tmpV.z > 1) {
          el.style.opacity = "0";
          continue;
        }
        el.style.opacity = "1";
        el.style.transform = `translate(-50%, -100%) translate(${((tmpV.x + 1) / 2) * w}px, ${((-tmpV.y + 1) / 2) * hgt}px)`;
      }
    };

    /* ------------------------------ Resize loop ------------------------------ */
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

    /* ------------------------------ Render loop ------------------------------ */
    let raf = 0;
    const clock = new THREE.Clock();
    let firstFrame = true;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      if (scanRing) {
        const s = 1 + ((t * 0.35) % 1) * 0.9;
        scanRing.scale.set(1.15 * s, 1, 0.86 * s);
        (scanRing.material as THREE.MeshBasicMaterial).opacity = 0.5 * (1 - ((t * 0.35) % 1));
      }
      controls.update();
      renderer.render(scene, camera);
      updateLabels();
      if (firstFrame) {
        firstFrame = false;
        setReady(true);
      }
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const m = obj.material;
          if (Array.isArray(m)) m.forEach((mm) => mm.dispose());
          else m.dispose();
        }
      });
      renderer.dispose();
      mount.removeChild(renderer.domElement);
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lake.id]);

  const setLabelRef = (id: string) => (el: HTMLDivElement | null) => {
    if (el) labelRefs.current.set(id, el);
    else labelRefs.current.delete(id);
  };

  const d = displayRef.current;
  const riskColor = RISK_COLORS[
    riskScore >= 76 ? "CRITICAL" : riskScore >= 51 ? "HIGH" : riskScore >= 26 ? "MODERATE" : "LOW"
  ];

  const LABEL_VALUES: Record<string, string> = {
    area: `${d.area.toFixed(2)} km²`,
    level: `${d.level >= 0 ? "+" : ""}${d.level.toFixed(1)} m`,
    elev: `${d.elev.toLocaleString()} m`,
    coords: d.coords,
    risk: `${Math.round(d.risk)}%`,
  };

  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-border bg-bg ${className ?? ""}`}
      role="img"
      aria-label={`Pseudo-3D digital twin terrain of ${lake.name}. Lake area ${LABEL_VALUES.area}, water level ${LABEL_VALUES.level}, elevation ${LABEL_VALUES.elev}, current risk ${LABEL_VALUES.risk}.`}
    >
      <div ref={mountRef} className="h-full w-full cursor-grab active:cursor-grabbing" />

      {/* Floating labels */}
      {!failed &&
        ["area", "level", "elev", "coords", "risk"].map((id) => (
          <div
            key={id}
            ref={setLabelRef(id)}
            className="pointer-events-none absolute top-0 left-0 z-10 opacity-0 transition-opacity duration-300 will-change-transform"
          >
            <div className="glass rounded-md px-2 py-1 shadow-lg">
              <p className="text-[8.5px] font-semibold tracking-[0.14em] text-faint uppercase">
                {id === "risk" ? "Current Risk" : id === "coords" ? "Coordinates" : id === "area" ? "Lake Area" : id === "level" ? "Water Level" : "Elevation"}
              </p>
              <p
                className="font-mono text-[11px] leading-tight font-semibold"
                style={{ color: id === "risk" ? riskColor : "#F8FAFC" }}
              >
                {LABEL_VALUES[id]}
              </p>
            </div>
          </div>
        ))}

      {/* Overlays */}
      <div className="absolute right-2 bottom-2 z-10 flex items-center gap-1.5">
        <Badge tone="primary">Digital twin · demo</Badge>
      </div>
      <p className="pointer-events-none absolute bottom-2 left-2 z-10 hidden font-mono text-[9px] text-faint sm:block">
        drag rotate · scroll zoom
      </p>

      {/* Loading overlay */}
      {!ready && !failed && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-bg">
          <div className="skeleton h-2 w-40" />
          <p className="font-mono text-xs text-muted">Building terrain model…</p>
          <div className="w-48">
            <div className="skeleton h-1.5 w-full" />
          </div>
        </div>
      )}

      {failed && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-bg p-6 text-center">
          <p className="text-sm font-semibold text-text">3D view unavailable</p>
          <p className="max-w-xs text-xs text-muted">
            WebGL could not be initialised in this browser. All Digital Twin metrics remain available
            in the panels below.
          </p>
        </div>
      )}
    </div>
  );
}
