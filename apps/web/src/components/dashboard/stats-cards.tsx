import { TrendingUp, TrendingDown, ShoppingCart, Users, Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Stats {
  todaySales: number; todayOrders: number;
  totalCustomers: number; lowStockCount: number;
}

const CARDS = [
  { key: "todaySales",     label: "Vendas hoje",             icon: "💵", color: "orange", fmt: (v: number) => formatCurrency(v), change: "+12%" },
  { key: "todayOrders",    label: "Pedidos hoje",            icon: "🛒", color: "green",  fmt: (v: number) => String(v),         change: "+8%"  },
  { key: "totalCustomers", label: "Clientes novos",          icon: "👤", color: "blue",   fmt: (v: number) => String(v),         change: "+5%"  },
  { key: "lowStockCount",  label: "Estoque baixo",           icon: "📦", color: "purple", fmt: (v: number) => String(v),         change: "-3"   },
] as const;

const COLORS: Record<string, string> = {
  orange: "from-orange-500/20 to-transparent border-orange-500/20",
  green:  "from-emerald-500/20 to-transparent border-emerald-500/20",
  blue:   "from-blue-500/20 to-transparent border-blue-500/20",
  purple: "from-purple-500/20 to-transparent border-purple-500/20",
};
const TOP_COLORS: Record<string, string> = {
  orange: "bg-gradient-to-r from-orange-500 to-transparent",
  green:  "bg-gradient-to-r from-emerald-500 to-transparent",
  blue:   "bg-gradient-to-r from-blue-500 to-transparent",
  purple: "bg-gradient-to-r from-purple-500 to-transparent",
};

export function StatsCards({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {CARDS.map(card => {
        const value = stats[card.key];
        const isUp  = card.change.startsWith("+");
        return (
          <div key={card.key}
            className={cn("relative bg-card border rounded-2xl p-5 overflow-hidden transition-transform hover:-translate-y-0.5 cursor-default", COLORS[card.color])}>
            <div className={cn("absolute top-0 left-0 right-0 h-0.5", TOP_COLORS[card.color])} />
            <div className="flex items-start justify-between mb-3">
              <div className="text-2xl">{card.icon}</div>
              <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1",
                isUp ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400")}>
                {isUp ? <TrendingUp className="h-3 w-3"/> : <TrendingDown className="h-3 w-3"/>}
                {card.change}
              </span>
            </div>
            <div className="font-heading text-2xl font-bold leading-none mb-1">
              {card.fmt(value)}
            </div>
            <div className="text-xs text-muted-foreground">{card.label}</div>
          </div>
        );
      })}
    </div>
  );
}
