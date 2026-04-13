import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ACTIONS = [
  { label: "Nova Venda",     href: "/dashboard/vender",    emoji: "🏷️", bg: "bg-orange-500/10" },
  { label: "Novo Produto",   href: "/dashboard/produtos/novo", emoji: "➕", bg: "bg-emerald-500/10" },
  { label: "Novo Cliente",   href: "/dashboard/clientes/novo", emoji: "👤", bg: "bg-blue-500/10"   },
  { label: "Relatório",      href: "/dashboard/relatorios",emoji: "📊", bg: "bg-purple-500/10" },
  { label: "Emitir NF-e",   href: "/dashboard/fiscal",    emoji: "🧾", bg: "bg-yellow-500/10" },
  { label: "Ajustar Estoque",href: "/dashboard/estoque",   emoji: "📦", bg: "bg-red-500/10"    },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="font-heading text-base">Ações rápidas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {ACTIONS.map(a => (
            <Link key={a.href} href={a.href}
              className="flex flex-col items-start gap-2 p-3 rounded-xl bg-accent/40 border border-border hover:border-border/80 hover:bg-accent/70 transition-all hover:-translate-y-0.5 group">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base ${a.bg}`}>
                {a.emoji}
              </div>
              <span className="text-xs font-medium">{a.label}</span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
