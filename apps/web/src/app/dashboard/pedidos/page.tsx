"use client";
import { useState } from "react";
import { ShoppingBag, Clock, X, RotateCcw, AlertTriangle, CheckCircle2, Wallet, User, Printer, MessageCircle } from "lucide-react";
import { printReceipt, sendWhatsappReceipt } from "@/lib/receipt";
import { api } from "@/components/providers/trpc-provider";
import { toast } from "sonner";
import { formatCurrency, cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type OrderStatus = "pending"|"confirmed"|"preparing"|"ready"|"delivered"|"cancelled";

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-amber-100 text-amber-700 border-amber-200",
  confirmed: "bg-blue-100 text-blue-700 border-blue-200",
  preparing: "bg-orange-100 text-orange-700 border-orange-200",
  ready:     "bg-emerald-100 text-emerald-700 border-emerald-200",
  delivered: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

const PAY_STATUS_COLORS: Record<string, string> = {
  paid:     "bg-emerald-100 text-emerald-700",
  partial:  "bg-amber-100 text-amber-700",
  unpaid:   "bg-rose-100 text-rose-700",
  void:     "bg-gray-100 text-gray-600",
  refunded: "bg-purple-100 text-purple-700",
};

const PAY_STATUS_LABELS: Record<string, string> = {
  paid: "Pago", partial: "Parcial", unpaid: "Em aberto", void: "Anulado", refunded: "Reembolsado",
};

const PAY_LABELS: Record<string, string> = { pix: "PIX", cash: "Dinheiro", credit: "Crédito", debit: "Débito", account: "Em aberto", voucher: "Voucher" };
const CHANNEL_LABELS: Record<string, string> = { pdv: "PDV", online: "Online", whatsapp: "WhatsApp" };

const TABS = [
  { value:"all",    label:"Todos"    },
  { value:"paid",   label:"Pagos"    },
  { value:"unpaid", label:"Em aberto" },
  { value:"partial",label:"Parcial"  },
  { value:"void",   label:"Anulados" },
];

function formatDate(d: string) {
  return new Date(d).toLocaleString("pt-BR", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" });
}

export default function PedidosPage() {
  const utils = api.useUtils();
  const [tab, setTab]           = useState("all");
  const [openOrder, setOpenOrder] = useState<string | null>(null);

  // Void modal
  const [voidOrderId, setVoidOrderId]   = useState<string | null>(null);
  const [voidReason, setVoidReason]     = useState("");

  // Refund modal
  const [refundOrderId, setRefundOrderId] = useState<string | null>(null);

  // Pay-remaining modal
  const [payOrderId, setPayOrderId]       = useState<string | null>(null);
  const [payMethod,  setPayMethod]        = useState<"pix"|"cash"|"credit"|"debit"|"voucher">("pix");
  const [payAmount,  setPayAmount]        = useState("");

  const { data: orders = [], isLoading } = api.orders.list.useQuery({
    limit: 50,
    paymentStatus: tab !== "all" ? tab : undefined,
  });
  const { data: business } = api.dashboard.getBusinessData.useQuery(undefined, { staleTime: 5 * 60 * 1000 });
  const businessName = business?.name ?? "";

  const invalidate = () => utils.orders.list.invalidate();

  const voidOrder = api.orders.void.useMutation({
    onSuccess: () => { toast.success("Pedido anulado!"); setVoidOrderId(null); setVoidReason(""); invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const refundOrder = api.orders.refund.useMutation({
    onSuccess: () => { toast.success("Reembolso registrado!"); setRefundOrderId(null); invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const payRemaining = api.orders.pay.useMutation({
    onSuccess: () => {
      toast.success("Pagamento registrado!");
      setPayOrderId(null); setPayAmount(""); setPayMethod("pix");
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const markDelivered = api.orders.markDelivered.useMutation({
    onSuccess: () => { toast.success("Pedido entregue!"); invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const voidableOrder   = orders.find((o: any) => o.id === voidOrderId);
  const refundableOrder = orders.find((o: any) => o.id === refundOrderId);
  const payableOrder    = orders.find((o: any) => o.id === payOrderId);

  // Calcula o valor restante a pagar (ignora pagamentos "account" = em aberto)
  function remainingFor(o: any): number {
    const paid = ((o?.payments ?? []) as any[])
      .filter(p => p.method !== "account")
      .reduce((s, p) => s + Number(p.amount ?? 0), 0);
    return Math.max(0, Number(o?.total ?? 0) - paid);
  }

  function handleDeliver(o: any) {
    if (o.payment_status !== "paid") {
      toast.error(`Pedido em aberto — falta ${formatCurrency(remainingFor(o))}. Pague o restante antes de entregar.`);
      return;
    }
    markDelivered.mutate({ orderId: o.id });
  }

  function openPayDialog(o: any) {
    setPayOrderId(o.id);
    setPayAmount(remainingFor(o).toFixed(2));
    setPayMethod("pix");
  }

  return (
    <div className="space-y-4 pb-28 md:pb-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Pedidos</h1>
        <p className="text-sm text-muted-foreground">{orders.length} pedidos encontrados</p>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 pb-1">
        {TABS.map(t => (
          <button key={t.value} onClick={() => setTab(t.value)}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-all border",
              tab === t.value ? "bg-primary text-white border-primary shadow-sm" : "bg-card border-border text-muted-foreground"
            )}>
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />)}</div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <ShoppingBag className="h-14 w-14 mb-3 opacity-20" />
          <p className="font-semibold">Nenhum pedido</p>
          <p className="text-sm mt-1 opacity-70">{tab === "all" ? "Faça uma venda pelo PDV" : "Sem pedidos nessa categoria"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o: any) => {
            const payStatus = o.payment_status ?? "paid";
            const isOpen    = openOrder === o.id;
            const canVoid   = ["paid","partial","unpaid","hold"].includes(payStatus);
            const canRefund = ["paid","partial","unpaid","partially_refunded"].includes(payStatus);

            return (
              <div key={o.id} className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                {/* Main row */}
                <div className="p-4 cursor-pointer" onClick={() => setOpenOrder(isOpen ? null : o.id)}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono font-bold text-base shrink-0">#{o.number}</span>
                      <span className="text-xs text-muted-foreground truncate">{CHANNEL_LABELS[o.channel] ?? "PDV"}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className={cn("px-1.5 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap", PAY_STATUS_COLORS[payStatus] ?? "bg-muted text-foreground")}>
                        {PAY_STATUS_LABELS[payStatus] ?? payStatus}
                      </span>
                      <span className={cn("px-1.5 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap", STATUS_COLORS[o.status] ?? "bg-muted text-foreground border-border")}>
                        {o.status}
                      </span>
                    </div>
                  </div>
                  {o.customer?.name && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                      <User className="h-3 w-3 shrink-0" />
                      <span className="truncate">{o.customer.name}{o.customer.phone ? ` · ${o.customer.phone}` : ""}</span>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground mb-3">
                    {(o.items ?? []).length} {(o.items ?? []).length === 1 ? "item" : "itens"}
                    {(o.items ?? []).length > 0 && ` · ${(o.items as any[]).slice(0,2).map((i:any)=>i.name).join(", ")}${(o.items ?? []).length > 2 ? "…" : ""}`}
                  </p>
                  <div className="flex items-center justify-between border-t border-border/60 pt-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span>{PAY_LABELS[o.payment_method] ?? o.payment_method ?? "—"}</span>
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(o.created_at)}</span>
                    </div>
                    <span className="font-bold text-base text-primary font-mono">{formatCurrency(Number(o.total))}</span>
                  </div>
                </div>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="border-t border-border px-4 pb-4 pt-3 space-y-3 bg-muted/20">
                    {/* Items */}
                    <div className="space-y-1.5">
                      {(o.items ?? []).map((item: any) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{item.name} ×{item.quantity}</span>
                          <span className="font-mono font-semibold">{formatCurrency(Number(item.total))}</span>
                        </div>
                      ))}
                    </div>

                    {/* Payments */}
                    {(o.payments ?? []).length > 0 && (
                      <div className="space-y-1 pt-1 border-t border-border">
                        <p className="text-xs text-muted-foreground font-semibold">Pagamentos</p>
                        {(o.payments as any[]).map((p: any) => (
                          <div key={p.id} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{PAY_LABELS[p.method] ?? p.method}</span>
                            <span className="font-mono">{formatCurrency(Number(p.amount))}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Instalments */}
                    {(o.instalments ?? []).length > 0 && (
                      <div className="space-y-1 pt-1 border-t border-border">
                        <p className="text-xs text-muted-foreground font-semibold">Parcelas</p>
                        {(o.instalments as any[]).map((inst: any) => (
                          <div key={inst.id} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{inst.due_date ? new Date(inst.due_date).toLocaleDateString("pt-BR") : "Sem data"}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono">{formatCurrency(Number(inst.amount))}</span>
                              <span className={cn("text-xs px-1.5 py-0.5 rounded-full", inst.paid ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")}>
                                {inst.paid ? "Pago" : "Pendente"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Recibo: imprimir + WhatsApp */}
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => printReceipt(o, businessName)}
                        className="flex-1 h-9 rounded-xl bg-muted text-foreground border border-border text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-muted/80">
                        <Printer className="h-3.5 w-3.5" />Imprimir recibo
                      </button>
                      <button onClick={() => sendWhatsappReceipt(o, businessName)}
                        className="flex-1 h-9 rounded-xl bg-[#25D366] text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[#1ea855]">
                        <MessageCircle className="h-3.5 w-3.5" />WhatsApp
                      </button>
                    </div>

                    {/* Actions */}
                    {payStatus !== "void" && payStatus !== "refunded" && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {payStatus !== "paid" && (
                          <button onClick={() => openPayDialog(o)}
                            className="flex-1 min-w-[120px] h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold flex items-center justify-center gap-1.5">
                            <Wallet className="h-3.5 w-3.5" />Pagar restante
                          </button>
                        )}
                        {o.status !== "delivered" && o.status !== "cancelled" && (
                          <button onClick={() => handleDeliver(o)}
                            disabled={markDelivered.isPending}
                            className="flex-1 min-w-[120px] h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-60">
                            <CheckCircle2 className="h-3.5 w-3.5" />Entregue
                          </button>
                        )}
                        {canVoid && (
                          <button onClick={() => setVoidOrderId(o.id)}
                            className="flex-1 min-w-[120px] h-9 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center justify-center gap-1.5">
                            <X className="h-3.5 w-3.5" />Anular
                          </button>
                        )}
                        {canRefund && (
                          <button onClick={() => setRefundOrderId(o.id)}
                            className="flex-1 min-w-[120px] h-9 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold flex items-center justify-center gap-1.5">
                            <RotateCcw className="h-3.5 w-3.5" />Reembolsar
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── VOID MODAL ─── */}
      {voidOrderId && voidableOrder && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setVoidOrderId(null)} />
          <div className="relative bg-card rounded-t-3xl md:rounded-2xl w-full md:max-w-sm p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <p className="font-bold">Anular pedido #{(voidableOrder as any).number}</p>
                <p className="text-sm text-muted-foreground">Esta ação reverte o estoque</p>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Motivo *</label>
              <Input placeholder="Informe o motivo..." value={voidReason} onChange={e => setVoidReason(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setVoidOrderId(null)}>Cancelar</Button>
              <Button className="flex-1 bg-rose-600 hover:bg-rose-700" disabled={!voidReason || voidOrder.isPending}
                onClick={() => voidOrder.mutate({ orderId: voidOrderId, reason: voidReason })}>
                {voidOrder.isPending ? "Anulando..." : "Confirmar anulação"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── PAY-REMAINING MODAL ─── */}
      {payOrderId && payableOrder && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPayOrderId(null)} />
          <div className="relative bg-card rounded-t-3xl md:rounded-2xl w-full md:max-w-sm p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-bold">Pagar restante · #{(payableOrder as any).number}</p>
                <p className="text-sm text-muted-foreground">
                  Falta {formatCurrency(remainingFor(payableOrder))} de {formatCurrency(Number((payableOrder as any).total))}
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Forma de pagamento</label>
              <div className="grid grid-cols-3 gap-2">
                {(["pix","cash","credit","debit","voucher"] as const).map(m => (
                  <button key={m} onClick={() => setPayMethod(m)}
                    className={cn(
                      "h-10 rounded-xl border text-xs font-semibold",
                      payMethod === m ? "bg-primary text-white border-primary" : "bg-card border-border text-muted-foreground"
                    )}>
                    {PAY_LABELS[m]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Valor</label>
              <Input
                type="number" inputMode="decimal" step="0.01" min="0"
                value={payAmount}
                onChange={e => setPayAmount(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setPayOrderId(null)}>Cancelar</Button>
              <Button className="flex-1 bg-amber-600 hover:bg-amber-700"
                disabled={!payAmount || Number(payAmount) <= 0 || payRemaining.isPending}
                onClick={() => payRemaining.mutate({
                  orderId: payOrderId,
                  payments: [{ method: payMethod, amount: Number(payAmount) }],
                })}>
                {payRemaining.isPending ? "Registrando..." : "Confirmar pagamento"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── REFUND MODAL ─── */}
      {refundOrderId && refundableOrder && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setRefundOrderId(null)} />
          <div className="relative bg-card rounded-t-3xl md:rounded-2xl w-full md:max-w-sm p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <RotateCcw className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-bold">Reembolsar pedido #{(refundableOrder as any).number}</p>
                <p className="text-sm text-muted-foreground">Devolução total de {formatCurrency(Number((refundableOrder as any).total))}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setRefundOrderId(null)}>Cancelar</Button>
              <Button className="flex-1 bg-purple-600 hover:bg-purple-700" disabled={refundOrder.isPending}
                onClick={() => refundOrder.mutate({
                  orderId: refundOrderId,
                  reason: "Reembolso total",
                  items: ((refundableOrder as any).items ?? []).map((item: any) => ({
                    orderItemId: item.id, quantity: Number(item.quantity),
                    unitPrice: Number(item.unit_price), condition: "good",
                  })),
                })}>
                {refundOrder.isPending ? "Reembolsando..." : "Confirmar reembolso"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
