"use client";
import Link from "next/link";
import { Tag, Plus, User, BarChart3, FileText, Package } from "lucide-react";

const ACTIONS = [
  { label: "Nova Venda",     href: "/dashboard/vender",    icon: Tag,       bg: "bg-orange-500/10" },
  { label: "Novo Produto",   href: "/dashboard/produtos/novo", icon: Plus,    bg: "bg-emerald-500/10" },
  { label: "Novo Cliente",   href: "/dashboard/clientes/novo", icon: User,    bg: "bg-blue-500/10"   },
  { label: "Relatorio",      href: "/dashboard/relatorios",  icon: BarChart3, bg: "bg-purple-500/10" },
  { label: "Emitir NF-e",  href: "/dashboard/fiscal",     icon: FileText,  bg: "bg-yellow-500/10" },
  { label: "Ajustar Estoque",href: "/dashboard/estoque",   icon: Package,   bg: "bg-red-500/10"    },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
      {ACTIONS.map(action => {
        const IconComponent = action.icon;
        return (
          <Link key={action.href} href={action.href}
            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all hover:border-primary/50 ${action.bg}`}>
            <IconComponent className="w-5 h-5 text-foreground" />
            <span className="text-xs font-medium text-center">{action.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
