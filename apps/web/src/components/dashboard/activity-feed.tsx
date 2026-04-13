import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ACTIVITY = [
  { icon: "✅", bg: "bg-emerald-500/10", msg: <>Venda <strong>#1042</strong> concluída — R$89,90 via PIX</>,          time: "5 min atrás"  },
  { icon: "🛍️", bg: "bg-blue-500/10",    msg: <>Novo pedido online de <strong>Maria Santos</strong></>,               time: "14 min atrás" },
  { icon: "⚠️", bg: "bg-yellow-500/10",  msg: <>Estoque baixo: <strong>Tênis Running</strong> (2 un.)</>,            time: "32 min atrás" },
  { icon: "👤", bg: "bg-purple-500/10",  msg: <>Novo cliente: <strong>Pedro M.</strong></>,                           time: "1h atrás"     },
  { icon: "↩️", bg: "bg-red-500/10",     msg: <>Devolução registrada no pedido <strong>#1039</strong></>,             time: "2h atrás"     },
];

export function ActivityFeed() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="font-heading text-base">Atividade recente</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-0">
          {ACTIVITY.map((a, i) => (
            <div key={i} className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-0.5 ${a.bg}`}>
                {a.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-snug">{a.msg}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{a.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
