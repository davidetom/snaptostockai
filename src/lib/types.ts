export type StatusOverride = "GREEN" | "YELLOW" | "RED" | null;

export interface Supplier {
  id: string;
  name: string;
  removed?: boolean;
}

export interface Product {
  id: string;
  name: string;
  unit: string; // e.g. "casse", "bottiglie"
  image?: string;
  supplier_id: string;
  current_stock: number | null;
  min_threshold: number;
  max_threshold: number;
  manual_status_override: StatusOverride;
  category: string;
}

export type TrafficColor = "GREEN" | "YELLOW" | "RED" | "UNAVAILABLE";

export interface AIIntent {
  product_id: string;
  product_name: string;
  update_type: "ABSOLUTE" | "STATUS_ONLY";
  absolute_quantity: number | null;
  status_flag: "YELLOW" | "RED" | null;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  kind: "text" | "audio" | "intent";
  text?: string;
  audioDurationSec?: number;
  audioTranscript?: string;
  intent?: AIIntent;
  intentResolved?: "confirmed" | "cancelled";
  createdAt: number;
}

export interface ChatThread {
  id: string;
  title: string;
  updatedAt: number;
  messages: ChatMessage[];
}