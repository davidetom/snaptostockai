import { Link, useLocation } from "@tanstack/react-router";
import { MessageSquareText, Package, Receipt, Settings } from "lucide-react";

const items = [
  { to: "/chat", label: "Chat IA", icon: MessageSquareText, match: "/chat" },
  { to: "/magazzino", label: "Magazzino", icon: Package, match: "/magazzino" },
  { to: "/ordini", label: "Ordini", icon: Receipt, match: "/ordini" },
  { to: "/opzioni", label: "Opzioni", icon: Settings, match: "/opzioni" },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="sticky bottom-0 z-30 border-t border-border bg-background">
      <ul className="mx-auto grid max-w-screen-sm grid-cols-4">
        {items.map(({ to, label, icon: Icon, match }) => {
          const active = pathname === to || pathname.startsWith(match + "/");
          return (
            <li key={to}>
              <Link
                to={to}
                className={`flex flex-col items-center gap-1 py-3 text-xs transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 1.8} />
                <span className={active ? "font-semibold" : ""}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}