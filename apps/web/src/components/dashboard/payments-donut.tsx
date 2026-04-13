"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

const data = [
  { name: "PIX",          value: 3169, color: "#FF6B2C" },
  { name: "Cartão Débito",value: 2085, color: "#3D9EFF" },
  { name: "Cartão Crédito",value:1835, color: "#9B6DFF" },
  { name: "Dinheiro",     value: 1251, color: "#2ECC8A" },
];
const total = data.reduce((s, d) => s + d.value, 0);

export function PaymentsDonut() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="font-heading text-base">Formas de pagamento</CardTitle>
        <p className="text-xs text-muted-foreground">Este mês</p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={data} cx={75} cy={75} innerRadius={50} outerRadius={72}
                  paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => [formatCurrency(v)]}
                  contentStyle={{ background: "hsl(var(--card))", border:"1px solid hsl(var(--border))", borderRadius:8, fontSize:12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="font-heading text-xl font-bold">38%</span>
              <span className="text-xs text-muted-foreground">PIX</span>
            </div>
          </div>
          <div className="w-full space-y-2">
            {data.map(item => (
              <div key={item.name} className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: item.color }} />
                <span className="text-sm text-muted-foreground flex-1">{item.name}</span>
                <span className="text-sm font-semibold">{formatCurrency(item.value)}</span>
                <span className="text-xs text-muted-foreground w-8 text-right">
                  {Math.round((item.value / total) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
