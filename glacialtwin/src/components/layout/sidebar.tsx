"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Box,
  ShieldAlert,
  LineChart,
  Satellite,
  FlaskConical,
  Waves,
  BellRing,
  Bot,
  FileText,
  Settings,
  Activity,
  CircleUserRound,
  BrainCircuit,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useApp } from "@/context/app-context";
import { Logo } from "@/components/common/logo";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/digital-twin", label: "Digital Twin", icon: Box },
  { href: "/risk-monitoring", label: "Risk Monitoring", icon: ShieldAlert },
  { href: "/lake-analytics", label: "Lake Analytics", icon: LineChart },
  { href: "/satellite-intelligence", label: "Satellite Intelligence", icon: Satellite },
  { href: "/scenario-simulator", label: "Scenario Simulator", icon: FlaskConical },
  { href: "/flood-mapping", label: "Flood Mapping", icon: Waves },
  { href: "/alerts", label: "Alerts", icon: BellRing },
  { href: "/ai-assistant", label: "AI Assistant", icon: Bot },
  { href: "/reports", label: "Reports", icon: FileText },
];

const SECONDARY = [
  { href: "/model-intelligence", label: "Model Intelligence", icon: BrainCircuit },
  { href: "/settings#system-status", label: "System Status", icon: Activity },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/settings#profile", label: "Profile", icon: CircleUserRound },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar, alerts } = useApp();
  const unacknowledged = alerts.filter((a) => !a.acknowledged).length;

  const isActive = (href: string) => {
    const base = href.split("#")[0].split("/").slice(0, 2).join("/");
    if (href.startsWith("/digital-twin")) return pathname.startsWith("/digital-twin");
    return pathname === base || pathname.startsWith(base + "/");
  };

  return (
    <aside
      className={cn(
        "sticky top-0 z-40 hidden h-dvh shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-200 md:flex",
        sidebarCollapsed ? "w-[64px]" : "w-[228px]"
      )}
      aria-label="Primary navigation"
    >
      <div className={cn("flex h-14 items-center border-b border-border px-3", sidebarCollapsed && "justify-center px-0")}>
        <Link href="/" aria-label="GlacialTwin AI home" className="min-w-0">
          <Logo size={30} compact={sidebarCollapsed} />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <p className={cn("mb-1.5 px-2 text-[9px] font-semibold tracking-[0.18em] text-faint uppercase", sidebarCollapsed && "sr-only")}>
          Monitoring
        </p>
        <ul className="space-y-0.5">
          {NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                title={item.label}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[12.5px] font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted hover:bg-elevated hover:text-text",
                  sidebarCollapsed && "justify-center px-0"
                )}
              >
                {isActive(item.href) && (
                  <span aria-hidden className="absolute top-1.5 bottom-1.5 left-0 w-0.5 rounded-full bg-primary" />
                )}
                <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                {!sidebarCollapsed && item.href === "/alerts" && unacknowledged > 0 && (
                  <span className="ml-auto rounded-full bg-critical/20 px-1.5 py-0.5 font-mono text-[9px] text-critical">
                    {unacknowledged}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>

        <p className={cn("mt-5 mb-1.5 px-2 text-[9px] font-semibold tracking-[0.18em] text-faint uppercase", sidebarCollapsed && "sr-only")}>
          System
        </p>
        <ul className="space-y-0.5">
          {SECONDARY.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                title={item.label}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[12.5px] font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted hover:bg-elevated hover:text-text",
                  sidebarCollapsed && "justify-center px-0"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-border p-2">
        <button
          onClick={toggleSidebar}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md px-2.5 py-2 text-xs text-muted transition-colors hover:bg-elevated hover:text-text"
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          {!sidebarCollapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
