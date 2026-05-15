import { Link } from "@tanstack/react-router";
import { CircleUserRound, Menu } from "lucide-react";
import type { ReactNode } from "react";

interface TopBarProps {
  title: ReactNode;
  right?: ReactNode;
  showMenu?: boolean;
  brand?: boolean;
}

export function TopBar({ title, right, showMenu = true, brand = false }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background">
      <div className="mx-auto flex max-w-screen-sm items-center justify-between px-4 py-3">
        <button
          className={`rounded-md p-1 text-foreground ${showMenu ? "" : "invisible"}`}
          aria-label="Menu"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div
          className={
            brand
              ? "font-display text-xl font-semibold tracking-tight"
              : "text-lg font-semibold tracking-tight"
          }
        >
          {title}
        </div>
        <div className="flex items-center gap-2">
          {right}
          <Link to="/opzioni" aria-label="Account">
            <CircleUserRound className="h-6 w-6 text-foreground" />
          </Link>
        </div>
      </div>
    </header>
  );
}