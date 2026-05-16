import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search, Package, Loader2 } from "lucide-react";
import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { TrafficBadge } from "@/components/TrafficBadge";
import { useProducts, useSuppliers } from "@/lib/db";
import { CATEGORIES } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/magazzino/")({
  component: MagazzinoPage,
});

function MagazzinoPage() {
  const { data: products = [], isLoading } = useProducts();
  const { data: suppliers = [] } = useSuppliers();
  const [active, setActive] = useState("Tutti gli articoli");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();

  const filtered = products.filter((p) => {
    const okCat = active === "Tutti gli articoli" || p.category === active;
    const okQ = !query || p.name.toLowerCase().includes(query.toLowerCase());
    return okCat && okQ;
  });

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <TopBar
        title={<span className="font-display font-semibold">Magazzino</span>}
        right={
          <button onClick={() => setSearchOpen((s) => !s)} aria-label="Cerca">
            <Search className="h-5 w-5" />
          </button>
        }
      />
      <main className="mx-auto w-full max-w-screen-sm flex-1 px-4 py-4">
        {searchOpen && (
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca prodotto…"
            className="mb-3 h-11 w-full rounded-xl bg-muted px-4 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            autoFocus
          />
        )}
        <div className="-mx-4 mb-4 overflow-x-auto px-4">
          <div className="flex gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setActive(c)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm transition-colors ${
                  active === c ? "bg-secondary text-secondary-foreground" : "border border-border bg-card text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            {filtered.map((p, idx) => {
              const supplier = suppliers.find((s) => s.id === p.supplier_id);
              const supplierRemoved = !!supplier?.removed;
              return (
                <button
                  key={p.id}
                  onClick={() => navigate({ to: "/magazzino/$productId", params: { productId: p.id } })}
                  className={`relative flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-muted/50 ${
                    idx > 0 ? "border-t border-border" : ""
                  }`}
                >
                  {supplierRemoved && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-destructive" />
                  )}
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <Package className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-bold leading-tight ${supplierRemoved ? "text-muted-foreground" : "text-card-foreground"}`}>
                      {p.name}
                    </p>
                    {supplierRemoved ? (
                      <p className="mt-1 text-xs text-destructive"><span className="mr-1">●</span>Fornitore rimosso</p>
                    ) : (
                      <p className="mt-1 text-xs text-muted-foreground">Fornitore: {supplier?.name ?? "—"}</p>
                    )}
                  </div>
                  <TrafficBadge product={p} />
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="p-8 text-center text-sm text-muted-foreground">Nessun prodotto.</p>
            )}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}