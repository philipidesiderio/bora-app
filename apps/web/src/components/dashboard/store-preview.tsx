"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { api } from "@/components/providers/trpc-provider";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";

export function StorePreview() {
  const { data, isLoading } = api.dashboard.getStorePreview.useQuery(undefined, {
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const tenant   = data?.tenant;
  const products = data?.products ?? [];

  const storeUrl = tenant?.slug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/loja/${tenant.slug}`
    : "";

  const copyLink = async () => {
    if (!storeUrl) return;
    try {
      await navigator.clipboard.writeText(storeUrl);
      toast.success("Link copiado!");
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="font-heading text-base">Minha Loja Online</CardTitle>
          <Link href="/dashboard/configuracoes">
            <Button variant="ghost" size="sm" className="text-xs text-primary h-7 px-3 rounded-full bg-primary/10 border border-primary/20 hover:bg-primary/20">
              Editar →
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="rounded-xl overflow-hidden border border-border mx-4 mb-4">
          <div className="p-3 flex items-center gap-2.5 bg-gradient-to-r from-primary to-orange-400">
            <div className="w-9 h-9 rounded-xl bg-white/20 border-2 border-white/30 flex items-center justify-center text-lg flex-shrink-0 overflow-hidden">
              {tenant?.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={tenant.logo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                "🛍️"
              )}
            </div>
            <div className="min-w-0">
              <p className="font-heading font-bold text-sm text-white truncate">
                {isLoading ? "Carregando…" : tenant?.name ?? "Sua Loja"}
              </p>
              <p className="text-xs text-orange-100 truncate">
                {tenant?.slug ? `lumipos.com/loja/${tenant.slug}` : ""}
              </p>
            </div>
          </div>
          <div className="p-3 bg-muted/30">
            {products.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-xs text-muted-foreground mb-2">
                  Nenhum produto cadastrado ainda
                </p>
                <Link href="/dashboard/produtos">
                  <Button size="sm" variant="outline" className="text-xs h-7">
                    + Adicionar produto
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1.5 mb-3">
                {products.map(p => (
                  <div key={p.id} className="bg-card rounded-lg p-2 text-center border border-border">
                    <div className="text-xl mb-1">📦</div>
                    <p className="text-[10px] text-muted-foreground leading-none mb-0.5 truncate">{p.name}</p>
                    <p className="text-xs font-bold text-primary">{formatCurrency(Number(p.price ?? 0))}</p>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={copyLink}
              disabled={!storeUrl}
              className="w-full py-2 rounded-lg text-xs font-medium text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Copy className="h-3 w-3" /> Copiar link da loja
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
