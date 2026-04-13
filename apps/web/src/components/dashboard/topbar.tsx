"use client";
import { Bell, HelpCircle, Search, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import type { User } from "@bora/db";
import { getInitials } from "@/lib/utils";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard":            "Dashboard",
  "/dashboard/vender":     "PDV",
  "/dashboard/pedidos":    "Pedidos",
  "/dashboard/historico":  "Histórico",
  "/dashboard/produtos":   "Produtos",
  "/dashboard/estoque":    "Estoque",
  "/dashboard/financeiro": "Financeiro",
  "/dashboard/clientes":   "Clientes",
  "/dashboard/relatorios": "Relatórios",
  "/dashboard/fiscal":     "Notas Fiscais",
  "/dashboard/ajustes":    "Configurações",
};

interface TopbarProps { user: User }

export function Topbar({ user }: TopbarProps) {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? "Bora.app";

  return (
    <header className="sticky top-0 z-40 h-14 md:h-16 bg-card/90 backdrop-blur border-b border-border flex items-center px-4 md:px-6 gap-3">
      {/* Mobile: logo + título */}
      <div className="flex items-center gap-2 md:hidden">
        <span className="font-heading text-lg font-extrabold">
          Bora<span className="text-primary">.</span>
        </span>
        <span className="text-muted-foreground/40 text-lg">·</span>
        <span className="font-heading font-semibold text-base">{title}</span>
      </div>

      {/* Desktop: título da página */}
      <div className="hidden md:block flex-1 font-heading font-bold text-lg">{title}</div>

      <div className="flex items-center gap-1.5 ml-auto">
        {/* Search só desktop */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar..." className="pl-9 w-52 h-9 bg-background" />
        </div>

        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border-2 border-card" />
        </Button>

        <Button variant="ghost" size="icon" className="h-9 w-9 hidden md:flex">
          <HelpCircle className="h-4 w-4" />
        </Button>

        {/* Avatar mobile */}
        <div className="flex md:hidden items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-bold">
          {getInitials(user.name)}
        </div>
      </div>
    </header>
  );
}
