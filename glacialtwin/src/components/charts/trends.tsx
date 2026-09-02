"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "./chart-card";

const AXIS = {
  stroke: "#334155",
  tick: { fill: "#64748b", fontSize: 10.5 },
};

const GRID = { stroke: "#16283f", strokeDasharray: "3 5" };

export function AreaTrend({
  data,
  xKey,
  yKey,
  color = "#22D3EE",
  unit,
  height = 220,
}: {
  data: Array<Record<string, string | number>>;
  xKey: string;
  yKey: string;
  color?: string;
  unit?: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 6, right: 8, left: -14, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${yKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.32} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid {...GRID} vertical={false} />
        <XAxis dataKey={xKey} {...AXIS} tickLine={false} axisLine={{ stroke: "#20334a" }} />
        <YAxis {...AXIS} tickLine={false} axisLine={false} width={44} />
        <Tooltip content={<ChartTooltip unit={unit} />} cursor={{ stroke: "#2c4258" }} />
        <Area
          type="monotone"
          dataKey={yKey}
          name={yKey}
          stroke={color}
          strokeWidth={2}
          fill={`url(#grad-${yKey})`}
          animationDuration={900}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function LineTrend({
  data,
  xKey,
  lines,
  height = 220,
  yDomain,
}: {
  data: Array<Record<string, string | number>>;
  xKey: string;
  lines: Array<{ key: string; color: string; name?: string }>;
  height?: number;
  yDomain?: [number | "auto", number | "auto"];
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 6, right: 8, left: -14, bottom: 0 }}>
        <CartesianGrid {...GRID} vertical={false} />
        <XAxis dataKey={xKey} {...AXIS} tickLine={false} axisLine={{ stroke: "#20334a" }} />
        <YAxis {...AXIS} tickLine={false} axisLine={false} width={44} domain={yDomain ?? ["auto", "auto"]} />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#2c4258" }} />
        {lines.map((l) => (
          <Line
            key={l.key}
            type="monotone"
            dataKey={l.key}
            name={l.name ?? l.key}
            stroke={l.color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
            animationDuration={900}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function BarSeries({
  data,
  xKey,
  yKey,
  color = "#22D3EE",
  unit,
  height = 220,
  positiveOnlyColor = false,
}: {
  data: Array<Record<string, string | number>>;
  xKey: string;
  yKey: string;
  color?: string;
  unit?: string;
  height?: number;
  positiveOnlyColor?: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 6, right: 8, left: -14, bottom: 0 }}>
        <CartesianGrid {...GRID} vertical={false} />
        <XAxis dataKey={xKey} {...AXIS} tickLine={false} axisLine={{ stroke: "#20334a" }} />
        <YAxis {...AXIS} tickLine={false} axisLine={false} width={44} />
        <Tooltip content={<ChartTooltip unit={unit} />} cursor={{ fill: "#101d2f66" }} />
        <Bar
          dataKey={yKey}
          name={yKey}
          radius={[3, 3, 0, 0]}
          maxBarSize={38}
          animationDuration={800}
          fill={color}
        >
          {positiveOnlyColor &&
            data.map((d, i) => (
              <Cell
                key={i}
                fill={Number(d[yKey]) >= 0 ? color : "#22C55E"}
                opacity={Number(d[yKey]) >= 0 ? 0.9 : 0.55}
              />
            ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
