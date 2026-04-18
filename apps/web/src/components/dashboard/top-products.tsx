"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { api } from "@/components/providers/trpc-provider";
import Link from "next/link";
import { Package } from "lucide-react";

export function TopProducts() {
  const { data, isLoading } = api.dashboard.getTopProducts.useQuery(undefined, {
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const products = data ?? [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="font-heading text-base">Produtos mais vendidos</CardTitle>
          <Link href="/dashboard/relatorios" className="text-xs text-primary hover:underline px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
            Ver todos →
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-6 text-center text-xs text-muted-foreground">Carregando…</div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
              <Package className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium mb-1">Ainda sem vendas</p>
            <p className="text-xs text-muted-foreground">
              Os produtos mais vendidos dos últimos 30 dias aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[320px]">
              <thead>
                <tr className="border-b border-border">
                  {["Produto","Qtd","Receita"].map(h => (
                    <th key={h} className="text-left px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.name} className="border-b border-border/50 hover:bg-accent/30 transition-colors last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-base flex-shrink-0">
                          📦
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-none truncate max-w-[140px]">{p.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-bold">{p.qty}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-emerald-400 whitespace-nowrap">{formatCurrency(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
