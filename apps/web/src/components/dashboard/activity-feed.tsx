"use client";
import { CheckCircle, ShoppingBag, AlertTriangle, User, RotateCcw } from "lucide-react";

const ACTIVITY_ITEMS = [
  { icon: CheckCircle, bg: "bg-emerald-500/10", color: "text-emerald-600", msg: <>Venda <strong>#1042</strong> conclua - R$89,90 via PIX</>, time: "5 min"  },
  { icon: ShoppingBag, bg: "bg-blue-500/10",    color: "text-blue-600",   msg: <>Novo pedido online de <strong>Maria Santos</strong></>,            time: "14 min" },
  { icon: AlertTriangle, bg: "bg-yellow-500/10",  color: "text-yellow-600", msg: <>Estoque baixo: <strong>Tenis Running</strong> (2 un.)</>,          time: "32 min" },
  { icon: User, bg: "bg-purple-500/10",  color: "text-purple-600",    msg: <>Novo cliente: <strong>Pedro M.</strong></>,                           time: "1h"     },
  { icon: RotateCcw, bg: "bg-red-500/10",     color: "text-red-600",     msg: <>Devolucao registrada no pedido <strong>#1039</strong></>,          time: "2h"     },
];

export function ActivityFeed() {
  return (
    <div className="bg-card rounded-xl border p-4">
      <h2 className="text-sm font-semibold mb-4">Atividade Recente</h2>
      <div className="space-y-3">
        {ACTIVITY_ITEMS.map((item, i) => {
          const IconComponent = item.icon;
          return (
            <div key={i} className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full ${item.bg} flex items-center justify-center flex-shrink-0`}>
                <IconComponent className={`w-4 h-4 ${item.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">{item.msg}</p>
                <span className="text-xs text-muted-foreground/60">{item.time} atras</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
