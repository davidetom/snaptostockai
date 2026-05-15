import { Check, X, Package } from "lucide-react";
import type { AIIntent } from "@/lib/types";

interface ConfirmWidgetProps {
  intent: AIIntent;
  resolved?: "confirmed" | "cancelled";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmWidget({ intent, resolved, onConfirm, onCancel }: ConfirmWidgetProps) {
  const isAbsolute = intent.update_type === "ABSOLUTE";
  const qtyText = isAbsolute
    ? `+${intent.absolute_quantity} ${intent.absolute_quantity === 1 ? "unità" : "unità"}`
    : intent.status_flag === "RED"
      ? "stato Critico"
      : "stato In esaurimento";

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <p className="text-sm leading-relaxed text-card-foreground">
        Ricevuto. Sto aggiornando l'inventario per
        <span className="mx-1 inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-0.5 text-sm font-medium align-middle">
          <Package className="h-3.5 w-3.5" />
          {intent.product_name}
        </span>
        con <span className="font-semibold text-primary">{qtyText}</span>.
      </p>

      {!resolved ? (
        <>
          <p className="mt-3 text-sm text-card-foreground">Confermi l'operazione?</p>
          <div className="mt-4 grid gap-2">
            <button
              onClick={onCancel}
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card text-sm font-medium text-card-foreground transition-colors hover:bg-muted"
            >
              <X className="h-4 w-4" /> Correggi
            </button>
            <button
              onClick={onConfirm}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Check className="h-4 w-4" /> Conferma
            </button>
          </div>
        </>
      ) : (
        <p className={`mt-3 text-xs font-medium ${resolved === "confirmed" ? "text-[var(--status-green)]" : "text-muted-foreground"}`}>
          {resolved === "confirmed" ? "✓ Operazione confermata" : "Operazione annullata"}
        </p>
      )}
    </div>
  );
}