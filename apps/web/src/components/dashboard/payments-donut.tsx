"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { api } from "@/components/providers/trpc-provider";
import { CreditCard } from "lucide-react";

const COLORS: Record<string, string> = {
  pix:     "#FF6B2C",
  debit:   "#3D9EFF",
  credit:  "#9B6DFF",
  cash:    "#2ECC8A",
  voucher: "#F5C842",
  mixed:   "#A0A0A0",
  account: "#E0447C",
};

export function PaymentsDonut() {
  const { data, isLoading } = api.dashboard.getPaymentsBreakdown.useQuery(undefined, {
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const items = (data ?? []).map(d => ({ ...d, color: COLORS[d.method] ?? "#888" }));
  const total = items.reduce((s, d) => s + d.value, 0);
  const top   = items.sort((a, b) => b.value - a.value)[0];
  const topPct = top && total > 0 ? Math.round((top.value / total) * 100) : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="font-heading text-base">Formas de pagamento</CardTitle>
        <p className="text-xs text-muted-foreground">Este mês</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center text-xs text-muted-foreground">Carregando…</div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
              <CreditCard className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium mb-1">Sem pagamentos este mês</p>
            <p className="text-xs text-muted-foreground">
              A distribuição por método aparecerá aqui.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={items} cx={75} cy={75} innerRadius={50} outerRadius={72}
                    paddingAngle={3} dataKey="value" strokeWidth={0}>
                    {items.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => [formatCurrency(v)]}
                    contentStyle={{ background: "hsl(var(--card))", border:"1px solid hsl(var(--border))", borderRadius:8, fontSize:12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="font-heading text-xl font-bold">{topPct}%</span>
                <span className="text-xs text-muted-foreground">{top?.name ?? ""}</span>
              </div>
            </div>
            <div className="w-full space-y-2">
              {items.map(item => (
                <div key={item.method} className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: item.color }} />
                  <span className="text-sm text-muted-foreground flex-1">{item.name}</span>
                  <span className="text-sm font-semibold">{formatCurrency(item.value)}</span>
                  <span className="text-xs text-muted-foreground w-8 text-right">
                    {total > 0 ? Math.round((item.value / total) * 100) : 0}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
