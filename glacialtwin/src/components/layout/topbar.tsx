"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Menu, X } from "lucide-react";
import { useApp } from "@/context/app-context";
import { Logo } from "@/components/common/logo";
import { LiveClock } from "@/components/common/live-clock";
import { Badge } from "@/components/ui/feedback";
import { Select } from "@/components/ui/controls";
import { timeAgo } from "@/lib/utils";

export function Topbar() {
  const pathname = usePathname();
  const { regionId, setRegionId, regions, lakes, selectedLake, selectLake, alerts } = useApp();
  const [drawer, setDrawer] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const unack = alerts.filter((a) => !a.acknowledged);
  const section = pathname.split("/")[1]?.replace(/-/g, " ") || "command center";

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-surface/85 backdrop-blur">
        <div className="flex h-14 items-center gap-3 px-4">
          {/* Mobile menu */}
          <button
            className="flex cursor-pointer items-center md:hidden"
            onClick={() => setDrawer(true)}
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5 text-muted" />
          </button>

          {/* Mobile logo */}
          <Link href="/dashboard" className="md:hidden" aria-label="GlacialTwin AI">
            <Logo size={26} compact />
          </Link>

          <p className="hidden font-mono text-[11px] tracking-wider text-faint uppercase md:block">
            GT-OPS / {section}
          </p>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <LiveClock />
            <Badge tone="warning" className="hidden lg:inline-flex">Demo environment</Badge>

            <Select
              aria-label="Region selector"
              value={regionId}
              onChange={(e) => setRegionId(e.target.value)}
              className="h-8 hidden sm:block"
            >
              <option value="all">All regions</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select>

            <Select
              aria-label="Selected lake"
              value={selectedLake.id}
              onChange={(e) => selectLake(e.target.value)}
              className="h-8 hidden md:block"
            >
              {lakes.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </Select>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen((o) => !o)}
                aria-label={`Notifications (${unack.length} unacknowledged)`}
                aria-expanded={notifOpen}
                className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border bg-elevated text-muted transition-colors hover:text-text"
              >
                <Bell className="h-4 w-4" />
                {unack.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-critical px-0.5 font-mono text-[9px] font-bold text-white">
                    {unack.length}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-lg border border-border bg-elevated shadow-2xl">
                  <div className="flex items-center justify-between border-b border-border px-3 py-2">
                    <p className="text-xs font-semibold text-text">Notifications</p>
                    <button onClick={() => setNotifOpen(false)} aria-label="Close notifications" className="cursor-pointer text-faint hover:text-text">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <ul className="max-h-72 divide-y divide-border/60 overflow-y-auto">
                    {alerts.slice(0, 5).map((a) => (
                      <li key={a.id}>
                        <Link
                          href="/alerts"
                          onClick={() => setNotifOpen(false)}
                          className="block px-3 py-2.5 hover:bg-surface"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{
                                background:
                                  a.severity === "CRITICAL" ? "#EF4444" : a.severity === "HIGH" ? "#F97316" : a.severity === "MODERATE" ? "#EAB308" : "#22C55E",
                              }}
                            />
                            <span className="text-xs font-medium text-text">{a.lakeName}</span>
                            <span className="ml-auto font-mono text-[9px] text-faint">{timeAgo(a.createdAt)}</span>
                          </div>
                          <p className="mt-0.5 line-clamp-2 pl-3.5 text-[11px] text-muted">{a.title}</p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/alerts"
                    onClick={() => setNotifOpen(false)}
                    className="block border-t border-border px-3 py-2 text-center text-xs text-primary hover:bg-primary/5"
                  >
                    Open Alert Center
                  </Link>
                </div>
              )}
            </div>

            {/* Profile */}
            <Link
              href="/settings#profile"
              aria-label="Profile and settings"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-gradient-to-br from-primary/30 to-blue-900/40 font-display text-xs font-bold text-text transition-colors hover:border-primary/50"
            >
              GT
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Navigation drawer">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDrawer(false)} />
          <nav className="absolute top-0 left-0 flex h-full w-72 flex-col border-r border-border bg-surface">
            <div className="flex h-14 items-center justify-between border-b border-border px-4">
              <Logo size={28} />
              <button onClick={() => setDrawer(false)} aria-label="Close navigation" className="cursor-pointer text-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <MobileNavLinks onNavigate={() => setDrawer(false)} />
          </nav>
        </div>
      )}
    </>
  );
}

function MobileNavLinks({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  const links = [
    ["Overview", "/dashboard"],
    ["Digital Twin", "/digital-twin"],
    ["Risk Monitoring", "/risk-monitoring"],
    ["Lake Analytics", "/lake-analytics"],
    ["Satellite Intelligence", "/satellite-intelligence"],
    ["Scenario Simulator", "/scenario-simulator"],
    ["Flood Mapping", "/flood-mapping"],
    ["Alerts", "/alerts"],
    ["AI Assistant", "/ai-assistant"],
    ["Reports", "/reports"],
    ["Model Intelligence", "/model-intelligence"],
    ["Settings", "/settings"],
  ] as const;

  return (
    <ul className="flex-1 space-y-0.5 overflow-y-auto p-3">
      {links.map(([label, href]) => {
        const active = href === "/digital-twin" ? pathname.startsWith("/digital-twin") : pathname.startsWith(href);
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`block rounded-md px-3 py-2.5 text-sm font-medium ${
                active ? "bg-primary/10 text-primary" : "text-muted hover:bg-elevated hover:text-text"
              }`}
            >
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
