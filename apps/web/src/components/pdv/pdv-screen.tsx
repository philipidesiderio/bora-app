"use client";
import { useState, useRef } from "react";
import { toast } from "sonner";
import {
  Search, Plus, Minus, Check, CreditCard, Banknote, Wifi, Receipt,
  User, FileText, UserPlus, Package, Trash2, X, ChevronDown, ChevronUp,
  Clock, Wrench, ShoppingCart, Tag, Truck, MapPin
} from "lucide-react";
import { api } from "@/components/providers/trpc-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, cn, getInitials } from "@/lib/utils";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  costPrice: number;
  qty: number;
  imageUrl?: string;
}

interface PaymentEntry {
  method: string;
  amount: string;
  installments: number;
}

type DeliveryType = "now" | "later" | "custom";

// ─── Constantes ───────────────────────────────────────────────────────────────

const PAYMENT_METHODS = [
  { value: "pix",     label: "PIX",       icon: Wifi,       color: "bg-emerald-50 border-emerald-400 text-emerald-700" },
  { value: "cash",    label: "Dinheiro",  icon: Banknote,   color: "bg-blue-50 border-blue-400 text-blue-700" },
  { value: "credit",  label: "Crédito",   icon: CreditCard, color: "bg-purple-50 border-purple-400 text-purple-700" },
  { value: "debit",   label: "Débito",    icon: CreditCard, color: "bg-amber-50 border-amber-400 text-amber-700" },
  { value: "account", label: "Deixar em aberto", icon: Receipt,    color: "bg-rose-50 border-rose-400 text-rose-700" },
];

function parseMoney(v: string) {
  return Math.max(0, parseFloat(v.replace(",", ".")) || 0);
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function PDVScreen() {
  // Produtos / busca
  const [search, setSearch] = useState("");
  const [cat, setCat]       = useState("all");

  // Carrinho
  const [cart, setCart]         = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  // Desconto
  const [discount, setDiscount]         = useState("");
  const [discountType, setDiscountType] = useState<"flat" | "percent">("flat");

  // Cliente
  const [showClientDialog, setShowClientDialog]       = useState(false);
  const [showNewClientDialog, setShowNewClientDialog] = useState(false);
  const [clientSearch, setClientSearch]               = useState("");
  const [selectedClientId, setSelectedClientId]       = useState<string | null>(null);
  const [selectedClientName, setSelectedClientName]   = useState<string | null>(null);
  const [newClientForm, setNewClientForm]             = useState({ name: "", phone: "", email: "", cpf: "" });

  // Pagamento
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payments, setPayments]                 = useState<PaymentEntry[]>([
    { method: "pix", amount: "", installments: 1 },
  ]);

  // Entrega / tipo de pedido
  const [deliveryType, setDeliveryType]               = useState<DeliveryType>("now");
  const [showCustomItemDialog, setShowCustomItemDialog] = useState(false);
  const [customItemObs, setCustomItemObs]             = useState("");
  const [orderType, setOrderType]                     = useState<"sale" | "budget">("sale");

  // Dialog "Falta pagamento"
  const [missingDialog, setMissingDialog] = useState<{ missing: number } | null>(null);

  // Entrega (taxa + endereço)
  const [showDeliveryDialog, setShowDeliveryDialog] = useState(false);
  const [deliveryFee, setDeliveryFee]           = useState("");
  const [deliveryAddress, setDeliveryAddress]   = useState("");

  // Queries
  const { data: products   = [] } = api.products.list.useQuery({ search, limit: 100 });
  const { data: categories = [] } = api.products.listCategories.useQuery();
  const { data: clients    = [] } = api.customers.list.useQuery({ search: clientSearch, limit: 20 });
  const utils = api.useUtils();

  // Mutations
  const createOrderMut = api.orders.createWithPayments.useMutation({
    onSuccess: () => {
      utils.orders.list.invalidate();
      toast.success(orderType === "budget" ? "Orçamento gerado!" : "Venda registrada!");
      resetCart();
      setShowPaymentModal(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const createClientMut = api.customers.create.useMutation({
    onSuccess: (data) => {
      utils.customers.list.invalidate();
      toast.success("Cliente criado!");
      setSelectedClientId(data.id);
      setSelectedClientName(data.name);
      setShowNewClientDialog(false);
      setNewClientForm({ name: "", phone: "", email: "", cpf: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  // ─── Cálculos ──────────────────────────────────────────────────────────────

  const subtotal      = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const discountValue = discountType === "percent"
    ? subtotal * (Number(discount) / 100)
    : Number(discount) || 0;
  const deliveryFeeNum = parseMoney(deliveryFee);
  const total         = Math.max(0, subtotal - discountValue + deliveryFeeNum);
  const cartCount     = cart.reduce((s, i) => s + i.qty, 0);

  const paidSoFar = payments.reduce((s, p) => s + parseMoney(p.amount), 0);
  const remaining = Math.max(0, total - paidSoFar);

  // ─── Carrinho ──────────────────────────────────────────────────────────────

  const addToCart = (p: any) => {
    setCart(prev => {
      const ex = prev.find(i => i.productId === p.id);
      if (ex) return prev.map(i => i.productId === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, {
        id: `${p.id}-${Date.now()}`,
        productId: p.id,
        name: p.name,
        price: Number(p.price),
        costPrice: Number(p.cost_price ?? 0),
        qty: 1,
        imageUrl: p.imageUrl,
      }];
    });
  };

  const removeFromCart = (id: string) =>
    setCart(prev => {
      const ex = prev.find(i => i.id === id);
      if (ex && ex.qty > 1) return prev.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i);
      return prev.filter(i => i.id !== id);
    });

  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) setCart(prev => prev.filter(i => i.id !== id));
    else setCart(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
  };

  const resetCart = () => {
    setCart([]);
    setSelectedClientId(null);
    setSelectedClientName(null);
    setDiscount("");
    setPayments([{ method: "pix", amount: "", installments: 1 }]);
    setDeliveryType("now");
    setCustomItemObs("");
    setOrderType("sale");
    setCartOpen(false);
    setDeliveryFee("");
    setDeliveryAddress("");
  };

  // ─── Pagamentos múltiplos ──────────────────────────────────────────────────

  const addPaymentMethod = () => {
    const used = payments.map(p => p.method);
    const next = PAYMENT_METHODS.find(m => !used.includes(m.value));
    if (!next) return;
    setPayments(prev => [...prev, { method: next.value, amount: "", installments: 1 }]);
  };

  const removePaymentMethod = (idx: number) => {
    if (payments.length === 1) return;
    setPayments(prev => prev.filter((_, i) => i !== idx));
  };

  const updatePayment = (idx: number, field: keyof PaymentEntry, value: any) =>
    setPayments(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));

  // ─── Confirmar venda ───────────────────────────────────────────────────────

  type PaymentMethodKey = "pix" | "cash" | "credit" | "debit" | "account" | "voucher";

  function buildPaymentList(extra?: { method: PaymentMethodKey; amount: number }) {
    // Amount auto-fill: account-row with 0 → take remaining (pending balance)
    const list = payments.map((pay) => {
      const amt = parseMoney(pay.amount);
      let effective = amt;
      if (amt === 0 && pay.method === "account") effective = remaining; // "em aberto" = pendente
      return {
        method: pay.method as PaymentMethodKey,
        amount: effective,
        note: pay.method === "credit" && pay.installments > 1 ? `${pay.installments}x` : undefined,
      };
    }).filter(p => p.amount > 0);

    // If only one method row with no amount, fill with total
    if (!list.length && payments[0]) {
      list.push({
        method: payments[0].method as PaymentMethodKey,
        amount: total,
        note: payments[0].method === "credit" && payments[0].installments > 1 ? `${payments[0].installments}x` : undefined,
      });
    }

    if (extra) list.push({ method: extra.method, amount: extra.amount, note: undefined });
    return list;
  }

  const confirmSale = (extraPayment?: { method: PaymentMethodKey; amount: number }) => {
    if (!cart.length) return;

    const paymentList = buildPaymentList(extraPayment);
    const paid = paymentList.reduce((s, p) => s + p.amount, 0);
    const missing = total - paid;

    // Orçamento (budget) pode seguir sem cobertura total
    if (orderType === "sale" && missing > 0.01 && !extraPayment) {
      setMissingDialog({ missing });
      return;
    }

    createOrderMut.mutate({
      items: cart.map(item => ({
        productId: item.productId,
        name: item.name,
        quantity: item.qty,
        unitPrice: item.price,
        costPrice: item.costPrice,
        discount: 0,
      })),
      payments: paymentList,
      instalments: [],
      discount: discountValue,
      discountType,
      notes: deliveryType === "custom" ? customItemObs : undefined,
      channel: "pdv",
      customerId: selectedClientId || undefined,
      deliveryFee: deliveryFeeNum > 0 ? deliveryFeeNum : 0,
      deliveryAddress: deliveryAddress || undefined,
    }, {
      onSuccess: () => setMissingDialog(null),
    });
  };

  const coverMissingWith = (method: PaymentMethodKey) => {
    if (!missingDialog) return;
    confirmSale({ method, amount: missingDialog.missing });
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  const filteredProducts = products.filter((p: any) => cat === "all" || p.categoryId === cat);

  return (
    <div className="flex flex-col bg-background" style={{ height: "100%" }}>

      {/* ── Cabeçalho ── */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-b bg-card">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <ShoppingCart className="w-5 h-5 text-primary shrink-0" />
          <h1 className="font-bold text-base">PDV</h1>
        </div>
        {/* Cliente */}
        <button
          onClick={() => setShowClientDialog(true)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors shrink-0",
            selectedClientName
              ? "bg-primary/10 border-primary/30 text-primary"
              : "bg-muted/50 border-border text-muted-foreground hover:bg-muted"
          )}
        >
          <User className="w-3.5 h-3.5" />
          <span className="max-w-[100px] truncate">
            {selectedClientName ?? "Cliente"}
          </span>
        </button>
      </div>

      {/* ── Busca ── */}
      <div className="shrink-0 px-3 pt-2 pb-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar produto..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* ── Categorias ── */}
      <div className="shrink-0 px-3 pb-2">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setCat("all")}
            className={cn(
              "flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all",
              cat === "all" ? "bg-primary text-white" : "bg-muted/60 text-muted-foreground"
            )}
          >
            Todos
          </button>
          {categories.map((c: any) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={cn(
                "flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all",
                cat === c.id ? "bg-primary text-white" : "bg-muted/60 text-muted-foreground"
              )}
            >
              {c.emoji} {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grade de produtos (scrollável, ocupa o espaço restante) ── */}
      <div className="flex-1 overflow-y-auto px-3 min-h-0">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-10">
            <Package className="w-10 h-10 opacity-30 mb-2" />
            <p className="text-sm">Nenhum produto encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 pb-2">
            {filteredProducts.map((p: any) => {
              const inCart = cart.find(i => i.productId === p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className={cn(
                    "relative rounded-xl border bg-card flex flex-col items-center justify-center gap-1 text-center transition-all active:scale-95 overflow-hidden",
                    inCart
                      ? "border-primary/50 bg-primary/5 shadow-sm shadow-primary/20"
                      : "border-border hover:border-primary/30 hover:shadow-sm"
                  )}
                  style={{ aspectRatio: "1" }}
                >
                  {/* Badge quantidade */}
                  {inCart && (
                    <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center z-10">
                      {inCart.qty}
                    </span>
                  )}
                  {/* Imagem ou ícone */}
                  <div className="w-full flex-1 flex items-center justify-center p-1.5">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <div className="w-full h-full rounded-lg bg-muted flex items-center justify-center">
                        <Package className="w-5 h-5 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                  {/* Nome e preço */}
                  <div className="px-1 pb-1.5 w-full">
                    <p className="text-[10px] font-medium leading-tight line-clamp-1">{p.name}</p>
                    <p className="text-[11px] font-bold text-primary">{formatCurrency(Number(p.price))}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Carrinho (fixo na parte inferior) ── */}
      <div className="shrink-0 border-t bg-card shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        {/* Toggle do carrinho */}
        <button
          onClick={() => setCartOpen(v => !v)}
          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="relative">
              <ShoppingCart className="w-5 h-5 text-primary" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </div>
            <span className="text-sm font-semibold">
              {cart.length === 0 ? "Carrinho vazio" : `${cart.length} ${cart.length === 1 ? "item" : "itens"}`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {total > 0 && (
              <span className="text-base font-bold text-primary">{formatCurrency(total)}</span>
            )}
            {cartOpen
              ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
              : <ChevronUp className="w-4 h-4 text-muted-foreground" />
            }
          </div>
        </button>

        {/* Conteúdo do carrinho */}
        {cartOpen && (
          <div className="border-t border-border/50 max-h-64 overflow-y-auto">
            {cart.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-6">Nenhum item adicionado</p>
            ) : (
              <div className="px-3 py-2 space-y-1">
                {/* Limpar */}
                <div className="flex justify-end mb-1">
                  <button
                    onClick={() => setCart([])}
                    className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" /> Limpar tudo
                  </button>
                </div>

                {/* Itens */}
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-2 py-1.5 border-b border-border/30 last:border-0">
                    {/* Thumb */}
                    <div className="w-8 h-8 rounded-lg bg-muted shrink-0 overflow-hidden">
                      {item.imageUrl
                        ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><Package className="w-4 h-4 text-muted-foreground/40" /></div>
                      }
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatCurrency(item.price)} · <span className="font-semibold text-foreground">{formatCurrency(item.price * item.qty)}</span>
                      </p>
                    </div>
                    {/* Qty controls */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="w-6 h-6 rounded-md bg-muted hover:bg-muted/80 flex items-center justify-center"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        value={item.qty}
                        onChange={e => updateQty(item.id, Number(e.target.value))}
                        className="w-8 h-6 text-center text-xs font-bold bg-background border rounded"
                        min="1"
                      />
                      <button
                        onClick={() => setCart(prev => prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i))}
                        className="w-6 h-6 rounded-md bg-primary/10 hover:bg-primary/20 flex items-center justify-center text-primary"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    {/* Remover */}
                    <button
                      onClick={() => setCart(prev => prev.filter(i => i.id !== item.id))}
                      className="w-6 h-6 rounded-md hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {/* Desconto */}
                <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                  <Tag className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground shrink-0">Desconto:</span>
                  <select
                    value={discountType}
                    onChange={e => setDiscountType(e.target.value as "flat" | "percent")}
                    className="bg-muted border rounded px-1 py-0.5 text-xs"
                  >
                    <option value="flat">R$</option>
                    <option value="percent">%</option>
                  </select>
                  <input
                    type="number"
                    value={discount}
                    onChange={e => setDiscount(e.target.value)}
                    placeholder="0"
                    className="flex-1 h-7 px-2 text-xs border rounded bg-background"
                  />
                  {discountValue > 0 && (
                    <span className="text-xs text-emerald-600 font-semibold shrink-0">
                      -{formatCurrency(discountValue)}
                    </span>
                  )}
                </div>

                {/* Taxa de entrega */}
                {deliveryFeeNum > 0 && (
                  <div className="flex justify-between text-xs text-amber-700">
                    <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> Taxa de entrega</span>
                    <span className="font-semibold">+{formatCurrency(deliveryFeeNum)}</span>
                  </div>
                )}

                {/* Total */}
                <div className="flex justify-between font-bold text-base pt-1.5 border-t border-border/50">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(total)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Ações */}
        <div className="px-3 py-2 space-y-2 border-t border-border/30">
          {/* Tipo de entrega */}
          <div className="grid grid-cols-3 gap-1.5">
            {([
              { key: "now",    label: "Recebe agora",  icon: Check },
              { key: "later",  label: "Retira depois", icon: Clock },
              { key: "custom", label: "Personalizado", icon: Wrench },
            ] as { key: DeliveryType; label: string; icon: any }[]).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => {
                  setDeliveryType(key);
                  if (key === "custom") setShowCustomItemDialog(true);
                }}
                className={cn(
                  "py-1.5 rounded-lg text-[10px] font-semibold transition-all flex items-center justify-center gap-1",
                  deliveryType === key
                    ? "bg-primary text-white"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted"
                )}
              >
                <Icon className="w-3 h-3" /> {label}
              </button>
            ))}
          </div>

          {/* Entrega (taxa + endereço) */}
          <button
            onClick={() => setShowDeliveryDialog(true)}
            className={cn(
              "w-full py-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 border transition-all",
              (deliveryFeeNum > 0 || deliveryAddress)
                ? "bg-amber-50 border-amber-300 text-amber-700"
                : "bg-muted/40 border-border text-muted-foreground hover:bg-muted"
            )}
          >
            <Truck className="w-3.5 h-3.5" />
            {(deliveryFeeNum > 0 || deliveryAddress)
              ? `Entrega${deliveryFeeNum > 0 ? ` · ${formatCurrency(deliveryFeeNum)}` : ""}${deliveryAddress ? " · endereço salvo" : ""}`
              : "Adicionar entrega"}
          </button>

          {/* Botões finalizar */}
          <div className="flex gap-2">
            <button
              onClick={() => { setOrderType("budget"); setShowPaymentModal(true); }}
              disabled={!cart.length}
              className="flex-1 py-2.5 rounded-xl bg-blue-500 text-white font-semibold text-sm flex items-center justify-center gap-1.5 disabled:opacity-40 hover:bg-blue-600 active:scale-95 transition-all"
            >
              <FileText className="w-4 h-4" /> Orçamento
            </button>
            <button
              onClick={() => { setOrderType("sale"); setShowPaymentModal(true); }}
              disabled={!cart.length}
              className="flex-1 py-2.5 rounded-xl bg-primary text-white font-bold text-sm flex items-center justify-center gap-1.5 disabled:opacity-40 hover:bg-primary/90 active:scale-95 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Finalizar{total > 0 ? ` · ${formatCurrency(total)}` : ""}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: Selecionar Cliente
      ══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={showClientDialog} onOpenChange={setShowClientDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Selecionar Cliente</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente..."
                className="pl-9"
                value={clientSearch}
                onChange={e => setClientSearch(e.target.value)}
                autoFocus
              />
            </div>
            {selectedClientName && (
              <button
                onClick={() => { setSelectedClientId(null); setSelectedClientName(null); setShowClientDialog(false); }}
                className="w-full text-xs text-rose-600 hover:underline text-left px-1"
              >
                Remover cliente selecionado
              </button>
            )}
            <div className="max-h-64 overflow-y-auto space-y-1">
              {clients.map((c: any) => (
                <button
                  key={c.id}
                  onClick={() => { setSelectedClientId(c.id); setSelectedClientName(c.name); setShowClientDialog(false); }}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left",
                    selectedClientId === c.id ? "bg-primary/10 border border-primary/30" : "hover:bg-muted"
                  )}
                >
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                    {getInitials(c.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{c.name}</p>
                    {c.phone && <p className="text-xs text-muted-foreground">{c.phone}</p>}
                  </div>
                  {selectedClientId === c.id && <Check className="w-4 h-4 text-primary shrink-0" />}
                </button>
              ))}
              {clients.length === 0 && clientSearch && (
                <p className="text-center text-sm text-muted-foreground py-4">Nenhum cliente encontrado</p>
              )}
            </div>
            <Button
              onClick={() => { setShowClientDialog(false); setShowNewClientDialog(true); }}
              className="w-full"
              variant="outline"
            >
              <UserPlus className="w-4 h-4 mr-2" /> Cadastrar novo cliente
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: Novo Cliente
      ══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={showNewClientDialog} onOpenChange={setShowNewClientDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Novo Cliente</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Nome *</label>
              <Input
                value={newClientForm.name}
                onChange={e => setNewClientForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Nome completo"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Telefone</label>
                <Input
                  value={newClientForm.phone}
                  onChange={e => setNewClientForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">CPF</label>
                <Input
                  value={newClientForm.cpf}
                  onChange={e => setNewClientForm(f => ({ ...f, cpf: e.target.value }))}
                  placeholder="000.000.000-00"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewClientDialog(false)}>Cancelar</Button>
            <Button
              disabled={!newClientForm.name || createClientMut.isPending}
              onClick={() => createClientMut.mutate({
                name: newClientForm.name,
                phone: newClientForm.phone,
                email: newClientForm.email,
                cpf: newClientForm.cpf,
                creditLimit: 0,
              })}
            >
              {createClientMut.isPending ? "Criando..." : "Criar Cliente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: Item Personalizado
      ══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={showCustomItemDialog} onOpenChange={setShowCustomItemDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5" /> Item Personalizado
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Descreva o item que precisa ser fabricado ou personalizado.
            </p>
            <Textarea
              value={customItemObs}
              onChange={e => setCustomItemObs(e.target.value)}
              placeholder="Descreva o item personalizado (opcional)..."
              rows={4}
            />
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => { setShowCustomItemDialog(false); setDeliveryType("now"); }}>
              Cancelar
            </Button>
            <Button
              variant="outline"
              onClick={() => { setShowCustomItemDialog(false); setOrderType("budget"); setShowPaymentModal(true); }}
            >
              <FileText className="w-4 h-4 mr-1" /> Orçamento
            </Button>
            <Button
              onClick={() => { setShowCustomItemDialog(false); setOrderType("sale"); setShowPaymentModal(true); }}
            >
              <Check className="w-4 h-4 mr-1" /> Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: Pagamento
      ══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {orderType === "budget"
                ? <><FileText className="w-5 h-5 text-blue-500" /> Gerar Orçamento</>
                : <><Check className="w-5 h-5 text-primary" /> Finalizar Venda</>
              }
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* Resumo */}
            <div className="bg-muted/40 rounded-xl p-3 space-y-1.5">
              {selectedClientName && (
                <div className="flex items-center gap-2 text-sm pb-1.5 border-b border-border/50">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{selectedClientName}</span>
                </div>
              )}
              {cart.map(item => (
                <div key={item.id} className="flex justify-between text-xs text-muted-foreground">
                  <span>{item.name} ×{item.qty}</span>
                  <span className="font-mono">{formatCurrency(item.price * item.qty)}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm text-muted-foreground border-t border-border/50 pt-1.5">
                <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
              </div>
              {discountValue > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Desconto</span><span>-{formatCurrency(discountValue)}</span>
                </div>
              )}
              {deliveryFeeNum > 0 && (
                <div className="flex justify-between text-sm text-amber-700">
                  <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> Entrega</span>
                  <span>+{formatCurrency(deliveryFeeNum)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t border-border/50 pt-1.5">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Formas de pagamento */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Formas de pagamento</p>
                {payments.length < PAYMENT_METHODS.length && (
                  <button
                    onClick={addPaymentMethod}
                    className="text-xs text-primary flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-3 h-3" /> Adicionar
                  </button>
                )}
              </div>

              {payments.map((pay, idx) => {
                const method = PAYMENT_METHODS.find(m => m.value === pay.method)!;
                const isLast = payments.length === 1;

                return (
                  <div key={idx} className="border rounded-xl p-3 space-y-3">
                    {/* Seletor de método */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {PAYMENT_METHODS.map(m => {
                        const MIcon = m.icon;
                        const alreadyUsed = payments.some((p, i) => i !== idx && p.method === m.value);
                        return (
                          <button
                            key={m.value}
                            disabled={alreadyUsed}
                            onClick={() => updatePayment(idx, "method", m.value)}
                            className={cn(
                              "flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all",
                              pay.method === m.value
                                ? m.color + " border-current"
                                : "border-border bg-muted/30 hover:bg-muted/60",
                              alreadyUsed && "opacity-30 cursor-not-allowed"
                            )}
                          >
                            <MIcon className="w-3 h-3" /> {m.label}
                          </button>
                        );
                      })}
                      {!isLast && (
                        <button
                          onClick={() => removePaymentMethod(idx)}
                          className="ml-auto text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Valor */}
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">
                        Valor {payments.length > 1 ? "(vazio = restante)" : "(vazio = total)"}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                        <input
                          type="number"
                          value={pay.amount}
                          onChange={e => updatePayment(idx, "amount", e.target.value)}
                          placeholder={
                            idx === payments.length - 1 && remaining > 0
                              ? String(remaining.toFixed(2))
                              : "0,00"
                          }
                          className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                    </div>

                    {/* Parcelas (crédito) */}
                    {pay.method === "credit" && (
                      <div className="space-y-2">
                        <label className="text-xs text-muted-foreground">Parcelas</label>
                        <div className="flex flex-wrap gap-1">
                          {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                            <button
                              key={n}
                              onClick={() => updatePayment(idx, "installments", n)}
                              className={cn(
                                "w-9 h-9 rounded-lg text-xs font-bold transition-all",
                                pay.installments === n
                                  ? "bg-purple-600 text-white"
                                  : "bg-muted hover:bg-muted/80"
                              )}
                            >
                              {n}x
                            </button>
                          ))}
                          <div className="flex items-center gap-1 ml-1">
                            <input
                              type="number"
                              value={pay.installments}
                              onChange={e => updatePayment(idx, "installments", Math.max(1, Math.min(48, Number(e.target.value))))}
                              className="w-14 h-9 text-center text-sm border rounded-lg bg-background"
                              min="1" max="48"
                            />
                            <span className="text-xs text-muted-foreground">x</span>
                          </div>
                        </div>
                        {parseMoney(pay.amount) > 0 && (
                          <p className="text-xs text-purple-600 font-medium">
                            {pay.installments}x de {formatCurrency(parseMoney(pay.amount) / pay.installments)}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Troco */}
                    {pay.method === "cash" && parseMoney(pay.amount) > total && (
                      <p className="text-xs text-emerald-600 font-medium">
                        Troco: {formatCurrency(parseMoney(pay.amount) - total)}
                      </p>
                    )}
                  </div>
                );
              })}

              {/* Saldo restante */}
              {payments.length > 1 && (
                <div className={cn(
                  "flex justify-between text-sm font-semibold px-1",
                  remaining > 0.01 ? "text-rose-600" : "text-emerald-600"
                )}>
                  <span>{remaining > 0.01 ? "Falta cobrir:" : "✓ Total coberto"}</span>
                  {remaining > 0.01 && <span>{formatCurrency(remaining)}</span>}
                </div>
              )}
            </div>

            {/* Botões */}
            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={() => setShowPaymentModal(false)} className="flex-1">
                Cancelar
              </Button>
              <Button
                onClick={() => confirmSale()}
                disabled={createOrderMut.isPending || !cart.length}
                className={cn("flex-1", orderType === "budget" ? "bg-blue-500 hover:bg-blue-600" : "")}
              >
                {createOrderMut.isPending
                  ? "Processando..."
                  : orderType === "budget"
                    ? <><FileText className="w-4 h-4 mr-1" /> Gerar PDF</>
                    : <><Check className="w-4 h-4 mr-1" /> Confirmar Venda</>
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: Falta pagamento
      ══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={!!missingDialog} onOpenChange={v => !v && setMissingDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <Receipt className="w-5 h-5" /> Falta pagamento
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-center">
              <p className="text-sm text-rose-700 font-medium">
                Faltam <span className="font-bold text-lg">{formatCurrency(missingDialog?.missing ?? 0)}</span> para cobrir o total do pedido.
              </p>
              <p className="text-xs text-rose-600/80 mt-1">
                Como deseja receber esse valor?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.filter(m => m.value !== "account").map(m => {
                const MIcon = m.icon;
                return (
                  <button
                    key={m.value}
                    onClick={() => coverMissingWith(m.value as PaymentMethodKey)}
                    disabled={createOrderMut.isPending}
                    className={cn(
                      "py-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50",
                      m.color
                    )}
                  >
                    <MIcon className="w-4 h-4" /> {m.label}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => coverMissingWith("account")}
              disabled={createOrderMut.isPending}
              className="w-full py-3 rounded-xl border-2 border-dashed border-rose-400 bg-rose-50/50 text-rose-700 text-sm font-bold flex items-center justify-center gap-2 hover:bg-rose-100 transition-colors disabled:opacity-50"
            >
              <Receipt className="w-4 h-4" />
              Deixar {formatCurrency(missingDialog?.missing ?? 0)} em aberto (pendente)
            </button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMissingDialog(null)} className="w-full">
              Voltar e ajustar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: Entrega
      ══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={showDeliveryDialog} onOpenChange={setShowDeliveryDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-600" /> Entrega
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-muted-foreground" /> Taxa de entrega (opcional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={deliveryFee}
                  onChange={e => setDeliveryFee(e.target.value)}
                  placeholder="0,00"
                  className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">Se deixar vazio, nenhuma taxa é cobrada.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" /> Endereço de entrega
              </label>
              <Textarea
                value={deliveryAddress}
                onChange={e => setDeliveryAddress(e.target.value)}
                placeholder="Rua, número, bairro, cidade, referência..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => { setDeliveryFee(""); setDeliveryAddress(""); setShowDeliveryDialog(false); }}
            >
              Remover entrega
            </Button>
            <Button
              className="flex-1"
              onClick={() => setShowDeliveryDialog(false)}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
