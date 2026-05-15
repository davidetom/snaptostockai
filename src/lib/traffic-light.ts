import type { Product, TrafficColor } from "./types";

export function getTrafficColor(p: Product): TrafficColor {
  if (p.current_stock === null) return "UNAVAILABLE";
  if (p.manual_status_override) return p.manual_status_override;
  if (p.current_stock === 0) return "RED";
  if (p.current_stock <= p.min_threshold) return "YELLOW";
  return "GREEN";
}

export const colorMeta: Record<
  TrafficColor,
  { label: string; bg: string; fg: string; dot: string }
> = {
  GREEN: {
    label: "Sicuro",
    bg: "bg-[var(--status-green-bg)]",
    fg: "text-[var(--status-green)]",
    dot: "bg-[var(--status-green)]",
  },
  YELLOW: {
    label: "In esaurimento",
    bg: "bg-[var(--status-yellow-bg)]",
    fg: "text-[var(--status-yellow)]",
    dot: "bg-[var(--status-yellow)]",
  },
  RED: {
    label: "Critico",
    bg: "bg-[var(--status-red-bg)]",
    fg: "text-[var(--status-red)]",
    dot: "bg-[var(--status-red)]",
  },
  UNAVAILABLE: {
    label: "Non disponibile",
    bg: "bg-muted",
    fg: "text-muted-foreground",
    dot: "bg-muted-foreground",
  },
};