import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus, MessageSquareText } from "lucide-react";
import { useEffect } from "react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { loadThreads, saveThreads } from "@/lib/store";
import type { ChatThread } from "@/lib/types";

export const Route = createFileRoute("/chat/")({
  component: ChatIndex,
});

function newThread(): ChatThread {
  return {
    id: crypto.randomUUID(),
    title: "Nuova conversazione",
    updatedAt: Date.now(),
    messages: [],
  };
}

function ChatIndex() {
  const navigate = useNavigate();

  // If no threads exist on first visit, create one and redirect.
  useEffect(() => {
    const threads = loadThreads();
    if (threads.length === 0) {
      const t = newThread();
      saveThreads([t]);
      navigate({ to: "/chat/$threadId", params: { threadId: t.id }, replace: true });
    }
  }, [navigate]);

  const threads = typeof window !== "undefined" ? loadThreads() : [];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TopBar title="StockAI" brand />
      <main className="mx-auto w-full max-w-screen-sm flex-1 px-4 py-4">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Conversazioni
          </h1>
          <button
            onClick={() => {
              const t = newThread();
              saveThreads([t, ...loadThreads()]);
              navigate({ to: "/chat/$threadId", params: { threadId: t.id } });
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
          >
            <Plus className="h-3.5 w-3.5" /> Nuova
          </button>
        </div>

        <ul className="space-y-2">
          {threads.map((t) => (
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
                    {t.messages.length} messaggi · {new Date(t.updatedAt).toLocaleString("it-IT")}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </main>
      <BottomNav />
    </div>
  );
}