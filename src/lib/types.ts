export type StatusOverride = "GREEN" | "YELLOW" | "RED" | null;
export type TrafficColor = "GREEN" | "YELLOW" | "RED" | "UNAVAILABLE";

export interface Supplier {
  id: string;
  name: string;
  removed: boolean;
}

export interface Product {
  id: string;
  name: string;
  unit: string;
  image_url: string | null;
  supplier_id: string | null;
  current_stock: number | null;
  min_threshold: number;
  max_threshold: number;
  manual_status_override: StatusOverride;
  category: string;
}

export interface AIIntent {
  product_id: string;
  product_name: string;
  update_type: "ABSOLUTE" | "STATUS_ONLY";
  absolute_quantity: number | null;
  status_flag: "YELLOW" | "RED" | null;
}

export interface ChatMessage {
  id: string;
  thread_id: string;
  role: "user" | "assistant";
  kind: "text" | "audio" | "intent";
  text: string | null;
  audio_duration_sec: number | null;
  audio_transcript: string | null;
  intent: AIIntent | null;
  intent_resolved: "confirmed" | "cancelled" | null;
  created_at: string;
}

export interface ChatThread {
  id: string;
  title: string;
  updated_at: string;
  created_at: string;
}

export const CATEGORIES = [
  "Tutti gli articoli",
  "Bevande",
  "Carne",
  "Pasta",
  "Conserve",
  "Condimenti",
  "Frutta",
  "Generale",
];