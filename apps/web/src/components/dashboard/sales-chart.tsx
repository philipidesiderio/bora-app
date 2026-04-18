"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";
import { api } from "@/components/providers/trpc-provider";

const MONTHLY_GOAL = 12_000; // TODO: por na config do tenant

export function SalesChart() {
  const { data, isLoading } = api.dashboard.getSalesLast7Days.useQuery(undefined, {
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const buckets    = data?.buckets ?? [];
  const monthTotal = data?.monthTotal ?? 0;
  const pct        = Math.min(100, Math.round((monthTotal / MONTHLY_GOAL) * 100));
  const hasData    = buckets.some(b => b.value > 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-heading text-base">Vendas dos últimos 7 dias</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Receita diária</p>
          </div>
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            {["Semana","Mês"].map((t,i) => (
              <button key={t} className={`text-xs px-3 py-1 rounded-md transition-all ${i===0?"bg-background shadow text-foreground font-medium":"text-muted-foreground"}`}>{t}</button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[160px] flex items-center justify-center text-xs text-muted-foreground">Carregando…</div>
        ) : !hasData ? (
          <div className="h-[160px] flex flex-col items-center justify-center text-center">
            <p className="text-sm font-medium">Sem vendas nos últimos 7 dias</p>
            <p className="text-xs text-muted-foreground mt-1">Suas vendas aparecerão neste gráfico.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={buckets} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                formatter={(v: number) => [formatCurrency(v), "Vendas"]}
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                cursor={{ fill: "hsl(var(--accent))" }}
              />
              <Bar dataKey="value" radius={[6,6,0,0]} fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        )}
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Meta mensal: {formatCurrency(MONTHLY_GOAL)}</span>
            <span className="font-semibold">{formatCurrency(monthTotal)} <span className="text-muted-foreground font-normal">({pct}%)</span></span>
          </div>
          <Progress value={pct} className="h-1.5" />
        </div>
      </CardContent>
    </Card>
  );
}
