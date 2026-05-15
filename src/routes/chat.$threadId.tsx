import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { MicButton } from "@/components/MicButton";
import { ConfirmWidget } from "@/components/ConfirmWidget";
import { AudioBubble } from "@/components/AudioBubble";
import { mockParseStockUpdate } from "@/lib/mock-ai";
import { loadThreads, saveThreads, useProducts } from "@/lib/store";
import type { ChatMessage, ChatThread, AIIntent } from "@/lib/types";

export const Route = createFileRoute("/chat/$threadId")({
  component: ChatThreadPage,
});

function ChatThreadPage() {
  const { threadId } = Route.useParams();
  const navigate = useNavigate();
  const { products, updateProduct } = useProducts();
  const [thread, setThread] = useState<ChatThread | null>(null);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const all = loadThreads();
    let t = all.find((x) => x.id === threadId);
    if (!t) {
      t = { id: threadId, title: "Nuova conversazione", updatedAt: Date.now(), messages: [] };
      saveThreads([t, ...all]);
    }
    setThread(t);
  }, [threadId]);

  useEffect(() => {
    if (!thread) return;
    const all = loadThreads().filter((x) => x.id !== thread.id);
    saveThreads([thread, ...all].sort((a, b) => b.updatedAt - a.updatedAt));
  }, [thread]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    inputRef.current?.focus();
  }, [thread?.messages.length, thinking]);

  const messages = thread?.messages ?? [];

  const appendMessage = (m: ChatMessage) =>
    setThread((t) =>
      t
        ? {
            ...t,
            messages: [...t.messages, m],
            updatedAt: Date.now(),
            title:
              t.messages.length === 0 && m.kind === "text" && m.text
                ? m.text.slice(0, 40)
                : t.title,
          }
        : t,
    );

  async function handleSend(payload: {
    text?: string;
    audioBase64?: string;
    durationSec?: number;
    transcriptHint?: string;
  }) {
    if (!thread) return;
    const userMsg: ChatMessage =
      payload.text !== undefined
        ? {
            id: crypto.randomUUID(),
            role: "user",
            kind: "text",
            text: payload.text,
            createdAt: Date.now(),
          }
        : {
            id: crypto.randomUUID(),
            role: "user",
            kind: "audio",
            audioDurationSec: payload.durationSec ?? 0,
            audioTranscript: payload.transcriptHint,
            createdAt: Date.now(),
          };
    appendMessage(userMsg);
    setThinking(true);
    try {
      const intent = await mockParseStockUpdate(
        { text: payload.text ?? payload.transcriptHint, audioBase64: payload.audioBase64 },
        products,
      );
      appendMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        kind: "intent",
        intent,
        createdAt: Date.now(),
      });
    } finally {
      setThinking(false);
    }
  }

  function resolveIntent(messageId: string, intent: AIIntent, decision: "confirmed" | "cancelled") {
    setThread((t) =>
      t
        ? {
            ...t,
            messages: t.messages.map((m) =>
              m.id === messageId ? { ...m, intentResolved: decision } : m,
            ),
            updatedAt: Date.now(),
          }
        : t,
    );
    if (decision === "confirmed") {
      if (intent.update_type === "ABSOLUTE" && intent.absolute_quantity !== null) {
        updateProduct(intent.product_id, {
          current_stock: intent.absolute_quantity,
          manual_status_override: null,
        });
      } else if (intent.update_type === "STATUS_ONLY") {
        updateProduct(intent.product_id, {
          manual_status_override: intent.status_flag,
        });
      }
      appendMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        kind: "text",
        text: "Fatto. Inventario aggiornato. ✅",
        createdAt: Date.now(),
      });
    }
  }

  const dateLabel = useMemo(() => {
    if (messages.length === 0) return null;
    const d = new Date(messages[0].createdAt);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    return `${isToday ? "OGGI" : d.toLocaleDateString("it-IT")}, ${d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}`;
  }, [messages]);

  return (
    <div className="flex h-[100dvh] flex-col bg-background">
      <TopBar
        title="StockAI"
        brand
        right={
          <button
            onClick={() => navigate({ to: "/chat" })}
            className="text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Chat
          </button>
        }
      />

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-screen-sm flex-col gap-4 px-4 py-4">
          {dateLabel && (
            <div className="self-center rounded-full bg-muted px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {dateLabel}
            </div>
          )}

          {messages.length === 0 && (
            <div className="mt-12 flex flex-col items-center gap-3 px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-base font-bold">
                IA
              </div>
              <h2 className="text-lg font-semibold">Parla o scrivi a StockAI</h2>
              <p className="text-sm text-muted-foreground">
                Es: <em>"Ho ricevuto 5 casse di pomodori San Marzano"</em> oppure{" "}
                <em>"L'olio è quasi finito"</em>.
              </p>
            </div>
          )}

          {messages.map((m) => {
            if (m.role === "user" && m.kind === "audio") {
              return (
                <div key={m.id} className="flex">
                  <AudioBubble durationSec={m.audioDurationSec ?? 0} transcript={m.audioTranscript} />
                </div>
              );
            }
            if (m.role === "user") {
              return (
                <div key={m.id} className="flex">
                  <div className="ml-auto max-w-[85%] rounded-2xl bg-primary px-4 py-2.5 text-sm text-primary-foreground shadow-sm">
                    {m.text}
                  </div>
                </div>
              );
            }
            return (
              <div key={m.id} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    IA
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    StockAI
                  </span>
                </div>
                {m.kind === "intent" && m.intent ? (
                  <ConfirmWidget
                    intent={m.intent}
                    resolved={m.intentResolved}
                    onConfirm={() => resolveIntent(m.id, m.intent!, "confirmed")}
                    onCancel={() => resolveIntent(m.id, m.intent!, "cancelled")}
                  />
                ) : (
                  <p className="max-w-[90%] text-sm text-foreground">{m.text}</p>
                )}
              </div>
            );
          })}

          {thinking && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-primary" />
              StockAI sta pensando…
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border bg-background">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const v = input.trim();
            if (!v || thinking) return;
            setInput("");
            handleSend({ text: v });
          }}
          className="mx-auto flex max-w-screen-sm items-center gap-2 px-4 py-3"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Chiedi a StockAI…"
            className="h-12 flex-1 rounded-2xl bg-muted px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40"
            disabled={thinking}
          />
          <MicButton
            disabled={thinking}
            onAudio={({ base64, durationSec, transcriptHint }) =>
              handleSend({ audioBase64: base64, durationSec, transcriptHint })
            }
          />
        </form>
      </div>

      <BottomNav />
    </div>
  );
}