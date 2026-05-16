import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { MicButton } from "@/components/MicButton";
import { ConfirmWidget } from "@/components/ConfirmWidget";
import { AudioBubble } from "@/components/AudioBubble";
import {
  useMessages,
  insertMessage,
  resolveMessageIntent,
  touchThread,
  updateThreadTitle,
  useProducts,
  useUpdateProduct,
  logStockUpdate,
} from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { parseStockUpdate } from "@/lib/parse-stock.functions";
import type { AIIntent } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/chat/$threadId")({
  component: ChatThreadPage,
});

function ChatThreadPage() {
  const { threadId } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: products = [] } = useProducts();
  const { data: messages = [] } = useMessages(threadId);
  const updateProduct = useUpdateProduct();
  const qc = useQueryClient();
  const parseFn = useServerFn(parseStockUpdate);

  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    inputRef.current?.focus();
  }, [messages.length, thinking]);

  async function handleSend(payload: { text?: string; audioBase64?: string; durationSec?: number; transcriptHint?: string }) {
    if (!user || !threadId) return;
    if (products.length === 0) {
      toast.error("Nessun prodotto in magazzino.");
      return;
    }
    setThinking(true);
    try {
      // 1. persist the user message
      await insertMessage({
        thread_id: threadId,
        user_id: user.id,
        role: "user",
        kind: payload.text !== undefined ? "text" : "audio",
        text: payload.text ?? null,
        audio_duration_sec: payload.durationSec ?? null,
        audio_transcript: payload.transcriptHint ?? null,
      });
      qc.invalidateQueries({ queryKey: ["messages", threadId] });

      // first message becomes thread title
      if (messages.length === 0 && payload.text) {
        await updateThreadTitle(threadId, payload.text.slice(0, 40));
        qc.invalidateQueries({ queryKey: ["threads"] });
      }

      // 2. call AI
      const result = await parseFn({
        data: {
          text: payload.text ?? payload.transcriptHint,
          audioBase64: payload.audioBase64 || undefined,
          audioMime: "audio/webm",
          products: products.map((p) => ({ id: p.id, name: p.name, unit: p.unit })),
        },
      });

      if (!result.ok) {
        toast.error(result.message);
        await insertMessage({
          thread_id: threadId,
          user_id: user.id,
          role: "assistant",
          kind: "text",
          text: `Errore: ${result.message}`,
        });
      } else {
        await insertMessage({
          thread_id: threadId,
          user_id: user.id,
          role: "assistant",
          kind: "intent",
          intent: result.intent as AIIntent,
        });
      }
      await touchThread(threadId);
      qc.invalidateQueries({ queryKey: ["messages", threadId] });
      qc.invalidateQueries({ queryKey: ["threads"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Errore");
    } finally {
      setThinking(false);
    }
  }

  async function resolveIntent(messageId: string, intent: AIIntent, decision: "confirmed" | "cancelled") {
    if (!user) return;
    await resolveMessageIntent(messageId, decision);
    if (decision === "confirmed") {
      if (intent.update_type === "ABSOLUTE" && intent.absolute_quantity !== null) {
        await updateProduct.mutateAsync({
          id: intent.product_id,
          patch: { current_stock: intent.absolute_quantity, manual_status_override: null },
        });
        await logStockUpdate({
          product_id: intent.product_id,
          user_id: user.id,
          update_type: "ABSOLUTE",
          absolute_quantity: intent.absolute_quantity,
          status_flag: null,
        });
      } else if (intent.update_type === "STATUS_ONLY" && intent.status_flag) {
        await updateProduct.mutateAsync({
          id: intent.product_id,
          patch: { manual_status_override: intent.status_flag },
        });
        await logStockUpdate({
          product_id: intent.product_id,
          user_id: user.id,
          update_type: "STATUS_ONLY",
          absolute_quantity: null,
          status_flag: intent.status_flag,
        });
      }
      await insertMessage({
        thread_id: threadId,
        user_id: user.id,
        role: "assistant",
        kind: "text",
        text: "Fatto. Inventario aggiornato. ✅",
      });
    }
    qc.invalidateQueries({ queryKey: ["messages", threadId] });
    qc.invalidateQueries({ queryKey: ["products"] });
  }

  const dateLabel = useMemo(() => {
    if (messages.length === 0) return null;
    const d = new Date(messages[0].created_at);
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
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-base font-bold">IA</div>
              <h2 className="text-lg font-semibold">Parla o scrivi a StockAI</h2>
              <p className="text-sm text-muted-foreground">
                Es: <em>"Ho ricevuto 5 casse di pomodori"</em> oppure <em>"L'olio è quasi finito"</em>.
              </p>
            </div>
          )}
          {messages.map((m) => {
            if (m.role === "user" && m.kind === "audio") {
              return (
                <div key={m.id} className="flex">
                  <AudioBubble durationSec={m.audio_duration_sec ?? 0} transcript={m.audio_transcript ?? undefined} />
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
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">IA</div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">StockAI</span>
                </div>
                {m.kind === "intent" && m.intent ? (
                  <ConfirmWidget
                    intent={m.intent}
                    resolved={m.intent_resolved ?? undefined}
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