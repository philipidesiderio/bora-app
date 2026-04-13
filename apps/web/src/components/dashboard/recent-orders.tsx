import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

const orders = [
  { id: "1042", customer: "Maria S.",  total: 89.90,  status: "pago"      },
  { id: "1041", customer: "Carlos O.", total: 234.00, status: "pendente"  },
  { id: "1040", customer: "Ana Lima",  total: 54.50,  status: "pago"      },
  { id: "1039", customer: "Pedro M.",  total: 178.00, status: "cancelado" },
  { id: "1038", customer: "Juliana R.",total: 310.00, status: "pago"      },
];

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pago:      { label: "Pago",      variant: "default"     },
  pendente:  { label: "Pendente",  variant: "secondary"   },
  cancelado: { label: "Cancelado", variant: "destructive" },
};

export function RecentOrders() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="font-heading text-base">Últimos pedidos</CardTitle>
          <Link href="/dashboard/pedidos" className="text-xs text-primary hover:underline px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
            Ver todos →
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {["Pedido","Cliente","Valor","Status"].map(h => (
                <th key={h} className="text-left px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors last:border-0">
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground font-semibold">#{o.id}</td>
                <td className="px-4 py-3 text-sm">{o.customer}</td>
                <td className="px-4 py-3 text-sm font-semibold">{formatCurrency(o.total)}</td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_MAP[o.status]?.variant ?? "secondary"} className="text-[10px]">
                    {STATUS_MAP[o.status]?.label}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
