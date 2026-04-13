import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Copy } from "lucide-react";

const MOCK_PRODUCTS = [
  { name: "X-Burguer", price: "R$14", emoji: "🍔" },
  { name: "Camiseta",  price: "R$29", emoji: "👕" },
  { name: "Capinha",   price: "R$15", emoji: "📱" },
];

export function StorePreview() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="font-heading text-base">Minha Loja Online</CardTitle>
          <Button variant="ghost" size="sm" className="text-xs text-primary h-7 px-3 rounded-full bg-primary/10 border border-primary/20 hover:bg-primary/20">
            Editar →
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="rounded-xl overflow-hidden border border-border mx-4 mb-4">
          <div className="p-3 flex items-center gap-2.5 bg-gradient-to-r from-primary to-orange-400">
            <div className="w-9 h-9 rounded-xl bg-white/20 border-2 border-white/30 flex items-center justify-center text-lg flex-shrink-0">🛍️</div>
            <div>
              <p className="font-heading font-bold text-sm text-white">Loja do João</p>
              <p className="text-xs text-orange-100">bora.app/loja-do-joao</p>
            </div>
          </div>
          <div className="p-3 bg-muted/30">
            <div className="grid grid-cols-3 gap-1.5 mb-3">
              {MOCK_PRODUCTS.map(p => (
                <div key={p.name} className="bg-card rounded-lg p-2 text-center border border-border">
                  <div className="text-xl mb-1">{p.emoji}</div>
                  <p className="text-[10px] text-muted-foreground leading-none mb-0.5">{p.name}</p>
                  <p className="text-xs font-bold text-primary">{p.price}</p>
                </div>
              ))}
            </div>
            <button className="w-full py-2 rounded-lg text-xs font-medium text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors flex items-center justify-center gap-1.5">
              <Copy className="h-3 w-3" /> Copiar link da loja
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
