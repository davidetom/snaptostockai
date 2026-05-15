import { CheckCircle2, AlertTriangle, Package } from "lucide-react";
import { colorMeta } from "@/lib/traffic-light";
import type { Product } from "@/lib/types";
import { getTrafficColor } from "@/lib/traffic-light";

export function TrafficBadge({ product }: { product: Product }) {
  const color = getTrafficColor(product);
  const meta = colorMeta[color];

  if (color === "UNAVAILABLE") {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium ${meta.bg} ${meta.fg}`}>
        Non disponibile
      </span>
    );
  }

  const Icon =
    color === "GREEN" ? CheckCircle2 : color === "RED" ? AlertTriangle : Package;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold leading-tight ${meta.bg} ${meta.fg}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="whitespace-nowrap">
        {meta.label} · {product.current_stock ?? 0} {product.unit}
      </span>
    </span>
  );
}