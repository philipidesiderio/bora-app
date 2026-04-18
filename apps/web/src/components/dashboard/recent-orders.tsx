"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { api } from "@/components/providers/trpc-provider";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  paid:      { label: "Pago",      variant: "default"     },
  unpaid:    { label: "Pendente",  variant: "secondary"   },
  partial:   { label: "Parcial",   variant: "secondary"   },
  refunded:  { label: "Reembolso", variant: "outline"     },
  void:      { label: "Cancelado", variant: "destructive" },
};

export function RecentOrders() {
  const { data, isLoading } = api.dashboard.getRecentOrders.useQuery(undefined, {
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const orders = data ?? [];

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
        {isLoading ? (
          <div className="p-6 text-center text-xs text-muted-foreground">Carregando…</div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
              <ShoppingBag className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium mb-1">Sem pedidos ainda</p>
            <p className="text-xs text-muted-foreground">
              Quando você fizer sua primeira venda, ela aparecerá aqui.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[380px]">
              <thead>
                <tr className="border-b border-border">
                  {["Pedido","Cliente","Valor","Status"].map(h => (
                    <th key={h} className="text-left px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o: any) => {
                  const statusKey = o.payment_status ?? "unpaid";
                  const info = STATUS_MAP[statusKey] ?? { label: statusKey, variant: "secondary" as const };
                  return (
                    <tr key={o.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors last:border-0">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground font-semibold">#{o.number ?? o.id.slice(0, 6)}</td>
                      <td className="px-4 py-3 text-sm">{o.customer?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-sm font-semibold">{formatCurrency(Number(o.total ?? 0))}</td>
                      <td className="px-4 py-3">
                        <Badge variant={info.variant} className="text-[10px]">
                          {info.label}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
