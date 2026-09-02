"use client";

import type { ReactNode } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

export function ChartCard({
  title,
  description,
  right,
  footer,
  children,
  className,
}: {
  title: string;
  description?: string;
  right?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card elevated className={className}>
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {right}
      </CardHeader>
      <CardContent>{children}</CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  );
}

/** Shared dark tooltip for Recharts charts. */
export function ChartTooltip({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean;
  payload?: Array<{
    value?: number | string;
    name?: string;
    color?: string;
    dataKey?: string | number;
  }>;
  label?: string | number;
  unit?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-border bg-[#0a1524]/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      {label !== undefined && (
        <p className="mb-1 font-mono text-[10px] tracking-wider text-faint uppercase">{label}</p>
      )}
      <ul className="space-y-0.5">
        {payload.map((p, i) => (
          <li key={i} className="flex items-center gap-2">
            <span
              aria-hidden
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: p.color ?? "#22D3EE" }}
            />
            <span className="text-muted capitalize">{p.name}</span>
            <span className="ml-auto pl-3 font-mono text-text">
              {typeof p.value === "number" ? p.value.toLocaleString("en-US") : p.value}
              {unit && <span className="text-faint"> {unit}</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
