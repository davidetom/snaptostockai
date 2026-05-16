import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LogOut, ShieldCheck, User as UserIcon } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/opzioni")({
  component: OpzioniPage,
});

function OpzioniPage() {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/login", replace: true });
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <TopBar title="Opzioni" />
      <main className="mx-auto w-full max-w-screen-sm flex-1 px-4 py-6">
        <div className="mb-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{user?.email}</p>
              <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                <ShieldCheck className="h-3 w-3" />
                Ruolo: <span className="font-medium capitalize">{role ?? "—"}</span>
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card text-sm font-medium text-destructive transition-colors hover:bg-muted"
        >
          <LogOut className="h-4 w-4" /> Esci
        </button>
        <p className="mt-6 text-center text-xs text-muted-foreground">StockAI · v0.2</p>
      </main>
      <BottomNav />
    </div>
  );
}