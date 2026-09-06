import type { ReactNode } from "react";
import { AppProvider } from "@/context/app-context";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { DemoBanner } from "@/components/common/page-header";
import { AssistantWidget } from "@/components/assistant/assistant-widget";
import { DISCLAIMER_SHORT } from "@/lib/config";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
      <div className="flex min-h-dvh">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <DemoBanner />
          <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-5 pb-24 sm:px-6 md:pb-8">
            {children}
          </main>
          <footer className="no-print border-t border-border px-4 py-3 text-center text-[10.5px] text-faint sm:px-6">
            GlacialTwin AI — {DISCLAIMER_SHORT}
          </footer>
        </div>
        <AssistantWidget />
      </div>
    </AppProvider>
  );
}
