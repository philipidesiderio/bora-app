"use client";
import { useState } from "react";
import { toast } from "sonner";
import {
  PackageCheck, Search, Check, X, Mic, Paperclip,
  CreditCard, Banknote, Wifi, Receipt, Plus, ChevronDown, ChevronUp,
  AlertTriangle, Wrench, User, ChefHat, Printer, MessageCircle
} from "lucide-react";
import { printReceipt, sendWhatsappReceipt } from "@/lib/receipt";
import { api } from "@/components/providers/trpc-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatCurrency, cn } from "@/lib/utils";

// ─── Constantes ───────────────────────────────────────────────────────────────

const PAYMENT_METHODS = [
  { value: "pix",     label: "PIX",       icon: Wifi,       color: "bg-emerald-50 border-emerald-400 text-emerald-700" },
  { value: "cash",    label: "Dinheiro",  icon: Banknote,   color: "bg-blue-50 border-blue-400 text-blue-700" },
  { value: "credit",  label: "Crédito",   icon: CreditCard, color: "bg-purple-50 border-purple-400 text-purple-700" },
  { value: "debit",   label: "Débito",    icon: CreditCard, color: "bg-amber-50 border-amber-400 text-amber-700" },
  { value: "account", label: "Em aberto", icon: Receipt,    color: "bg-rose-50 border-rose-400 text-rose-700" },
];

interface PaymentEntry {
  method: string;
  amount: string;
  installments: number;
}

function parseMoney(v: string) {
  return Math.max(0, parseFloat(v.replace(",", ".")) || 0);
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function RetiradasPage() {
  const [search, setSearch] = useState("");

  // Payment modal
  const [paymentOrder, setPaymentOrder] = useState<any | null>(null);
  const [payments, setPayments]         = useState<PaymentEntry[]>([{ method: "pix", amount: "", installments: 1 }]);
  // Quando o usuário clicou em "Entregue" mas havia valor em aberto,
  // abre o modal de pagamento e, após quitar, marca como entregue automaticamente.
  const [deliverAfterPay, setDeliverAfterPay] = useState(false);

  // Cancel modal
  const [cancelOrder, setCancelOrder]   = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  // Personalizar modal
  const [customOrder, setCustomOrder]   = useState<any | null>(null);
  const [customObs, setCustomObs]       = useState("");

  // Expanded rows
  const [expanded, setExpanded]         = useState<string | null>(null);

  const utils = api.useUtils();

  const { data: orders = [], isLoading } = api.orders.list.useQuery({
    limit: 100,
    statuses: ["confirmed", "preparing", "ready"],
  });

  // Histórico: pedidos concluídos (entregues) ou cancelados
  const { data: history = [] } = api.orders.list.useQuery({
    limit: 50,
    statuses: ["delivered", "cancelled"],
  });

  const { data: business } = api.dashboard.getBusinessData.useQuery(undefined, { staleTime: 5 * 60 * 1000 });
  const businessName = business?.name ?? "";

  const filtered = orders.filter((o: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      String(o.number).includes(s) ||
      (o.customer?.name ?? "").toLowerCase().includes(s)
    );
  });

  // Mutations
  const markDeliveredMut = api.orders.markDelivered.useMutation({
    onSuccess: () => { utils.orders.list.invalidate(); toast.success("Pedido marcado como entregue!"); },
    onError: (e) => toast.error(e.message),
  });

  const cancelOrderMut = api.orders.cancel.useMutation({
    onSuccess: () => { utils.orders.list.invalidate(); toast.success("Pedido cancelado."); setCancelOrder(null); setCancelReason(""); },
    onError: (e) => toast.error(e.message),
  });

  const markReadyMut = api.orders.markReady.useMutation({
    onSuccess: () => { utils.orders.list.invalidate(); toast.success("Pedido pronto para retirada!"); },
    onError: (e) => toast.error(e.message),
  });

  const customizeOrderMut = api.orders.addNote.useMutation({
    onSuccess: () => { utils.orders.list.invalidate(); toast.success("Observação salva!"); setCustomOrder(null); setCustomObs(""); },
    onError: (e) => toast.error(e.message),
  });

  const payOrderMut = api.orders.pay.useMutation({
    onSuccess: async () => {
      await utils.orders.list.invalidate();
      toast.success("Pagamento registrado!");
      // Se o usuário tinha pedido entregar mas faltava pagar, entrega agora.
      if (deliverAfterPay && paymentOrder) {
        markDeliveredMut.mutate({ orderId: paymentOrder.id } as any);
      }
      setPaymentOrder(null);
      setPayments([{ method: "pix", amount: "", installments: 1 }]);
      setDeliverAfterPay(false);
    },
    onError: (e) => toast.error(e.message),
  });

  // Payment helpers
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

  const paidSoFar = payments.reduce((s, p) => s + parseMoney(p.amount), 0);
  const orderTotal = Number(paymentOrder?.total ?? 0);
  const remaining  = Math.max(0, orderTotal - paidSoFar);

  function confirmPayment() {
    if (!paymentOrder) return;
    payOrderMut.mutate({
      orderId: paymentOrder.id,
      payments: payments.map(p => ({
        method: p.method,
        amount: parseMoney(p.amount) || (payments.length === 1 ? orderTotal : remaining),
        installments: p.method === "credit" ? p.installments : undefined,
      })),
    } as any);
  }

  const isPaid = (o: any) => (o.paymentStatus ?? o.payment_status ?? "") === "paid";

  // Calcula valor restante (ignorando pagamentos "account" = em aberto)
  const remainingOf = (o: any) => {
    const paidSum = ((o?.payments ?? []) as any[])
      .filter((p: any) => p.method !== "account")
      .reduce((s: number, p: any) => s + Number(p.amount ?? 0), 0);
    return Math.max(0, Number(o?.total ?? 0) - paidSum);
  };

  // Handler do botão Entregue — se faltar pagar, abre modal de pagamento com alerta
  function handleDeliverClick(o: any) {
    if (isPaid(o)) {
      markDeliveredMut.mutate({ orderId: o.id } as any);
      return;
    }
    const falta = remainingOf(o);
    toast.error(`Pedido em aberto — falta ${formatCurrency(falta)}. Pague o restante primeiro.`);
    setDeliverAfterPay(true);
    setPaymentOrder(o);
    setPayments([{ method: "pix", amount: falta.toFixed(2), installments: 1 }]);
  }

  return (
    <div className="space-y-4 pb-28 md:pb-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
          <PackageCheck className="w-6 h-6" /> Retiradas
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Pedidos aguardando retirada pelo cliente
        </p>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nº ou cliente..."
          className="pl-9"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <PackageCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhuma retirada pendente</p>
          <p className="text-sm mt-1 opacity-70">Os pedidos para retirada aparecerão aqui</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((o: any) => {
            const payStatus = o.paymentStatus ?? o.payment_status ?? "unpaid";
            const paid      = isPaid(o);
            const isExpanded = expanded === o.id;
            const status    = o.status ?? "confirmed";
            const statusLabel =
              status === "ready"     ? "Pronto"      :
              status === "preparing" ? "Em preparo"  :
                                       "Confirmado";
            const statusClass =
              status === "ready"     ? "bg-emerald-100 text-emerald-700" :
              status === "preparing" ? "bg-blue-100 text-blue-700"       :
                                       "bg-amber-100 text-amber-700";

            return (
              <div
                key={o.id}
                className="bg-card border border-border rounded-2xl overflow-hidden"
              >
                {/* Main info */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold">#{o.number}</span>
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", statusClass)}>
                        {statusLabel}
                      </span>
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full",
                        payStatus === "paid"    ? "bg-emerald-100 text-emerald-700" :
                        payStatus === "partial" ? "bg-amber-100 text-amber-700" :
                                                  "bg-rose-100 text-rose-700"
                      )}>
                        {payStatus === "paid" ? "Pago" : payStatus === "partial" ? "Parcial" : "Em aberto"}
                      </span>
                    </div>
                    <span className="text-lg font-bold text-primary">{formatCurrency(Number(o.total))}</span>
                  </div>

                  {/* Cliente */}
                  {o.customer?.name && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
                      <User className="w-3.5 h-3.5" />
                      <span>{o.customer.name}</span>
                      {o.customer.phone && <span>· {o.customer.phone}</span>}
                    </div>
                  )}

                  {/* Previsão de entrega */}
                  {o.metadata?.delivery?.expectedAt && (
                    <div className="flex items-center gap-1.5 text-xs mb-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-2 py-1.5">
                      <ChefHat className="w-3.5 h-3.5" />
                      <span className="font-semibold">Previsão:</span>
                      <span>{new Date(o.metadata.delivery.expectedAt).toLocaleString("pt-BR", {
                        day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
                      })}</span>
                    </div>
                  )}

                  {/* Itens resumo */}
                  <button
                    onClick={() => setExpanded(isExpanded ? null : o.id)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {(o.items ?? []).length} {(o.items ?? []).length === 1 ? "item" : "itens"}
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {/* Itens expandidos */}
                  {isExpanded && (
                    <div className="mt-2 space-y-1 border-t border-border/50 pt-2">
                      {(o.items ?? []).map((item: any) => (
                        <div key={item.id} className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{item.name} ×{item.quantity}</span>
                          <span className="font-mono font-semibold">{formatCurrency(Number(item.total))}</span>
                        </div>
                      ))}
                      {o.notes && (
                        <p className="text-xs text-muted-foreground italic mt-1 border-t border-border/30 pt-1">
                          Obs: {o.notes}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Ações */}
                <div className="px-4 pb-4 grid grid-cols-2 gap-2">
                  {/* Valor em aberto → abre pagamento */}
                  {!paid && (
                    <button
                      onClick={() => { setPaymentOrder(o); setPayments([{ method: "pix", amount: "", installments: 1 }]); }}
                      className="col-span-2 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-rose-100 transition-colors"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      Valor em aberto: {formatCurrency(Number(o.total))} — Receber
                    </button>
                  )}

                  {/* Entregue — se não pago, abre modal de pagamento + marca ao quitar */}
                  <button
                    onClick={() => handleDeliverClick(o)}
                    disabled={markDeliveredMut.isPending || payOrderMut.isPending}
                    className={cn(
                      "py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors",
                      paid
                        ? "bg-emerald-500 text-white hover:bg-emerald-600"
                        : "bg-amber-500 text-white hover:bg-amber-600"
                    )}
                  >
                    <Check className="w-3.5 h-3.5" /> Entregue
                  </button>

                  {/* Cancelar */}
                  <button
                    onClick={() => { setCancelOrder(o); setCancelReason(""); }}
                    className="py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-rose-100 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" /> Cancelar
                  </button>

                  {/* Marcar pronto (se ainda não estiver) */}
                  {status !== "ready" ? (
                    <button
                      onClick={() => markReadyMut.mutate({ orderId: o.id } as any)}
                      disabled={markReadyMut.isPending}
                      className="py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-blue-100 transition-colors disabled:opacity-50"
                    >
                      <ChefHat className="w-3.5 h-3.5" /> Marcar pronto
                    </button>
                  ) : (
                    <div className="py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center justify-center gap-1.5">
                      <Check className="w-3.5 h-3.5" /> Pronto
                    </div>
                  )}

                  {/* Personalizar */}
                  <button
                    onClick={() => { setCustomOrder(o); setCustomObs(o.notes ?? ""); }}
                    className="py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-blue-100 transition-colors"
                  >
                    <Wrench className="w-3.5 h-3.5" /> Personalizar
                  </button>

                  {/* Imprimir recibo */}
                  <button
                    onClick={() => printReceipt(o, businessName)}
                    className="py-2 rounded-xl bg-muted border border-border text-foreground text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-muted/80 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" /> Imprimir
                  </button>

                  {/* Recibo WhatsApp */}
                  <button
                    onClick={() => sendWhatsappReceipt(o, businessName)}
                    className="py-2 rounded-xl bg-[#25D366] text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[#1ea855] transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          HISTÓRICO (entregues / cancelados)
      ══════════════════════════════════════════════════════════════════════ */}
      {history.length > 0 && (
        <div className="pt-4 mt-6 border-t border-border">
          <div className="mb-3">
            <h2 className="font-heading text-lg font-bold flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-muted-foreground" /> Histórico
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Últimos pedidos concluídos e cancelados
            </p>
          </div>
          <div className="space-y-2">
            {history.map((o: any) => {
              const delivered = o.status === "delivered";
              const payStatus = o.paymentStatus ?? o.payment_status ?? "unpaid";
              return (
                <div
                  key={o.id}
                  className="bg-card border border-border rounded-xl px-3 py-2.5 opacity-90"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className="font-mono font-bold text-sm">#{o.number}</span>
                        <span className={cn(
                          "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                          delivered ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                        )}>
                          {delivered ? "Entregue" : "Cancelado"}
                        </span>
                        <span className={cn(
                          "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                          payStatus === "paid"    ? "bg-emerald-100 text-emerald-700" :
                          payStatus === "partial" ? "bg-amber-100 text-amber-700" :
                                                    "bg-rose-100 text-rose-700"
                        )}>
                          {payStatus === "paid" ? "Pago" : payStatus === "partial" ? "Parcial" : "Em aberto"}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {o.customer?.name ?? "Sem cliente"}
                        {" · "}
                        {(o.items ?? []).length} {(o.items ?? []).length === 1 ? "item" : "itens"}
                        {o.updated_at && (
                          <>
                            {" · "}
                            {new Date(o.updated_at).toLocaleString("pt-BR", {
                              day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
                            })}
                          </>
                        )}
                      </div>
                    </div>
                    <span className="font-bold text-sm text-primary shrink-0">
                      {formatCurrency(Number(o.total))}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: Pagamento
      ══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={!!paymentOrder} onOpenChange={v => { if (!v) { setPaymentOrder(null); setDeliverAfterPay(false); } }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {deliverAfterPay ? "Pedido em aberto" : "Receber Pagamento"} — #{paymentOrder?.number}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Alerta: entrega bloqueada até quitar */}
            {deliverAfterPay && paymentOrder && (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-bold text-amber-800">Não é possível entregar — falta pagamento.</p>
                  <p className="text-amber-700 mt-0.5">
                    Cobre {formatCurrency(remainingOf(paymentOrder))} para liberar a entrega. Após confirmar o pagamento, o pedido será marcado como entregue automaticamente.
                  </p>
                </div>
              </div>
            )}
            {/* Resumo */}
            <div className="bg-muted/40 rounded-xl p-3">
              {paymentOrder?.customer?.name && (
                <div className="flex items-center gap-2 text-sm pb-2 border-b border-border/50 mb-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{paymentOrder.customer.name}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(orderTotal)}</span>
              </div>
            </div>

            {/* Formas de pagamento */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Formas de pagamento</p>
                {payments.length < PAYMENT_METHODS.length && (
                  <button onClick={addPaymentMethod} className="text-xs text-primary flex items-center gap-1 hover:underline">
                    <Plus className="w-3 h-3" /> Adicionar
                  </button>
                )}
              </div>

              {payments.map((pay, idx) => {
                const isLast = payments.length === 1;
                return (
                  <div key={idx} className="border rounded-xl p-3 space-y-3">
                    {/* Método */}
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
                              pay.method === m.value ? m.color + " border-current" : "border-border bg-muted/30 hover:bg-muted/60",
                              alreadyUsed && "opacity-30 cursor-not-allowed"
                            )}
                          >
                            <MIcon className="w-3 h-3" /> {m.label}
                          </button>
                        );
                      })}
                      {!isLast && (
                        <button onClick={() => removePaymentMethod(idx)} className="ml-auto text-muted-foreground hover:text-destructive">
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
                          placeholder={idx === payments.length - 1 && remaining > 0 ? String(remaining.toFixed(2)) : "0,00"}
                          className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                    </div>

                    {/* Parcelas crédito */}
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
                                pay.installments === n ? "bg-purple-600 text-white" : "bg-muted hover:bg-muted/80"
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
                    {pay.method === "cash" && parseMoney(pay.amount) > orderTotal && (
                      <p className="text-xs text-emerald-600 font-medium">
                        Troco: {formatCurrency(parseMoney(pay.amount) - orderTotal)}
                      </p>
                    )}
                  </div>
                );
              })}

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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPaymentOrder(null); setDeliverAfterPay(false); }}>Cancelar</Button>
            <Button onClick={confirmPayment} disabled={payOrderMut.isPending}>
              {payOrderMut.isPending
                ? "Registrando..."
                : deliverAfterPay ? "Pagar e Entregar" : "Confirmar Pagamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: Cancelar
      ══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={!!cancelOrder} onOpenChange={v => !v && setCancelOrder(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" /> Cancelar Pedido #{cancelOrder?.number}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Informe o motivo do cancelamento:</p>
            <Textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="Motivo do cancelamento..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOrder(null)}>Voltar</Button>
            <Button
              variant="destructive"
              disabled={!cancelReason || cancelOrderMut.isPending}
              onClick={() => cancelOrderMut.mutate({ orderId: cancelOrder.id, reason: cancelReason } as any)}
            >
              {cancelOrderMut.isPending ? "Cancelando..." : "Confirmar Cancelamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: Personalizar
      ══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={!!customOrder} onOpenChange={v => !v && setCustomOrder(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-blue-500" /> Personalizar Pedido #{customOrder?.number}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={customObs}
              onChange={e => setCustomObs(e.target.value)}
              placeholder="Escreva observações, instruções especiais..."
              rows={4}
            />
            {/* Gravação de áudio (placeholder) */}
            <div className="flex gap-2">
              <button className="flex-1 py-2.5 rounded-xl bg-muted border border-border text-xs font-semibold flex items-center justify-center gap-1.5 text-muted-foreground hover:bg-muted/80 transition-colors">
                <Mic className="w-4 h-4" /> Gravar áudio
              </button>
              <button className="flex-1 py-2.5 rounded-xl bg-muted border border-border text-xs font-semibold flex items-center justify-center gap-1.5 text-muted-foreground hover:bg-muted/80 transition-colors">
                <Paperclip className="w-4 h-4" /> Anexar arquivo
              </button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomOrder(null)}>Cancelar</Button>
            <Button
              disabled={customizeOrderMut.isPending}
              onClick={() => customizeOrderMut.mutate({ orderId: customOrder.id, note: customObs } as any)}
            >
              {customizeOrderMut.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
