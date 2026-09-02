"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "./chart-card";
import type { ForecastPoint } from "@/lib/types";

/**
 * Historical (solid) vs model forecast (dashed) lake area with an
 * uncertainty band around the forecast segment.
 */
export function ForecastChart({
  data,
  height = 260,
}: {
  data: ForecastPoint[];
  height?: number;
}) {
  const lastHist = [...data].reverse().find((p) => p.kind === "historical");
  const chartData = data.map((p) => ({
    ...p,
    // Bridge the historical line into the forecast line so the dashed
    // segment starts at the last observed point.
    histArea: p.kind === "historical" ? p.areaKm2 : null,
    fcArea:
      p.kind === "forecast" || p.year === lastHist?.year ? p.areaKm2 : null,
    band:
      p.kind === "forecast" ? [p.lowerKm2, p.upperKm2] : ([null, null] as unknown as [number, number]),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={chartData} margin={{ top: 8, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="fc-band" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.16} />
            <stop offset="100%" stopColor="#22D3EE" stopOpacity={0.03} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#16283f" strokeDasharray="3 5" vertical={false} />
        <XAxis
          dataKey="year"
          stroke="#334155"
          tick={{ fill: "#64748b", fontSize: 10.5 }}
          tickLine={false}
          axisLine={{ stroke: "#20334a" }}
        />
        <YAxis
          stroke="#334155"
          tick={{ fill: "#64748b", fontSize: 10.5 }}
          tickLine={false}
          axisLine={false}
          width={44}
          domain={["auto", "auto"]}
          tickFormatter={(v: number) => v.toFixed(1)}
        />
        <Tooltip
          content={
            <ChartTooltip />
          }
          cursor={{ stroke: "#2c4258" }}
        />
        <Area
          type="monotone"
          dataKey="band"
          name="Uncertainty band"
          stroke="none"
          fill="url(#fc-band)"
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="histArea"
          name="Observed area"
          stroke="#22D3EE"
          strokeWidth={2.4}
          dot={{ r: 3, fill: "#22D3EE", strokeWidth: 0 }}
          animationDuration={800}
        />
        <Line
          type="monotone"
          dataKey="fcArea"
          name="Model forecast"
          stroke="#F97316"
          strokeWidth={2.2}
          strokeDasharray="6 5"
          dot={{ r: 3, fill: "#F97316", strokeWidth: 0 }}
          animationDuration={800}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
