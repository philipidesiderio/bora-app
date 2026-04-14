"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Check, Search, Plus, Minus, ShoppingCart, CreditCard, Banknote, Wifi, Building, Receipt } from "lucide-react";

const PAY_METHODS = [
  { value: "pix",     label: "PIX",      icon: Wifi,       color: "bg-emerald-50 border-emerald-400 text-emerald-700" },
  { value: "cash",    label: "Dinheiro", icon: Banknote,   color: "bg-blue-50 border-blue-400 text-blue-700"         },
  { value: "credit",  label: "Credito",  icon: CreditCard, color: "bg-purple-50 border-purple-400 text-purple-700"   },
  { value: "debit",   label: "Debito",   icon: Building,   color: "bg-amber-50 border-amber-400 text-amber-700"      },
  { value: "account", label: "Fiado",    icon: Receipt,    color: "bg-rose-50 border-rose-400 text-rose-700"         },
];

const categories = [
  { id: "all", name: "Todos", icon: "Package" },
];

export function PDVScreen() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [payment, setPayment] = useState("pix");
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("all");
  const [tendered, setTendered] = useState("");
  const [isFiado, setIsFiado] = useState(false);
  const [createOrder, setCreateOrder] = useState({ isPending: false });

  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

  const add = (p: any) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === p.id);
      if (ex) return prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { id: p.id, name: p.name, price: Number(p.price), costPrice: Number(p.cost_price ?? 0), qty: 1 }];
    });
  };

  const remove = (id: number) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === id);
      if (ex && ex.qty > 1) return prev.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i);
      return prev.filter(i => i.id !== id);
    });
  };

  const finish = () => {
    if (!cart.length) { toast.error("Adicione itens ao carrinho"); return; }
    setCreateOrder({ isPending: true });
    setTimeout(() => {
      setCreateOrder({ isPending: false });
      toast.success("Venda registrada!");
      setCart([]);
      setIsFiado(false); setTendered("");
    }, 1400);
  };

  const change = total - Number(tendered || 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-card">
        <h1 className="font-heading text-lg font-bold">PDV</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Receipt className="w-4 h-4" />
          <span className="font-medium">{cart.length} itens</span>
        </div>
      </div>

      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar produto..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border bg-background text-sm"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 px-3 pb-3 overflow-x-auto">
        {[{ id: "all", name: "Todos" }, ...categories.filter(c => c.id !== "all")].map(c => (
          <button key={c.id} onClick={() => setCat(c.id)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
              cat === c.id ? "bg-primary text-white border-primary" : "bg-muted/50 text-muted-foreground border-transparent"
            }`}>
            {c.name}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-2 gap-2">
          {/* Placeholder products */}
          {Array.from({ length: 6 }).map((_, i) => (
            <button key={i} onClick={() => add({ id: i, name: `Produto ${i + 1}`, price: 10 * (i + 1) })}
              className="aspect-square rounded-xl border bg-card p-3 flex flex-col items-center justify-center gap-2 text-center hover:border-primary/50 transition-all">
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-xs font-medium leading-tight line-clamp-2">Produto {i + 1}</p>
              <p className="text-xs font-bold text-primary">R$ {10 * (i + 1)}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Cart Summary */}
      {cart.length > 0 && (
        <div className="border-t bg-card p-3 space-y-2">
          <div className="max-h-32 overflow-y-auto space-y-1">
            {cart.map(item => (
              <div key={item.id} className="flex items-center justify-between text-sm py-1">
                <div className="flex-1 truncate">{item.qty}x {item.name}</div>
                <div className="flex items-center gap-2 ml-2">
                  <button onClick={() => remove(item.id)} className="p-1 hover:bg-muted rounded">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-medium w-16 text-right">R$ {(item.price * item.qty).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between font-bold text-lg pt-2 border-t">
            <span>Total</span>
            <span className="text-primary">R$ {total.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Payment Methods */}
      <div className="border-t bg-card p-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Forma de pagamento</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {PAY_METHODS.map(method => {
            const IconComponent = method.icon;
            return (
              <button key={method.value} onClick={() => setPayment(method.value)}
                className={`flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all ${payment === method.value ? method.color + " border-current" : "border-transparent bg-muted/50"}`}>
                <IconComponent className="w-5 h-5" />
                <span className="text-[10px] font-medium">{method.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Finish Button */}
      <div className="p-3 border-t bg-card">
        <button onClick={finish} disabled={!cart.length || createOrder.isPending}
          className="w-full h-14 rounded-xl bg-primary text-white font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
          <Check className="w-5 h-5" />
          {createOrder.isPending ? "Registrando..." : isFiado ? `Lancar no fiado - R$ ${total.toFixed(2)}` : `Confirmar - R$ ${total.toFixed(2)}`}
        </button>
      </div>
    </div>
  );
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  costPrice: number;
  qty: number;
}
