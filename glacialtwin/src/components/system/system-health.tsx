"use client";

import { Cpu, Database, BellRing, Boxes, Satellite, Timer } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/feedback";
import { DEMO_TIMESTAMP } from "@/lib/config";

/**
 * System health panel. All statuses describe the prototype's local demo
 * pipeline — they are simulated indicators, not live infrastructure telemetry.
 */
export function SystemHealth() {
  const services = [
    { icon: Satellite, name: "Satellite Feed", status: "Operational", tone: "low" as const },
    { icon: Database, name: "Data Processing", status: "Operational", tone: "low" as const },
    { icon: Cpu, name: "ML Engine", status: "Operational (prototype)", tone: "low" as const },
    { icon: Boxes, name: "Digital Twin", status: "Synchronized", tone: "primary" as const },
    { icon: BellRing, name: "Alert Engine", status: "Operational", tone: "low" as const },
  ];

  return (
    <Card elevated>
      <CardHeader>
        <div>
          <CardTitle>System Status</CardTitle>
          <CardDescription>Prototype pipeline health (simulated indicators)</CardDescription>
        </div>
        <Badge tone="primary">Demo</Badge>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2.5">
          {services.map((s) => (
            <li key={s.name} className="flex items-center gap-2.5">
              <s.icon className="h-3.5 w-3.5 text-faint" aria-hidden />
              <span className="text-xs text-muted">{s.name}</span>
              <span className="ml-auto inline-flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute h-full w-full animate-pulse-dot rounded-full bg-low opacity-60" />
                  <span className="relative h-2 w-2 rounded-full bg-low" />
                </span>
                <span className="text-xs font-medium text-text">{s.status}</span>
              </span>
            </li>
          ))}
          <li className="flex items-center gap-2.5 border-t border-border pt-2.5">
            <Timer className="h-3.5 w-3.5 text-faint" aria-hidden />
            <span className="text-xs text-muted">Last pipeline run</span>
            <span className="ml-auto font-mono text-xs text-primary">04:32 ago</span>
          </li>
        </ul>
        <p className="mt-3 font-mono text-[10px] text-faint">
          Reference clock: {DEMO_TIMESTAMP} (demo)
        </p>
      </CardContent>
    </Card>
  );
}
