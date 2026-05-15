import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { TrafficBadge } from "@/components/TrafficBadge";
import { useProducts } from "@/lib/store";
import { suppliers } from "@/lib/mock-data";
import type { StatusOverride } from "@/lib/types";

export const Route = createFileRoute("/magazzino/$productId")({
  component: EditProductPage,
});

function EditProductPage() {
  const { productId } = Route.useParams();
  const navigate = useNavigate();
  const { products, updateProduct } = useProducts();
  const product = products.find((p) => p.id === productId);

  const [stock, setStock] = useState<string>("");
  const [min, setMin] = useState<string>("");
  const [max, setMax] = useState<string>("");
  const [override, setOverride] = useState<StatusOverride>(null);

  useEffect(() => {
    if (!product) return;
    setStock(product.current_stock?.toString() ?? "");
    setMin(product.min_threshold.toString());
    setMax(product.max_threshold.toString());
    setOverride(product.manual_status_override);
  }, [product]);

  if (!product) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Prodotto non trovato.</p>
      </div>
    );
  }

  const supplier = suppliers.find((s) => s.id === product.supplier_id);

  function save() {
    updateProduct(product!.id, {
      current_stock: stock === "" ? null : Math.max(0, parseInt(stock, 10) || 0),
      min_threshold: Math.max(0, parseInt(min, 10) || 0),
      max_threshold: Math.max(0, parseInt(max, 10) || 0),
      manual_status_override: override,
    });
    navigate({ to: "/magazzino" });
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <TopBar
        title="Modifica articolo"
        showMenu={false}
        right={
          <button
            onClick={() => navigate({ to: "/magazzino" })}
            className="text-sm font-medium text-primary"
          >
            Annulla
          </button>
        }
      />
      <main className="mx-auto w-full max-w-screen-sm flex-1 px-4 py-5">
        <button
          onClick={() => navigate({ to: "/magazzino" })}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Magazzino
        </button>

        <div className="mb-5 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h1 className="text-lg font-bold leading-snug text-card-foreground">{product.name}</h1>
          <p className="mt-1 text-xs text-muted-foreground">Fornitore: {supplier?.name}</p>
          <div className="mt-3">
            <TrafficBadge product={{ ...product, current_stock: stock === "" ? null : parseInt(stock, 10) || 0, min_threshold: parseInt(min, 10) || 0, manual_status_override: override }} />
          </div>
        </div>

        <Section label="Giacenza attuale">
          <NumField value={stock} onChange={setStock} unit={product.unit} />
        </Section>

        <Section label="Soglie">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Minima</Label>
              <NumField value={min} onChange={setMin} unit={product.unit} />
            </div>
            <div>
              <Label>Massima</Label>
              <NumField value={max} onChange={setMax} unit={product.unit} />
            </div>
          </div>
        </Section>

        <Section label="Stato manuale">
          <div className="grid grid-cols-4 gap-2">
            {(["AUTO", "GREEN", "YELLOW", "RED"] as const).map((opt) => {
              const selected = (opt === "AUTO" && override === null) || override === opt;
              const styles =
                opt === "AUTO"
                  ? "border-border"
                  : opt === "GREEN"
                    ? "border-[var(--status-green)] text-[var(--status-green)]"
                    : opt === "YELLOW"
                      ? "border-[var(--status-yellow)] text-[var(--status-yellow)]"
                      : "border-[var(--status-red)] text-[var(--status-red)]";
              return (
                <button
                  key={opt}
                  onClick={() => setOverride(opt === "AUTO" ? null : opt)}
                  className={`h-11 rounded-xl border-2 text-xs font-semibold transition-colors ${styles} ${
                    selected ? "bg-muted" : "bg-card"
                  }`}
                >
                  {opt === "AUTO" ? "Auto" : opt === "GREEN" ? "Sicuro" : opt === "YELLOW" ? "Esaur." : "Critico"}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            "Auto" calcola lo stato dalla giacenza e dalla soglia minima.
          </p>
        </Section>

        <button
          onClick={save}
          className="mt-6 h-12 w-full rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          Salva modifiche
        </button>
      </main>
      <BottomNav />
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </h2>
      {children}
    </section>
  );
}
function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-1 text-[11px] font-medium text-muted-foreground">{children}</p>;
}
function NumField({ value, onChange, unit }: { value: string; onChange: (v: string) => void; unit: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3">
      <input
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
        className="h-12 flex-1 bg-transparent text-base font-semibold outline-none"
        placeholder="0"
      />
      <span className="text-xs text-muted-foreground">{unit}</span>
    </div>
  );
}