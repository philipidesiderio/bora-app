"use client";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Search, ShoppingCart, Plus, Minus, Trash2, X, ChevronUp, Check, UserSearch, Tag, Banknote } from "lucide-react";
import { api } from "@/components/providers/trpc-provider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency, cn } from "@/lib/utils";

interface CartItem { id: string; name: string; price: number; costPrice: number; qty: number; emoji: string }
interface Payment  { method: PayMethod; amount: number }
type PayMethod = "pix" | "cash" | "credit" | "debit" | "account";

const PAY_OPTIONS: { value: PayMethod; label: string; icon: string; color: string }[] = [
  { value: "pix",     label: "PIX",      icon: "⚡", color: "bg-emerald-50 border-emerald-400 text-emerald-700" },
  { value: "cash",    label: "Dinheiro", icon: "💵", color: "bg-blue-50 border-blue-400 text-blue-700"         },
  { value: "credit",  label: "Crédito",  icon: "💳", color: "bg-purple-50 border-purple-400 text-purple-700"   },
  { value: "debit",   label: "Débito",   icon: "🏦", color: "bg-amber-50 border-amber-400 text-amber-700"      },
  { value: "account", label: "Fiado",    icon: "📋", color: "bg-rose-50 border-rose-400 text-rose-700"         },
];

function calcChange(payments: Payment[], total: number): number {
  const cashAmt = payments.filter(p => p.method === "cash").reduce((s, p) => s + p.amount, 0);
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  return totalPaid > total ? cashAmt > 0 ? totalPaid - total : 0 : 0;
}

export function PDVScreen() {
  const [search, setSearch]               = useState("");
  const [debouncedSearch, setDebounced]   = useState("");
  const [activeCat, setActiveCat]         = useState("all");
  const [cart, setCart]                   = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen]           = useState(false);
  const [checkoutOpen, setCheckoutOpen]   = useState(false);
  const [done, setDone]                   = useState(false);

  // Checkout state
  const [payments, setPayments]           = useState<Payment[]>([{ method: "pix", amount: 0 }]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerSearch, setCustomerSearch]     = useState("");
  const [couponCode, setCouponCode]             = useState("");
  const [couponResult, setCouponResult]         = useState<any>(null);
  const [isFiado, setIsFiado]                   = useState(false);
  const [tendered, setTendered]                 = useState("");

  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: categoriesData = [] } = api.products.listCategories.useQuery();
  const { data: productsData = [], isLoading } = api.products.list.useQuery({
    search: debouncedSearch || undefined,
    categoryId: activeCat !== "all" ? activeCat : undefined,
    limit: 100,
  });
  const { data: customerResults = [] } = api.customers.list.useQuery(
    { search: customerSearch, limit: 5 },
    { enabled: customerSearch.length >= 2 }
  );

  const validateCoupon = api.coupons.validate.useQuery(
    { code: couponCode, cartTotal: cart.reduce((s, i) => s + i.price * i.qty, 0) },
    { enabled: false }
  );

  const categories = [
    { id: "all", name: "Todos", emoji: "🏷️" },
    ...categoriesData.map((c: any) => ({ id: c.id, name: c.name, emoji: c.emoji ?? "📦" })),
  ];

  const createOrder = api.orders.createWithPayments.useMutation({
    onSuccess: () => {
      setDone(true);
      setTimeout(() => {
        setCart([]); setCheckoutOpen(false); setCartOpen(false); setDone(false);
        setPayments([{ method: "pix", amount: 0 }]);
        setSelectedCustomer(null); setCustomerSearch(""); setCouponCode(""); setCouponResult(null);
        setIsFiado(false); setTendered("");
        toast.success("✅ Venda registrada!");
      }, 1400);
    },
    onError: (e) => toast.error(e.message),
  });

  const addToCart = (p: typeof productsData[0]) => {
    const price = Number(p.price);
    setCart(prev => {
      const ex = prev.find(i => i.id === p.id);
      if (ex) return prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { id: p.id, name: p.name, price, costPrice: Number(p.cost_price ?? 0), qty: 1, emoji: (p as any).category?.emoji ?? "📦" }];
    });
  };

  const changeQty = (id: string, delta: number) =>
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0));

  const subtotal        = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const couponDiscount  = couponResult?.valid ? (couponResult.discountAmount ?? 0) : 0;
  const total           = Math.max(0, subtotal - couponDiscount);
  const itemCount       = cart.reduce((s, i) => s + i.qty, 0);
  const totalPaid       = isFiado ? 0 : payments.reduce((s, p) => s + p.amount, 0);
  const remaining       = total - totalPaid;
  const change          = calcChange(payments, total);
  const isReadyToPay    = isFiado ? !!selectedCustomer : totalPaid >= total;

  const openCheckout = () => {
    setPayments([{ method: "pix", amount: total }]);
    setIsFiado(false); setTendered("");
    setCheckoutOpen(true); setCartOpen(false);
  };

  const handleCheckCoupon = async () => {
    if (!couponCode.trim()) return;
    const res = await validateCoupon.refetch();
    setCouponResult(res.data);
    if (res.data?.valid) toast.success(`Cupom aplicado! -${formatCurrency(res.data.discountAmount)}`);
    else toast.error(res.data?.error ?? "Cupom inválido");
  };

  const updatePaymentMethod = (idx: number, method: PayMethod) => {
    setPayments(prev => prev.map((p, i) => i === idx ? { ...p, method } : p));
  };
  const updatePaymentAmount = (idx: number, amount: number) => {
    setPayments(prev => prev.map((p, i) => i === idx ? { ...p, amount } : p));
  };
  const addPaymentLine = () => setPayments(prev => [...prev, { method: "pix", amount: Math.max(0, remaining) }]);
  const removePaymentLine = (idx: number) => setPayments(prev => prev.filter((_, i) => i !== idx));

  const confirmSale = () => {
    const finalPayments = isFiado
      ? []
      : payments.map(p => ({ method: p.method, amount: p.amount }));

    const instalments = isFiado
      ? [{ amount: total }]
      : remaining > 0
        ? [{ amount: remaining }]
        : [];

    createOrder.mutate({
      items: cart.map(i => ({
        productId: i.id, name: i.name, quantity: i.qty,
        unitPrice: i.price, costPrice: i.costPrice,
      })),
      payments: finalPayments.length > 0 ? finalPayments : [{ method: "pix", amount: 0 }],
      instalments,
      customerId: selectedCustomer?.id,
      couponCode: couponCode || undefined,
      discount:   couponDiscount,
      discountType: "flat",
      channel: "pdv",
    });
  };

  /* ─── Products panel (shared desktop + mobile) ─── */
  const ProductsGrid = ({ cols = "grid-cols-3 lg:grid-cols-4" }: { cols?: string }) => (
    <div className={cn("grid gap-2.5", cols)}>
      {productsData.map((p: any) => {
        const inCart = cart.find(i => i.id === p.id);
        return (
          <button key={p.id} onClick={() => addToCart(p)}
            className={cn(
              "relative flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-center transition-all active:scale-95",
              inCart ? "border-primary/50 bg-primary/8 shadow-sm" : "border-border bg-card hover:border-primary/30 hover:shadow-sm"
            )}>
            {inCart && (
              <span className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                {inCart.qty}
              </span>
            )}
            <span className="text-3xl">{p.category?.emoji ?? "📦"}</span>
            <p className="text-[11px] font-medium leading-tight line-clamp-2 min-h-[2rem]">{p.name}</p>
            <p className="text-sm font-bold text-primary font-mono">{formatCurrency(Number(p.price))}</p>
          </button>
        );
      })}
    </div>
  );

  const SearchBar = (
    <div className="relative">
      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input ref={searchRef} placeholder="Buscar produto..." className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} />
    </div>
  );

  const CategoryPills = (
    <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
      {categories.map((c: any) => (
        <button key={c.id} onClick={() => setActiveCat(c.id)}
          className={cn(
            "flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border",
            activeCat === c.id ? "bg-primary text-white border-primary shadow-sm" : "bg-card border-border text-muted-foreground"
          )}>
          <span>{c.emoji}</span>{c.name}
        </button>
      ))}
    </div>
  );

  return (
    <>
      {/* ─── DESKTOP ─── */}
      <div className="hidden md:flex h-[calc(100vh-64px)] -m-6 overflow-hidden">
        {/* Left: products */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-3 space-y-2.5 border-b border-border bg-background">
            {SearchBar}{CategoryPills}
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {isLoading ? (
              <div className="grid grid-cols-3 lg:grid-cols-4 gap-2.5">
                {Array.from({ length: 12 }).map((_, i) => <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />)}
              </div>
            ) : productsData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-16">
                <span className="text-5xl mb-3">🔍</span><p className="font-medium">Nenhum produto</p>
              </div>
            ) : <ProductsGrid />}
          </div>
        </div>

        {/* Right: cart */}
        <div className="w-80 flex flex-col bg-card border-l border-border">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2 font-heading font-bold">
              <ShoppingCart className="h-4 w-4 text-primary" />Carrinho
              {itemCount > 0 && <span className="w-5 h-5 bg-primary rounded-full text-white text-[10px] font-bold flex items-center justify-center">{itemCount}</span>}
            </div>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="text-xs text-muted-foreground flex items-center gap-1 hover:text-destructive transition-colors">
                <Trash2 className="h-3 w-3" />Limpar
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <ShoppingCart className="h-10 w-10 mb-2 opacity-20" /><p className="text-sm">Carrinho vazio</p>
              </div>
            ) : cart.map(item => (
              <div key={item.id} className="flex items-center gap-2 p-2.5 bg-background rounded-xl border border-border">
                <span className="text-lg flex-shrink-0">{item.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{item.name}</p>
                  <p className="text-xs text-primary font-bold font-mono">{formatCurrency(item.price * item.qty)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => changeQty(item.id, -1)} className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center active:scale-90 transition-all"><Minus className="h-3 w-3" /></button>
                  <span className="w-5 text-center text-xs font-bold">{item.qty}</span>
                  <button onClick={() => changeQty(item.id, +1)} className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center active:scale-90 transition-all text-primary"><Plus className="h-3 w-3" /></button>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-border space-y-3">
            {couponDiscount > 0 && (
              <div className="flex justify-between text-sm text-emerald-600">
                <span>Cupom {couponCode}</span><span>-{formatCurrency(couponDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="font-heading font-bold text-lg">Total</span>
              <span className="font-heading font-bold text-2xl text-primary font-mono">{formatCurrency(total)}</span>
            </div>
            <Button className="w-full h-12 text-base font-bold rounded-xl" disabled={cart.length === 0} onClick={openCheckout}>
              {cart.length === 0 ? "Sem itens" : `Cobrar ${formatCurrency(total)}`}
            </Button>
          </div>
        </div>
      </div>

      {/* ─── MOBILE ─── */}
      <div className="flex md:hidden flex-col h-[calc(100dvh-56px-64px)] -m-4 overflow-hidden">
        <div className="px-3 pt-3 pb-2 space-y-2 bg-background border-b border-border">
          {SearchBar}{CategoryPills}
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />)}</div>
          ) : productsData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground"><span className="text-4xl mb-2">🔍</span><p className="text-sm">Nenhum produto</p></div>
          ) : <ProductsGrid cols="grid-cols-2" />}
        </div>
        {itemCount > 0 && !cartOpen && (
          <div className="px-4 pb-3 bg-background border-t border-border">
            <button onClick={() => setCartOpen(true)}
              className="w-full flex items-center justify-between bg-primary text-white rounded-2xl px-5 h-14 shadow-lg shadow-primary/30 active:scale-98 transition-all">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white text-primary rounded-full text-[9px] font-black flex items-center justify-center">{itemCount}</span>
                </div>
                <span className="font-semibold text-sm">{itemCount} {itemCount === 1 ? "item" : "itens"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg font-mono">{formatCurrency(total)}</span>
                <ChevronUp className="h-4 w-4 opacity-70" />
              </div>
            </button>
          </div>
        )}
      </div>

      {/* ─── MOBILE CART SHEET ─── */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex flex-col md:hidden">
          <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
          <div className="bg-card rounded-t-3xl shadow-2xl max-h-[85dvh] flex flex-col">
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-border" /></div>
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <div className="flex items-center gap-2 font-heading font-bold text-lg">
                <ShoppingCart className="h-5 w-5 text-primary" />Carrinho
                <span className="w-6 h-6 bg-primary rounded-full text-white text-xs font-bold flex items-center justify-center">{itemCount}</span>
              </div>
              <div className="flex items-center gap-3">
                {cart.length > 0 && <button onClick={() => setCart([])} className="text-xs text-muted-foreground flex items-center gap-1"><Trash2 className="h-3.5 w-3.5" />Limpar</button>}
                <button onClick={() => setCartOpen(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"><X className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-background rounded-2xl border border-border">
                  <span className="text-2xl flex-shrink-0">{item.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{formatCurrency(item.price)} × {item.qty}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => changeQty(item.id, -1)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center active:scale-90 transition-all"><Minus className="h-3.5 w-3.5" /></button>
                    <span className="w-6 text-center font-bold text-sm">{item.qty}</span>
                    <button onClick={() => changeQty(item.id, +1)} className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center active:scale-90 transition-all text-primary"><Plus className="h-3.5 w-3.5" /></button>
                  </div>
                  <p className="font-bold text-sm font-mono text-primary w-16 text-right">{formatCurrency(item.price * item.qty)}</p>
                </div>
              ))}
            </div>
            <div className="px-5 pb-6 pt-4 border-t border-border space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-heading font-bold text-xl">Total</span>
                <span className="font-heading font-bold text-3xl text-primary font-mono">{formatCurrency(total)}</span>
              </div>
              <button onClick={openCheckout} className="w-full h-14 rounded-2xl bg-primary text-white font-bold text-lg active:scale-98 transition-all shadow-lg shadow-primary/30">
                Cobrar {formatCurrency(total)} →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CHECKOUT SHEET ─── */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50 flex flex-col">
          <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => !createOrder.isPending && !done && setCheckoutOpen(false)} />
          <div className="bg-card rounded-t-3xl shadow-2xl pb-safe overflow-y-auto max-h-[92dvh]">
            <div className="flex justify-center pt-3 pb-2"><div className="w-10 h-1 rounded-full bg-border" /></div>

            {done ? (
              <div className="flex flex-col items-center py-12 px-6">
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                  <Check className="h-10 w-10 text-emerald-600" strokeWidth={2.5} />
                </div>
                <p className="font-heading font-bold text-2xl text-emerald-700">Venda registrada!</p>
                <p className="text-muted-foreground text-sm mt-1 font-mono">{formatCurrency(total)}</p>
              </div>
            ) : (
              <div className="px-5 pb-8 pt-2 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-heading font-bold text-xl">Finalizar venda</h2>
                  <button onClick={() => setCheckoutOpen(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"><X className="h-4 w-4" /></button>
                </div>

                {/* Resumo */}
                <div className="bg-muted/50 rounded-2xl p-4 space-y-2">
                  {cart.map(i => (
                    <div key={i.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground truncate max-w-[60%]">{i.name} ×{i.qty}</span>
                      <span className="font-semibold font-mono">{formatCurrency(i.price * i.qty)}</span>
                    </div>
                  ))}
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-sm text-emerald-600 border-t border-border pt-2">
                      <span>Cupom {couponCode}</span><span>-{formatCurrency(couponDiscount)}</span>
                    </div>
                  )}
                  <div className="border-t border-border pt-2 flex justify-between font-bold text-base">
                    <span>Total</span><span className="text-primary font-mono">{formatCurrency(total)}</span>
                  </div>
                </div>

                {/* Busca de cliente */}
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5"><UserSearch className="h-4 w-4" />Cliente (opcional)</p>
                  {selectedCustomer ? (
                    <div className="flex items-center justify-between p-3 bg-primary/8 border border-primary/30 rounded-xl">
                      <div>
                        <p className="font-semibold text-sm">{selectedCustomer.name}</p>
                        {selectedCustomer.credit_balance > 0 && (
                          <p className="text-xs text-rose-600">Fiado: {formatCurrency(Number(selectedCustomer.credit_balance))}</p>
                        )}
                      </div>
                      <button onClick={() => { setSelectedCustomer(null); setCustomerSearch(""); }} className="text-muted-foreground"><X className="h-4 w-4" /></button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Input placeholder="Nome ou telefone..." value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} className="h-9" />
                      {customerResults.length > 0 && customerSearch.length >= 2 && (
                        <div className="absolute top-full left-0 right-0 bg-card border border-border rounded-xl shadow-lg z-10 overflow-hidden mt-1">
                          {customerResults.map((c: any) => (
                            <button key={c.id} onClick={() => { setSelectedCustomer(c); setCustomerSearch(""); }}
                              className="w-full text-left px-4 py-2.5 hover:bg-muted text-sm border-b border-border last:border-0">
                              <p className="font-semibold">{c.name}</p>
                              {c.phone && <p className="text-xs text-muted-foreground">{c.phone}</p>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Cupom */}
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5"><Tag className="h-4 w-4" />Cupom de desconto</p>
                  <div className="flex gap-2">
                    <Input placeholder="Código do cupom" value={couponCode} onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponResult(null); }} className="h-9 font-mono uppercase" />
                    <Button variant="outline" className="h-9 px-4 shrink-0" onClick={handleCheckCoupon} disabled={!couponCode}>Aplicar</Button>
                  </div>
                  {couponResult && !couponResult.valid && <p className="text-xs text-destructive">{couponResult.error}</p>}
                </div>

                {/* Modo fiado (toggle) */}
                {selectedCustomer && (
                  <div className="flex items-center justify-between p-3 bg-rose-50 border border-rose-200 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📋</span>
                      <div>
                        <p className="text-sm font-semibold text-rose-700">Lançar como fiado</p>
                        <p className="text-xs text-rose-500">Pagar depois</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsFiado(f => !f)}
                      className={cn(
                        "w-12 h-6 rounded-full transition-all relative",
                        isFiado ? "bg-rose-500" : "bg-muted"
                      )}>
                      <span className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all", isFiado ? "left-6" : "left-0.5")} />
                    </button>
                  </div>
                )}

                {/* Formas de pagamento */}
                {!isFiado && (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5"><Banknote className="h-4 w-4" />Pagamento</p>

                    {payments.map((p, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="grid grid-cols-4 gap-1.5">
                          {PAY_OPTIONS.slice(0, 4).map(opt => (
                            <button key={opt.value} onClick={() => updatePaymentMethod(idx, opt.value)}
                              className={cn(
                                "flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 text-xs font-semibold transition-all",
                                p.method === opt.value ? opt.color + " border-current" : "border-border bg-background"
                              )}>
                              <span className="text-lg">{opt.icon}</span>{opt.label}
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-2 text-sm text-muted-foreground">R$</span>
                            <Input
                              type="number" step="0.01" min="0"
                              className="pl-8 h-9 font-mono"
                              value={p.amount || ""}
                              onChange={e => updatePaymentAmount(idx, Number(e.target.value))}
                            />
                          </div>
                          {payments.length > 1 && (
                            <button onClick={() => removePaymentLine(idx)} className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors">
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        {/* Dinheiro: campo troco */}
                        {p.method === "cash" && p.amount > 0 && (
                          <div className="flex justify-between text-xs px-1">
                            <span className="text-muted-foreground">Troco</span>
                            <span className="font-mono font-bold text-emerald-600">{formatCurrency(Math.max(0, p.amount - (total - payments.filter((_, i) => i !== idx).reduce((s, pp) => s + pp.amount, 0))))}</span>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Add payment method */}
                    {remaining > 0.01 && (
                      <button onClick={addPaymentLine} className="w-full text-sm text-primary flex items-center justify-center gap-1.5 py-2 border border-dashed border-primary/40 rounded-xl">
                        <Plus className="h-3.5 w-3.5" /> Adicionar forma de pagamento ({formatCurrency(remaining)} restante)
                      </button>
                    )}

                    {/* Troco geral / saldo */}
                    {change > 0 && (
                      <div className="flex justify-between text-sm p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <span className="font-semibold text-emerald-700">Troco</span>
                        <span className="font-bold font-mono text-emerald-700">{formatCurrency(change)}</span>
                      </div>
                    )}
                    {remaining > 0.01 && (
                      <div className="flex justify-between text-sm p-3 bg-amber-50 border border-amber-200 rounded-xl">
                        <span className="font-semibold text-amber-700">Falta</span>
                        <span className="font-bold font-mono text-amber-700">{formatCurrency(remaining)}</span>
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={confirmSale}
                  disabled={createOrder.isPending || !isReadyToPay}
                  className="w-full h-14 rounded-2xl bg-primary text-white font-bold text-lg active:scale-98 transition-all disabled:opacity-50 shadow-lg shadow-primary/30">
                  {createOrder.isPending ? "Registrando..." : isFiado ? `📋 Lançar no fiado • ${formatCurrency(total)}` : `✅ Confirmar • ${formatCurrency(total)}`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
