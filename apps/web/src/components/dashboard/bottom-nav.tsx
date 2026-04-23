"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  ClipboardList,
  Users,
  MoreHorizontal,
  Package,
  Wallet,
  Building2,
  BarChart3,
  Tag,
  Truck,
  Ticket,
  History,
  FileText,
  Globe,
  Gem,
  Settings,
  PackageCheck,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { signOut } from "@/lib/auth-client";

const MAIN_TABS = [
  { href: "/dashboard",          icon: LayoutDashboard, label: "Inicio"   },
  { href: "/dashboard/pedidos",  icon: ClipboardList,   label: "Pedidos"  },
  { href: "/dashboard/clientes", icon: Users,           label: "Clientes" },
];

const MORE_ITEMS = [
  { href: "/dashboard/retiradas",      icon: PackageCheck, label: "Retiradas"    },
  { href: "/dashboard/estoque",        icon: Package,    label: "Estoque"      },
  { href: "/dashboard/financeiro",     icon: Wallet,     label: "Financeiro"   },
  { href: "/dashboard/caixa",          icon: Building2,  label: "Caixa"        },
  { href: "/dashboard/relatorios",     icon: BarChart3,  label: "Relatorios"   },
  { href: "/dashboard/produtos",       icon: Tag,        label: "Produtos"     },
  { href: "/dashboard/fornecedores",   icon: Truck,      label: "Fornecedores" },
  { href: "/dashboard/cupons",         icon: Ticket,     label: "Cupons"       },
  { href: "/dashboard/historico",      icon: History,    label: "Historico"    },
  { href: "/dashboard/fiscal",         icon: FileText,   label: "Fiscal"       },
  { href: "/dashboard/catalogo",       icon: Globe,      label: "Catalogo"     },
  { href: "/dashboard/ajustes/planos", icon: Gem,        label: "Planos"       },
  { href: "/dashboard/ajustes",        icon: Settings,   label: "Config."      },
];

export function BottomNav() {
  const pathname  = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    window.location.href = "/auth/login";
  }

  return (
    <>
      {/* Overlay do menu "Mais" */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {/* Drawer "Mais" */}
      <div className={cn(
        "fixed bottom-20 left-4 right-4 z-50 bg-card rounded-3xl border border-border shadow-2xl p-4 transition-all duration-300",
        moreOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"
      )}>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 px-1">
          Menu completo
        </p>
        <div className="grid grid-cols-3 gap-2">
          {MORE_ITEMS.map(item => {
            const IconComponent = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMoreOpen(false)}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-3 rounded-2xl text-center transition-all active:scale-95",
                  pathname === item.href
                    ? "bg-primary/10 text-primary"
                    : "bg-muted/60 text-foreground hover:bg-muted"
                )}
              >
                <IconComponent className="w-5 h-5" />
                <span className="text-xs font-medium leading-tight">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Ações da conta */}
        <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-2">
          <button
            onClick={handleSignOut}
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl text-center bg-muted/60 text-foreground hover:bg-muted transition-all active:scale-95"
          >
            <RefreshCw className="w-5 h-5" />
            <span className="text-xs font-medium">Mudar conta</span>
          </button>
          <button
            onClick={handleSignOut}
            className="flex flex-col items-center gap-1.5 p-3 rounded-2xl text-center bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all active:scale-95"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-xs font-medium">Sair</span>
          </button>
        </div>
      </div>

      {/* Bottom nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
        <div className="bg-card/95 backdrop-blur-xl border-t border-border px-2 pb-safe">
          <div className="flex items-end justify-around h-16">
            {/* Tabs esquerdas */}
            {MAIN_TABS.slice(0, 2).map(tab => {
              const Icon = tab.icon;
              const active = pathname === tab.href;
              return (
                <Link key={tab.href} href={tab.href}
                  className={cn(
                    "flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all active:scale-90",
                    active ? "text-primary" : "text-muted-foreground"
                  )}>
                  <Icon className={cn("h-5 w-5 transition-all", active && "scale-110")} strokeWidth={active ? 2.5 : 1.8} />
                  <span className="text-[10px] font-medium">{tab.label}</span>
                </Link>
              );
            })}

            {/* FAB central - PDV */}
            <Link href="/dashboard/vender"
              className="flex flex-col items-center -mt-6 active:scale-90 transition-all">
              <div className="w-14 h-14 rounded-full bg-primary shadow-lg shadow-primary/40 flex items-center justify-center border-4 border-background">
                <ShoppingCart className="h-6 w-6 text-white" strokeWidth={2} />
              </div>
              <span className="text-[10px] font-semibold text-primary mt-0.5">Vender</span>
            </Link>

            {/* Tabs direitas */}
            {MAIN_TABS.slice(2).map(tab => {
              const Icon = tab.icon;
              const active = pathname === tab.href;
              return (
                <Link key={tab.href} href={tab.href}
                  className={cn(
                    "flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all active:scale-90",
                    active ? "text-primary" : "text-muted-foreground"
                  )}>
                  <Icon className={cn("h-5 w-5 transition-all", active && "scale-110")} strokeWidth={active ? 2.5 : 1.8} />
                  <span className="text-[10px] font-medium">{tab.label}</span>
                </Link>
              );
            })}

            {/* Mais */}
            <button
              onClick={() => setMoreOpen(v => !v)}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all active:scale-90",
                moreOpen ? "text-primary" : "text-muted-foreground"
              )}>
              <MoreHorizontal className={cn("h-5 w-5 transition-all", moreOpen && "scale-110")} strokeWidth={1.8} />
              <span className="text-[10px] font-medium">Mais</span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
