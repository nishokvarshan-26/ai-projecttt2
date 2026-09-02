"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { SatelliteComparisonData } from "@/lib/types";
import { Badge } from "@/components/ui/feedback";
import { hashString, mulberry32 } from "@/lib/utils";

/**
 * Synthetic satellite-style comparison view.
 * Terrain and lake surfaces are procedurally generated from demo data —
 * this is NOT real satellite imagery. The lake boundary overlay reflects
 * the recorded area change between the two demo observation dates.
 */

const W = 760;
const H = 460;

function makeNoise(seed: number) {
  const rand = mulberry32(seed);
  const G = 24;
  const grid = Array.from({ length: (G + 1) * (G + 1) }, () => rand());
  const at = (gx: number, gy: number) => grid[gy * (G + 1) + gx];
  const smooth = (t: number) => t * t * (3 - 2 * t);
  return (x: number, y: number) => {
    const gx = (x / W) * G;
    const gy = (y / H) * G;
    const x0 = Math.floor(gx);
    const y0 = Math.floor(gy);
    const tx = smooth(gx - x0);
    const ty = smooth(gy - y0);
    const top = at(x0, y0) * (1 - tx) + at(x0 + 1, y0) * tx;
    const bot = at(x0, y0 + 1) * (1 - tx) + at(x0 + 1, y0 + 1) * tx;
    return top * (1 - ty) + bot * ty;
  };
}

function lakeRadius(theta: number, baseR: number, seed: number) {
  return (
    baseR *
    (0.78 +
      0.16 * Math.sin(theta * 2 + seed) +
      0.09 * Math.sin(theta * 5 + seed * 2.3))
  );
}

function renderScene(
  canvas: HTMLCanvasElement,
  areaKm2: number,
  seedBase: number,
  showBoundary: boolean
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const img = ctx.createImageData(W, H);
  const elev = makeNoise(seedBase);
  const detail = makeNoise(seedBase + 77);

  // Lake geometry: area km² → pixel radius (scene spans ~9 km wide)
  const scale = Math.sqrt(areaKm2 / Math.PI) / 4.5 * W;
  const cx = W * 0.46;
  const cy = H * 0.42;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      // Ridged terrain
      let h = 0.55 * elev(x, y) + 0.3 * detail(x * 2.1, y * 2.1) + 0.15 * detail(x * 5.3, y * 5.3);
      h = Math.pow(h, 1.25);
      // Directional shading
      const hl = 0.55 * elev(x - 3, y) + 0.45 * detail(x * 2.1 - 2, y * 2.1);
      const shade = Math.max(-0.25, Math.min(0.25, (h - hl) * 2.2));

      let r = 58 + h * 120 + shade * 90;
      let g = 68 + h * 118 + shade * 90;
      let b = 84 + h * 110 + shade * 80;

      // Snow above threshold
      if (h > 0.72) {
        const s = (h - 0.72) / 0.28;
        r = r + (225 - r) * s;
        g = g + (232 - g) * s;
        b = b + (240 - b) * s;
      }

      // Water body
      const dx = x - cx;
      const dy = (y - cy) * 1.35;
      const theta = Math.atan2(dy, dx);
      const dist = Math.sqrt(dx * dx + dy * dy);
      const rr = lakeRadius(theta, scale, seedBase % 10);
      if (dist < rr) {
        const depth = 1 - dist / rr;
        const glacial = 0.55 + 0.45 * detail(x * 3.1, y * 3.1);
        r = 14 + depth * 10 + glacial * 14;
        g = 116 + depth * 60 + glacial * 30;
        b = 138 + depth * 70 + glacial * 34;
      }

      img.data[i] = Math.max(0, Math.min(255, r));
      img.data[i + 1] = Math.max(0, Math.min(255, g));
      img.data[i + 2] = Math.max(0, Math.min(255, b));
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  if (showBoundary) {
    ctx.strokeStyle = "#22D3EE";
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 5]);
    ctx.shadowColor = "#22D3EE";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    for (let t = 0; t <= 64; t++) {
      const theta = (t / 64) * Math.PI * 2;
      const px = cx + Math.cos(theta) * lakeRadius(theta, scale, seedBase % 10);
      const py = cy + Math.sin(theta) * lakeRadius(theta, scale, seedBase % 10) / 1.35;
      if (t === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;
  }
}

export function SatelliteComparison({ data }: { data: SatelliteComparisonData }) {
  const [pos, setPos] = useState(50);
  const beforeRef = useRef<HTMLCanvasElement>(null);
  const afterRef = useRef<HTMLCanvasElement>(null);

  const seed = useMemo(() => hashString(data.lakeId) % 1000, [data.lakeId]);

  useEffect(() => {
    if (beforeRef.current) renderScene(beforeRef.current, data.beforeAreaKm2, seed, false);
    if (afterRef.current) renderScene(afterRef.current, data.afterAreaKm2, seed, true);
  }, [data, seed]);

  return (
    <div>
      <div className="relative overflow-hidden rounded-lg border border-border select-none">
        <canvas ref={beforeRef} width={W} height={H} className="block h-auto w-full" aria-label={`Synthetic ${data.beforeLabel} scene`} />
        <canvas
          ref={afterRef}
          width={W}
          height={H}
          className="absolute inset-0 block h-full w-full"
          style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
          aria-label={`Synthetic ${data.afterLabel} scene`}
        />

        {/* Divider */}
        <div
          className="pointer-events-none absolute inset-y-0 z-10 w-px bg-primary shadow-[0_0_12px_#22D3EE]"
          style={{ left: `${pos}%` }}
        >
          <span className="absolute top-1/2 left-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-primary bg-[#062a33] font-mono text-[9px] text-primary">
            ↔
          </span>
        </div>

        <span className="absolute top-2 left-2 z-10">
          <Badge tone="neutral" mono>
            Before · {data.beforeDate}
          </Badge>
        </span>
        <span className="absolute top-2 right-2 z-10">
          <Badge tone="primary" mono>
            After · {data.afterDate}
          </Badge>
        </span>
        <span className="absolute bottom-2 left-2 z-10">
          <Badge tone="warning">Synthetic visualization — demo data</Badge>
        </span>
      </div>

      {/* Accessible slider */}
      <label className="mt-3 block">
        <span className="mb-1 flex justify-between text-[11px] text-faint">
          <span>Before ({data.beforeLabel})</span>
          <span>Drag to compare</span>
          <span>After ({data.afterLabel})</span>
        </span>
        <input
          type="range"
          min={0}
          max={100}
          value={pos}
          onChange={(e) => setPos(Number(e.target.value))}
          className="gt-range"
          aria-label="Comparison position"
        />
      </label>

      <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg border border-border bg-elevated px-3 py-2.5">
          <dt className="text-[10px] tracking-wider text-faint uppercase">Previous area</dt>
          <dd className="font-mono text-lg text-text">{data.beforeAreaKm2.toFixed(2)} km²</dd>
        </div>
        <div className="rounded-lg border border-primary/40 bg-primary/[0.07] px-3 py-2.5">
          <dt className="text-[10px] tracking-wider text-faint uppercase">Current area</dt>
          <dd className="font-mono text-lg text-primary">{data.afterAreaKm2.toFixed(2)} km²</dd>
        </div>
        <div className="rounded-lg border border-high/40 bg-high/[0.08] px-3 py-2.5">
          <dt className="text-[10px] tracking-wider text-faint uppercase">Change</dt>
          <dd className="font-mono text-lg text-high">+{data.changePct.toFixed(1)}%</dd>
        </div>
      </dl>
    </div>
  );
}
