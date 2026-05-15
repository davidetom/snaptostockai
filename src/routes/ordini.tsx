import { createFileRoute } from "@tanstack/react-router";
import { Receipt } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";

export const Route = createFileRoute("/ordini")({
  component: OrdiniPage,
});

function OrdiniPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <TopBar title="Ordini" />
      <main className="mx-auto flex w-full max-w-screen-sm flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Receipt className="h-6 w-6" />
        </div>
        <h1 className="text-lg font-semibold">Ordini in arrivo</h1>
        <p className="text-sm text-muted-foreground">
          Qui vedrai gli ordini suggeriti da StockAI in base alle scorte critiche.
        </p>
      </main>
      <BottomNav />
    </div>
  );
}