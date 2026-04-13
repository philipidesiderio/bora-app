"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";

const data = [
  { day: "Seg", value: 1200 }, { day: "Ter", value: 1800 },
  { day: "Qua", value:  950 }, { day: "Qui", value: 2200 },
  { day: "Hoj", value: 1847, today: true },
  { day: "Sáb", value:  0  }, { day: "Dom", value:  0  },
];

export function SalesChart() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-heading text-base">Vendas dos últimos 7 dias</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Comparado à semana anterior</p>
          </div>
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            {["Semana","Mês"].map((t,i) => (
              <button key={t} className={`text-xs px-3 py-1 rounded-md transition-all ${i===0?"bg-background shadow text-foreground font-medium":"text-muted-foreground"}`}>{t}</button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip
              formatter={(v: number) => [formatCurrency(v), "Vendas"]}
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
              cursor={{ fill: "hsl(var(--accent))" }}
            />
            <Bar dataKey="value" radius={[6,6,0,0]}
              fill="hsl(var(--primary))"
              className="transition-opacity"
            />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Meta mensal: R$12.000</span>
            <span className="font-semibold">R$8.340 <span className="text-muted-foreground font-normal">(69%)</span></span>
          </div>
          <Progress value={69} className="h-1.5" />
        </div>
      </CardContent>
    </Card>
  );
}
