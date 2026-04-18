"use client";
import { CheckCircle, Sparkles } from "lucide-react";
import { api } from "@/components/providers/trpc-provider";
import { formatCurrency } from "@/lib/utils";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)   return "agora";
  if (mins < 60)  return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs  < 24)  return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

export function ActivityFeed() {
  const { data, isLoading } = api.dashboard.getRecentOrders.useQuery(undefined, {
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
  const orders = data ?? [];

  return (
    <div className="bg-card rounded-xl border p-4">
      <h2 className="text-sm font-semibold mb-4">Atividade Recente</h2>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Carregando…</p>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <p className="text-sm font-medium mb-1">Tudo pronto!</p>
          <p className="text-xs text-muted-foreground">
            Suas atividades aparecerão aqui conforme você usar o sistema.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o: any) => (
            <div key={o.id} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">
                  Pedido <strong>#{o.number ?? o.id.slice(0, 6)}</strong> — {formatCurrency(Number(o.total ?? 0))}
                </p>
                <span className="text-xs text-muted-foreground/60">{timeAgo(o.created_at)} atrás</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
