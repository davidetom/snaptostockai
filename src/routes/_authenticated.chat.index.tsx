import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus, MessageSquareText, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { useThreads, createThread } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/chat/")({
  component: ChatIndex,
});

function ChatIndex() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: threads, isLoading } = useThreads();
  const qc = useQueryClient();

  useEffect(() => {
    if (!isLoading && threads && threads.length === 0 && user) {
      createThread(user.id)
        .then((t) => {
          qc.invalidateQueries({ queryKey: ["threads"] });
          navigate({ to: "/chat/$threadId", params: { threadId: t.id }, replace: true });
        })
        .catch((e) => toast.error(e.message));
    }
  }, [isLoading, threads, user, navigate, qc]);

  async function handleNew() {
    if (!user) return;
    try {
      const t = await createThread(user.id);
      qc.invalidateQueries({ queryKey: ["threads"] });
      navigate({ to: "/chat/$threadId", params: { threadId: t.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Errore");
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TopBar title="StockAI" brand />
      <main className="mx-auto w-full max-w-screen-sm flex-1 px-4 py-4">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Conversazioni</h1>
          <button
            onClick={handleNew}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
          >
            <Plus className="h-3.5 w-3.5" /> Nuova
          </button>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <ul className="space-y-2">
            {(threads ?? []).map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => navigate({ to: "/chat/$threadId", params: { threadId: t.id } })}
                  className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:bg-muted"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <MessageSquareText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-card-foreground">{t.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {new Date(t.updated_at).toLocaleString("it-IT")}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
      <BottomNav />
    </div>
  );
}