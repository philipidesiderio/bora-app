"use client";
import { useState } from "react";
import { ShoppingCart, Search, Plus, Minus, X, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, cn } from "@/lib/utils";
import type { Tenant, Product } from "@bora/db";

interface Props { tenant: Tenant; products: (Product & { category?: { name: string } | null })[] }
interface CartItem { product: Product; qty: number }

export function StoreFront({ tenant, products }: Props) {
  const [search,  setSearch]  = useState("");
  const [cart,    setCart]    = useState<CartItem[]>([]);
  const [cartOpen,setCartOpen]= useState(false);

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const total    = cart.reduce((s, i) => s + Number(i.product.price) * i.qty, 0);
  const count    = cart.reduce((s, i) => s + i.qty, 0);

  const addToCart = (p: Product) => setCart(prev => {
    const ex = prev.find(i => i.product.id === p.id);
    if (ex) return prev.map(i => i.product.id === p.id ? { ...i, qty: i.qty + 1 } : i);
    return [...prev, { product: p, qty: 1 }];
  });

  const changeQty = (id: string, delta: number) => setCart(prev =>
    prev.map(i => i.product.id === id ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0)
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Store header */}
      <header className="sticky top-0 z-40 bg-card/90 backdrop-blur border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-xl flex-shrink-0">
            🛍️
          </div>
          <div className="flex-1">
            <h1 className="font-heading font-bold text-base leading-none">{tenant.name}</h1>
            {tenant.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{tenant.description}</p>}
          </div>
          <Button variant="outline" size="sm" className="relative gap-2" onClick={() => setCartOpen(true)}>
            <ShoppingCart className="h-4 w-4" />
            {count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                {count}
              </span>
            )}
            {total > 0 ? formatCurrency(total) : "Carrinho"}
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar produtos..." className="pl-9 h-11"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Products grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Store className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>Nenhum produto encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filtered.map(p => {
              const inCart = cart.find(i => i.product.id === p.id);
              return (
                <div key={p.id} className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-all hover:shadow-md">
                  <div className="aspect-square bg-muted flex items-center justify-center text-5xl">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                    ) : "🛍️"}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium leading-tight mb-1 line-clamp-2">{p.name}</p>
                    {p.category && <p className="text-xs text-muted-foreground mb-2">{p.category.name}</p>}
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-primary">{formatCurrency(Number(p.price))}</span>
                      {inCart ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => changeQty(p.id, -1)}
                            className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center text-xs hover:bg-accent">
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-xs font-bold w-5 text-center">{inCart.qty}</span>
                          <button onClick={() => changeQty(p.id, +1)}
                            className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center text-white hover:bg-primary/90">
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => addToCart(p)}
                          className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all">
                          <Plus className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Cart slide-over */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCartOpen(false)} />
          <div className="relative w-full max-w-sm bg-card border-l border-border flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-heading font-bold">Carrinho ({count})</h2>
              <button onClick={() => setCartOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">Carrinho vazio</p>
              ) : cart.map(item => (
                <div key={item.product.id} className="flex gap-3 p-3 bg-background rounded-xl border border-border">
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center text-2xl flex-shrink-0">🛍️</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.product.name}</p>
                    <p className="text-xs text-primary font-bold">{formatCurrency(Number(item.product.price))}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => changeQty(item.product.id, -1)} className="w-6 h-6 rounded bg-muted text-xs flex items-center justify-center"><Minus className="h-3 w-3"/></button>
                    <span className="w-5 text-center text-xs font-bold">{item.qty}</span>
                    <button onClick={() => changeQty(item.product.id, +1)} className="w-6 h-6 rounded bg-primary/10 text-primary text-xs flex items-center justify-center"><Plus className="h-3 w-3"/></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-border space-y-3">
              <div className="flex justify-between font-heading font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
              <Button className="w-full h-12 text-base font-bold" disabled={cart.length === 0}>
                Finalizar compra
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
