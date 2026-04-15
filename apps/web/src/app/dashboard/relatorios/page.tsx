"use client";
import { useState } from "react";
import { api } from "@/components/providers/trpc-provider";
import { formatCurrency, cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Package } from "lucide-react";

type Period = "today" | "week" | "month" | "3months";

function getPeriodDates(p: Period): { dateFrom: string; dateTo: string } {
  const now = new Date();
  const to  = now.toISOString();
  let from  = new Date(now);
  if (p === "today")   from.setHours(0, 0, 0, 0);
  if (p === "week")    from.setDate(now.getDate() - 7);
  if (p === "month")   from.setDate(now.getDate() - 30);
  if (p === "3months") from.setDate(now.getDate() - 90);
  return { dateFrom: from.toISOString(), dateTo: to };
}

const PERIODS: { value: Period; label: string }[] = [
  { value: "today",   label: "Hoje" },
  { value: "week",    label: "7 dias" },
  { value: "month",   label: "30 dias" },
  { value: "3months", label: "90 dias" },
];

const METHOD_LABELS: Record<string, string> = {
  pix: "PIX", cash: "Dinheiro", credit: "Crédito", debit: "Débito", account: "Fiado", voucher: "Voucher",
};

export default function RelatoriosPage() {
  const [period, setPeriod] = useState<Period>("month");
  const [tab, setTab]       = useState<"sales" | "payments" | "products" | "stock">("sales");
  const dates = getPeriodDates(period);

  const { data: summary }   = api.reports.salesSummary.useQuery(dates);
  const { data: payments }  = api.reports.paymentBreakdown.useQuery(dates);
  const { data: products }  = api.reports.productPerformance.useQuery({ ...dates, limit: 10 });
  const { data: inventory } = api.reports.inventoryValuation.useQuery();

  return (
    <div className="space-y-5 pb-28 md:pb-6">
      <div>
        <h1 className="font-heading font-bold text-2xl">Relatórios</h1>
        <p className="text-sm text-muted-foreground">Análise do seu negócio</p>
      </div>

      {/* Period selector */}
      <div className="flex gap-2 overflow-x-auto overflow-y-hidden no-scrollbar -mx-4 px-4">
        {PERIODS.map(p => (
          <button key={p.value} onClick={() => setPeriod(p.value)}
            className={cn(
              "flex-shrink-0 px-4 py-2 rounded-xl border text-sm font-semibold transition-all",
              period === p.value ? "bg-primary text-white border-primary" : "bg-card border-border text-muted-foreground"
            )}>
            {p.label}
          </button>
        ))}
      </div>

      {/* KPI cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Receita",      value: formatCurrency(summary.totalRevenue), sub: `${summary.totalOrders} pedidos`,        icon: DollarSign,    color: "text-emerald-600" },
            { label: "Lucro bruto",  value: formatCurrency(summary.grossProfit),  sub: `${summary.grossMargin.toFixed(1)}% margem`, icon: TrendingUp, color: "text-primary"    },
            { label: "Custo",        value: formatCurrency(summary.totalCost),    sub: "Custo de mercadoria",                    icon: TrendingDown,  color: "text-rose-600"   },
            { label: "Ticket médio", value: formatCurrency(summary.ticketMedio),  sub: "Por pedido",                             icon: ShoppingBag,   color: "text-foreground" },
          ].map(card => (
            <div key={card.label} className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <card.icon className={cn("h-4 w-4", card.color)} />
              </div>
              <p className={cn("text-xl font-bold font-mono", card.color)}>{card.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tab navigation */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-muted rounded-xl w-full">
        {[
          { key: "sales",    label: "Vendas"    },
          { key: "payments", label: "Pagtos"    },
          { key: "products", label: "Produtos"  },
          { key: "stock",    label: "Estoque"   },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={cn(
              "px-2 py-2 rounded-lg text-xs font-semibold transition-all text-center",
              tab === t.key ? "bg-card shadow text-foreground" : "text-muted-foreground"
            )}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Vendas tab */}
      {tab === "sales" && summary && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border font-semibold text-sm">Pedidos por status</div>
          <div className="divide-y divide-border">
            {Object.entries(summary.byStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm capitalize">{status}</span>
                <span className="font-bold text-sm">{count as number} pedidos</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagamentos tab */}
      {tab === "payments" && payments && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border font-semibold text-sm">Receita por método</div>
          <div className="divide-y divide-border">
            {payments.items.map((item: any) => (
              <div key={item.method} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-semibold">{METHOD_LABELS[item.method] ?? item.method}</span>
                    <span className="text-sm font-mono font-bold">{formatCurrency(item.amount)}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${item.percent}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground">{item.percent.toFixed(1)}%</span>
                </div>
              </div>
            ))}
            <div className="px-4 py-3 bg-muted/30 flex justify-between font-bold text-sm">
              <span>Total recebido</span>
              <span className="font-mono text-primary">{formatCurrency(payments.total)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Produtos tab */}
      {tab === "products" && products && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border font-semibold text-sm">Top 10 produtos por receita</div>
          <div className="divide-y divide-border">
            {products.map((p: any, i: number) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <span className="w-6 text-sm font-bold text-muted-foreground">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.quantity} vendidos</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold font-mono text-primary">{formatCurrency(p.revenue)}</p>
                  <p className="text-xs text-emerald-600 font-mono">+{formatCurrency(p.profit)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estoque tab */}
      {tab === "stock" && inventory && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Package className="h-3.5 w-3.5" />Valor de custo</p>
              <p className="text-xl font-bold font-mono text-foreground">{formatCurrency(inventory.totalCostValue)}</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-xs text-muted-foreground mb-1">Valor de venda</p>
              <p className="text-xl font-bold font-mono text-primary">{formatCurrency(inventory.totalRetailValue)}</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border font-semibold text-sm">Produtos em estoque</div>
            <div className="divide-y divide-border">
              {inventory.products.filter((p: any) => p.stock > 0).map((p: any) => (
                <div key={p.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.stock} unidades × {formatCurrency(p.costPrice)}</p>
                  </div>
                  <p className="font-mono font-bold text-sm">{formatCurrency(p.totalCost)}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
