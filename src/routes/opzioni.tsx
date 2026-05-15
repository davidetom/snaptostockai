import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";

export const Route = createFileRoute("/opzioni")({
  component: OpzioniPage,
});

function OpzioniPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <TopBar title="Opzioni" />
      <main className="mx-auto w-full max-w-screen-sm flex-1 px-4 py-6">
        <ul className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {["Account", "Notifiche", "Lingua", "Aiuto"].map((label, i) => (
            <li
              key={label}
              className={`flex items-center gap-3 p-4 ${i > 0 ? "border-t border-border" : ""}`}
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{label}</span>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-center text-xs text-muted-foreground">StockAI · v0.1 mock</p>
      </main>
      <BottomNav />
    </div>
  );
}