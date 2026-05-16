import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AIIntent, ChatMessage, ChatThread, Product, StatusOverride, Supplier } from "./types";

/* ---------------- Products + Suppliers ---------------- */

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("id,name,unit,image_url,supplier_id,current_stock,min_threshold,max_threshold,manual_status_override,category")
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((p) => ({
        ...p,
        current_stock: p.current_stock === null ? null : Number(p.current_stock),
        min_threshold: Number(p.min_threshold),
        max_threshold: Number(p.max_threshold),
        manual_status_override: p.manual_status_override as StatusOverride,
      }));
    },
  });
}

export function useSuppliers() {
  return useQuery({
    queryKey: ["suppliers"],
    queryFn: async (): Promise<Supplier[]> => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("id,name,removed")
        .order("name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Product> }) => {
      const { error } = await supabase
        .from("products")
        .update({
          ...(patch.current_stock !== undefined ? { current_stock: patch.current_stock } : {}),
          ...(patch.min_threshold !== undefined ? { min_threshold: patch.min_threshold } : {}),
          ...(patch.max_threshold !== undefined ? { max_threshold: patch.max_threshold } : {}),
          ...(patch.manual_status_override !== undefined
            ? { manual_status_override: patch.manual_status_override }
            : {}),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

/* ---------------- Chat threads ---------------- */

export function useThreads() {
  return useQuery({
    queryKey: ["threads"],
    queryFn: async (): Promise<ChatThread[]> => {
      const { data, error } = await supabase
        .from("chat_threads")
        .select("id,title,created_at,updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export async function createThread(userId: string): Promise<ChatThread> {
  const { data, error } = await supabase
    .from("chat_threads")
    .insert({ user_id: userId, title: "Nuova conversazione" })
    .select("id,title,created_at,updated_at")
    .single();
  if (error) throw error;
  return data;
}

export async function updateThreadTitle(threadId: string, title: string) {
  await supabase.from("chat_threads").update({ title, updated_at: new Date().toISOString() }).eq("id", threadId);
}

export async function touchThread(threadId: string) {
  await supabase.from("chat_threads").update({ updated_at: new Date().toISOString() }).eq("id", threadId);
}

/* ---------------- Chat messages ---------------- */

export function useMessages(threadId: string | undefined) {
  return useQuery({
    queryKey: ["messages", threadId],
    enabled: !!threadId,
    queryFn: async (): Promise<ChatMessage[]> => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("id,thread_id,role,kind,text,audio_duration_sec,audio_transcript,intent,intent_resolved,created_at")
        .eq("thread_id", threadId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((m) => ({
        ...m,
        intent: (m.intent as unknown as AIIntent | null) ?? null,
      })) as ChatMessage[];
    },
  });
}

export async function insertMessage(input: {
  thread_id: string;
  user_id: string;
  role: "user" | "assistant";
  kind: "text" | "audio" | "intent";
  text?: string | null;
  audio_duration_sec?: number | null;
  audio_transcript?: string | null;
  intent?: AIIntent | null;
}): Promise<ChatMessage> {
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      thread_id: input.thread_id,
      user_id: input.user_id,
      role: input.role,
      kind: input.kind,
      text: input.text ?? null,
      audio_duration_sec: input.audio_duration_sec ?? null,
      audio_transcript: input.audio_transcript ?? null,
      intent: (input.intent ?? null) as unknown as never,
    })
    .select("id,thread_id,role,kind,text,audio_duration_sec,audio_transcript,intent,intent_resolved,created_at")
    .single();
  if (error) throw error;
  return { ...(data as ChatMessage), intent: (data.intent as unknown as AIIntent | null) ?? null };
}

export async function resolveMessageIntent(messageId: string, decision: "confirmed" | "cancelled") {
  await supabase.from("chat_messages").update({ intent_resolved: decision }).eq("id", messageId);
}

/* ---------------- Stock audit log ---------------- */

export async function logStockUpdate(input: {
  product_id: string;
  user_id: string;
  update_type: "ABSOLUTE" | "STATUS_ONLY";
  absolute_quantity: number | null;
  status_flag: "GREEN" | "YELLOW" | "RED" | null;
}) {
  await supabase.from("stock_updates").insert({
    product_id: input.product_id,
    user_id: input.user_id,
    update_type: input.update_type,
    absolute_quantity: input.absolute_quantity,
    status_flag: input.status_flag,
    source: "chat",
  });
}