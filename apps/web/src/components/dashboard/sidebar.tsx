"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, getInitials, PLAN_LABELS } from "@/lib/utils";
import type { User } from "@bora/db";

type NavItem = {
  href: string;
  icon: string;
  label: string;
  badge?: string;
  badgeColor?: string;
};

const NAV: { label: string; items: NavItem[] }[] = [
  { label: "Vendas",    items: [
    { href: "/dashboard",           icon: "📊", label: "Dashboard" },
    { href: "/dashboard/vender",    icon: "🏷️", label: "PDV / Vender" },
    { href: "/dashboard/pedidos",   icon: "📋", label: "Pedidos",    badge: "4" },
    { href: "/dashboard/historico", icon: "📜", label: "Histórico" },
  ]},
  { label: "Catálogo",  items: [
    { href: "/dashboard/catalogo",  icon: "🌐", label: "Minha Loja Online", badge: "New", badgeColor: "bg-emerald-500" },
    { href: "/dashboard/produtos",  icon: "📦", label: "Produtos" },
  ]},
  { label: "Gestão",    items: [
    { href: "/dashboard/estoque",   icon: "📦", label: "Estoque" },
    { href: "/dashboard/financeiro",icon: "💰", label: "Financeiro" },
    { href: "/dashboard/clientes",  icon: "😊", label: "Clientes" },
    { href: "/dashboard/relatorios",icon: "📈", label: "Relatórios" },
  ]},
  { label: "Fiscal",    items: [
    { href: "/dashboard/fiscal",    icon: "🧾", label: "Notas Fiscais" },
  ]},
];

interface SidebarProps { user: User & { tenant?: { name: string; plan: string } | null } }

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const plan = user.tenant?.plan ?? "free";

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-card border-r border-border flex flex-col z-50 hidden md:flex">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-sm">🛍️</div>
          <span className="font-heading text-xl font-extrabold">
            lumi<span className="text-primary">POS</span>
          </span>
        </div>
        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
          style={{ background: "rgba(193,127,90,0.1)", borderColor: "rgba(193,127,90,0.25)", color: "#C17F5A" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          {PLAN_LABELS[plan]}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 overflow-y-auto space-y-1">
        {NAV.map(section => (
          <div key={section.label} className="mb-1">
            <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
              {section.label}
            </p>
            {section.items.map(item => {
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all relative",
                    active
                      ? "bg-primary/10 text-primary font-medium before:absolute before:left-0 before:top-1/4 before:bottom-1/4 before:w-0.5 before:bg-primary before:rounded-full"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}>
                  <span className="text-base w-5 text-center">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white",
                      item.badgeColor ?? "bg-primary")}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border space-y-1">
        <Link href="/dashboard/ajustes"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-all">
          <span className="text-base w-5 text-center">⚙️</span> Configurações
        </Link>
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer hover:bg-accent transition-all">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {getInitials(user.name)}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.tenant?.name ?? "Minha Loja"}</p>
          </div>
          <span className="text-muted-foreground text-xs">⋯</span>
        </div>
      </div>
    </aside>
  );
}
