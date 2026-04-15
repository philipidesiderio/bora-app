"use client";
import { useState } from "react";
import { History, Search, Filter, ChevronDown, ChevronUp, Wifi, Banknote, CreditCard, Receipt } from "lucide-react";
import { api } from "@/components/providers/trpc-provider";
import { Input } from "@/components/ui/input";
import { formatCurrency, cn } from "@/lib/utils";

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending:   { label: "Pendente",   color: "bg-amber-100 text-amber-700" },
  confirmed: { label: "Confirmado", color: "bg-blue-100 text-blue-700" },
  preparing: { label: "Preparando", color: "bg-orange-100 text-orange-700" },
  ready:     { label: "Pronto",     color: "bg-emerald-100 text-emerald-700" },
  delivered: { label: "Entregue",   color: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelado",  color: "bg-red-100 text-red-700" },
};

const PAY_META: Record<string, { label: string; icon: any; color: string }> = {
  pix:     { label: "PIX",      icon: Wifi,       color: "text-emerald-600" },
  cash:    { label: "Dinheiro", icon: Banknote,   color: "text-blue-600" },
  credit:  { label: "Crédito",  icon: CreditCard, color: "text-purple-600" },
  debit:   { label: "Débito",   icon: CreditCard, color: "text-amber-600" },
  account: { label: "Em aberto",icon: Receipt,    color: "text-rose-600" },
};

const PAY_STATUS_META: Record<string, { label: string; color: string }> = {
  paid:     { label: "Pago",       color: "bg-emerald-100 text-emerald-700" },
  partial:  { label: "Parcial",    color: "bg-amber-100 text-amber-700" },
  unpaid:   { label: "Em aberto",  color: "bg-rose-100 text-rose-700" },
  void:     { label: "Anulado",    color: "bg-gray-100 text-gray-600" },
  refunded: { label: "Reembolsado",color: "bg-purple-100 text-purple-700" },
};

const QUICK_FILTERS = [
  { label: "Hoje",    days: 0 },
  { label: "7 dias",  days: 7 },
  { label: "30 dias", days: 30 },
  { label: "Todos",   days: -1 },
];

function getDateFrom(days: number): string {
  if (days < 0) return "";
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0]!;
}

export default function HistoricoPage() {
  const [dateFrom, setDateFrom]     = useState("");
  const [dateTo, setDateTo]         = useState("");
  const [search, setSearch]         = useState("");
  const [quickFilter, setQuickFilter] = useState(1); // 7 dias
  const [showFilters, setShowFilters] = useState(false);
  const [openOrder, setOpenOrder]   = useState<string | null>(null);

  const effectiveDateFrom = dateFrom || getDateFrom(QUICK_FILTERS[quickFilter]?.days ?? 7);

  const { data: orders = [], isLoading } = api.orders.list.useQuery({
    limit: 100,
    dateFrom: effectiveDateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const filtered = orders.filter((o: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      String(o.number).includes(s) ||
      (o.customer?.name ?? "").toLowerCase().includes(s)
    );
  });

  const totalValue = filtered.reduce((s: number, o: any) => s + Number(o.total), 0);

  return (
    <div className="space-y-4 pb-28 md:pb-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
          <History className="w-6 h-6" /> Histórico
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {filtered.length} venda{filtered.length !== 1 ? "s" : ""} · {formatCurrency(totalValue)}
        </p>
      </div>

      {/* Filtros rápidos */}
      <div className="flex gap-2 overflow-x-auto overflow-y-hidden pb-1 scrollbar-none -mx-4 px-4">
        {QUICK_FILTERS.map((f, i) => (
          <button
            key={f.label}
            onClick={() => { setQuickFilter(i); setDateFrom(""); setDateTo(""); }}
            className={cn(
              "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
              quickFilter === i
                ? "bg-primary text-white border-primary"
                : "bg-muted/50 text-muted-foreground border-transparent"
            )}
          >
            {f.label}
          </button>
        ))}
        <button
          onClick={() => setShowFilters(v => !v)}
          className={cn(
            "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1",
            showFilters ? "bg-primary/10 text-primary border-primary/30" : "bg-muted/50 text-muted-foreground border-transparent"
          )}
        >
          <Filter className="w-3 h-3" /> Filtros
        </button>
      </div>

      {/* Filtros avançados */}
      {showFilters && (
        <div className="bg-card border border-border rounded-xl p-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">De</label>
              <Input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setQuickFilter(-1); }} className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Até</label>
              <Input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setQuickFilter(-1); }} className="h-8 text-sm" />
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar por nº ou cliente..."
              className="pl-8 h-8 text-sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Lista */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <History className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhuma venda no período</p>
          <p className="text-sm mt-1 opacity-70">Tente ampliar o filtro de datas</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((o: any) => {
            const payStatus = o.paymentStatus ?? o.payment_status ?? "paid";
            const payMethod = o.paymentMethod ?? o.payment_method ?? "pix";
            const payMeta   = PAY_META[payMethod] ?? PAY_META.pix;
            const statusMeta = STATUS_META[o.status] ?? { label: o.status, color: "bg-muted text-foreground" };
            const payStatusMeta = PAY_STATUS_META[payStatus] ?? { label: payStatus, color: "bg-muted text-foreground" };
            const PayIcon   = payMeta.icon;
            const isOpen    = openOrder === o.id;

            return (
              <div key={o.id} className="bg-card border border-border rounded-xl overflow-hidden">
                {/* Main row */}
                <button
                  className="w-full text-left px-4 py-3"
                  onClick={() => setOpenOrder(isOpen ? null : o.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm">#{o.number}</span>
                      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", payStatusMeta.color)}>
                        {payStatusMeta.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-primary font-mono">{formatCurrency(Number(o.total))}</span>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className={cn("flex items-center gap-1 text-xs", payMeta.color)}>
                      <PayIcon className="w-3 h-3" />
                      <span>{payMeta.label}</span>
                    </div>
                    {o.customer?.name && (
                      <span className="text-xs text-muted-foreground truncate">{o.customer.name}</span>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {new Date(o.createdAt ?? o.created_at).toLocaleString("pt-BR", {
                        day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit"
                      })}
                    </span>
                  </div>
                </button>

                {/* Expanded */}
                {isOpen && (
                  <div className="border-t border-border/60 px-4 py-3 bg-muted/20 space-y-2">
                    {(o.items ?? []).map((item: any) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{item.name} ×{item.quantity}</span>
                        <span className="font-mono font-semibold">{formatCurrency(Number(item.total))}</span>
                      </div>
                    ))}
                    {Number(o.discount) > 0 && (
                      <div className="flex justify-between text-sm text-emerald-600 border-t border-border/40 pt-1">
                        <span>Desconto</span>
                        <span>−{formatCurrency(Number(o.discount))}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold border-t border-border/40 pt-1">
                      <span>Total</span>
                      <span className="text-primary">{formatCurrency(Number(o.total))}</span>
                    </div>
                    <div className={cn("inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full", statusMeta.color)}>
                      {statusMeta.label}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
