"use client";
import { Store, ExternalLink, Copy, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/components/providers/trpc-provider";

export default function CatalogoPage() {
  const { data: tenant } = api.dashboard.getStats.useQuery();
  const storeSlug = (tenant as any)?.storeSlug ?? "loja-demo";
  const storeUrl = `lumipos.com/${storeSlug}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Catálogo Online</h1>
        <p className="text-sm text-muted-foreground">Sua loja pública na internet</p>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="p-4 flex items-center gap-3 bg-gradient-to-r from-primary to-primary/80">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl">
            🛍️
          </div>
          <div>
            <p className="font-heading font-bold text-white">{tenant?.userName ?? "Minha Loja"}</p>
            <p className="text-xs text-white/70 font-mono">{storeUrl}</p>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {["🍔 Lanches", "🥤 Bebidas", "👕 Roupas"].map((cat, i) => (
              <div key={i} className="aspect-square rounded-xl bg-muted/50 flex items-center justify-center text-sm">
                {cat}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button className="flex-1" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver loja
            </Button>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </div>

          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-xl">
            <Copy className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-mono flex-1">{storeUrl}</span>
            <Button variant="ghost" size="sm" className="h-8">Copiar</Button>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-muted/30 border border-dashed border-border">
        <p className="text-sm text-muted-foreground text-center">
          Compartilhe seu catálogo com clientes via WhatsApp, redes sociais ou link direto.
        </p>
      </div>
    </div>
  );
}