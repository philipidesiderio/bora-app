import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

const products = [
  { name: "X-Burguer Especial",  cat: "Lanches",    qty: 47, revenue: 658,  emoji: "🍔" },
  { name: "Camiseta Básica P",   cat: "Roupas",     qty: 31, revenue: 899,  emoji: "👕" },
  { name: "Capinha iPhone 15",   cat: "Acessórios", qty: 28, revenue: 420,  emoji: "📱" },
  { name: "Suco Natural 500ml",  cat: "Bebidas",    qty: 22, revenue: 176,  emoji: "🥤" },
  { name: "Tênis Running",       cat: "Calçados",   qty: 14, revenue: 1960, emoji: "👟" },
];

export function TopProducts() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="font-heading text-base">Produtos mais vendidos</CardTitle>
          <Link href="/dashboard/relatorios" className="text-xs text-primary hover:underline px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
            Ver todos →
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {["Produto","Qtd","Receita"].map(h => (
                <th key={h} className="text-left px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.name} className="border-b border-border/50 hover:bg-accent/30 transition-colors last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-base flex-shrink-0">
                      {p.emoji}
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-none">{p.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{p.cat}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm font-bold">{p.qty}</td>
                <td className="px-4 py-3 text-sm font-semibold text-emerald-400">{formatCurrency(p.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
