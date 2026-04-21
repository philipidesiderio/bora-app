"use client";
import { useMemo, useState } from "react";
import { api } from "@/components/providers/trpc-provider";
import { formatCurrency, cn } from "@/lib/utils";
import {
  ShoppingCart, Package, Scissors, Layers, CreditCard, UserCheck,
  FolderTree, Users, Undo2, Wallet, ArrowLeftRight, Box, Boxes, Cake,
  ChevronLeft, Menu,
} from "lucide-react";

type Period = "today" | "week" | "month" | "3months";
type SectionKey =
  | "salesList" | "topProducts" | "topServices" | "topAll"
  | "byPayment" | "bySeller" | "byCategory" | "byCustomer" | "refunds"
  | "registers" | "cashInOut"
  | "products" | "stockMoves" | "birthdays";

function getPeriodDates(p: Period): { dateFrom: string; dateTo: string } {
  const now = new Date();
  const to  = now.toISOString();
  const from = new Date(now);
  if (p === "today")   from.setHours(0, 0, 0, 0);
  if (p === "week")    from.setDate(now.getDate() - 7);
  if (p === "month")   from.setDate(now.getDate() - 30);
  if (p === "3months") from.setDate(now.getDate() - 90);
  return { dateFrom: from.toISOString(), dateTo: to };
}

const PERIODS: { value: Period; label: string }[] = [
  { value: "today",   label: "Hoje" },
  { value: "week",    label: "7 dias" },
  { value: "month",   label: "30 dias" },
  { value: "3months", label: "90 dias" },
];

const METHOD_LABELS: Record<string, string> = {
  pix: "PIX", cash: "Dinheiro", credit: "Crédito", debit: "Débito",
  account: "Em aberto", voucher: "Voucher",
};

const PAYMENT_STATUS: Record<string, { label: string; cls: string }> = {
  paid:      { label: "Pago",      cls: "bg-emerald-100 text-emerald-700" },
  unpaid:    { label: "Em aberto", cls: "bg-amber-100 text-amber-700" },
  partial:   { label: "Parcial",   cls: "bg-sky-100 text-sky-700" },
  refunded:  { label: "Devolvido", cls: "bg-rose-100 text-rose-700" },
  void:      { label: "Cancelado", cls: "bg-muted text-muted-foreground" },
};

const MENU: { group: string; items: { key: SectionKey; label: string; icon: any }[] }[] = [
  {
    group: "Vendas",
    items: [
      { key: "salesList",    label: "Consulta de Vendas",              icon: ShoppingCart },
      { key: "topProducts",  label: "Produtos mais Vendidos",           icon: Package },
      { key: "topServices",  label: "Serviços mais Vendidos",           icon: Scissors },
      { key: "topAll",       label: "Produtos/Serviços mais Vendidos",  icon: Layers },
      { key: "byPayment",    label: "Vendas por Tipo de Pagamento",     icon: CreditCard },
      { key: "bySeller",     label: "Vendas por Vendedor",              icon: UserCheck },
      { key: "byCategory",   label: "Vendas por Categorias",            icon: FolderTree },
      { key: "byCustomer",   label: "Vendas por Clientes",              icon: Users },
      { key: "refunds",      label: "Devoluções",                       icon: Undo2 },
    ],
  },
  {
    group: "Caixa",
    items: [
      { key: "registers",  label: "Consulta de Caixa",   icon: Wallet },
      { key: "cashInOut",  label: "Entradas e Saídas",   icon: ArrowLeftRight },
    ],
  },
  {
    group: "Operacional",
    items: [
      { key: "products",    label: "Produtos",                   icon: Box },
      { key: "stockMoves",  label: "Movimentações de Estoque",   icon: Boxes },
      { key: "birthdays",   label: "Aniversariantes",            icon: Cake },
    ],
  },
];

function fmtDate(s?: string | null) {
  if (!s) return "—";
  const d = new Date(s);
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function RelatoriosPage() {
  const [period, setPeriod] = useState<Period>("month");
  const [section, setSection] = useState<SectionKey>("salesList");
  const [mobileMenu, setMobileMenu] = useState(false);
  const dates = useMemo(() => getPeriodDates(period), [period]);

  const currentLabel = MENU.flatMap(g => g.items).find(i => i.key === section)?.label ?? "";

  return (
    <div className="pb-28 md:pb-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="font-heading font-bold text-2xl">Relatórios</h1>
          <p className="text-sm text-muted-foreground">Análise completa do seu negócio</p>
        </div>
        <button
          onClick={() => setMobileMenu(true)}
          className="md:hidden p-2 rounded-xl border border-border bg-card"
          aria-label="Menu de relatórios"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Period selector */}
      <div className="flex gap-2 overflow-x-auto overflow-y-hidden no-scrollbar -mx-4 px-4 mb-5">
        {PERIODS.map(p => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={cn(
              "flex-shrink-0 px-4 py-2 rounded-xl border text-sm font-semibold transition-all",
              period === p.value ? "bg-primary text-white border-primary" : "bg-card border-border text-muted-foreground",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-5">
        {/* Desktop sidebar */}
        <aside className="hidden md:block">
          <nav className="bg-card border border-border rounded-2xl p-2 sticky top-4">
            {MENU.map(group => (
              <div key={group.group} className="mb-3 last:mb-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-3 pt-2 pb-1">{group.group}</p>
                {group.items.map(it => {
                  const Icon = it.icon;
                  const active = section === it.key;
                  return (
                    <button
                      key={it.key}
                      onClick={() => setSection(it.key)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-colors",
                        active ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-muted",
                      )}
                    >
                      <Icon className={cn("h-4 w-4 flex-shrink-0", active ? "text-primary" : "text-muted-foreground")} />
                      <span className="truncate">{it.label}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <section className="min-w-0">
          <div className="md:hidden mb-3 flex items-center gap-2 text-sm">
            <span className="font-semibold">{currentLabel}</span>
          </div>
          <Content section={section} dates={dates} />
        </section>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenu && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileMenu(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-[80%] max-w-xs bg-card shadow-xl overflow-y-auto">
            <div className="sticky top-0 bg-card border-b border-border flex items-center gap-2 p-3">
              <button onClick={() => setMobileMenu(false)} className="p-1.5 rounded-lg hover:bg-muted">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="font-semibold">Relatórios</span>
            </div>
            <div className="p-2">
              {MENU.map(group => (
                <div key={group.group} className="mb-3 last:mb-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-3 pt-2 pb-1">{group.group}</p>
                  {group.items.map(it => {
                    const Icon = it.icon;
                    const active = section === it.key;
                    return (
                      <button
                        key={it.key}
                        onClick={() => { setSection(it.key); setMobileMenu(false); }}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left transition-colors",
                          active ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-muted",
                        )}
                      >
                        <Icon className={cn("h-4 w-4 flex-shrink-0", active ? "text-primary" : "text-muted-foreground")} />
                        <span className="truncate">{it.label}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────────── Content switch ──────────────────────────── */

function Content({ section, dates }: { section: SectionKey; dates: { dateFrom: string; dateTo: string } }) {
  switch (section) {
    case "salesList":   return <SalesListPanel dates={dates} />;
    case "topProducts": return <TopItemsPanel dates={dates} kind="product" title="Produtos mais vendidos" />;
    case "topServices": return <TopItemsPanel dates={dates} kind="service" title="Serviços mais vendidos" />;
    case "topAll":      return <TopItemsPanel dates={dates} kind="all"     title="Produtos e serviços mais vendidos" />;
    case "byPayment":   return <ByPaymentPanel dates={dates} />;
    case "bySeller":    return <BySellerPanel dates={dates} />;
    case "byCategory":  return <ByCategoryPanel dates={dates} />;
    case "byCustomer":  return <ByCustomerPanel dates={dates} />;
    case "refunds":     return <RefundsPanel dates={dates} />;
    case "registers":   return <RegistersPanel dates={dates} />;
    case "cashInOut":   return <CashInOutPanel dates={dates} />;
    case "products":    return <ProductsPanel />;
    case "stockMoves":  return <StockMovesPanel dates={dates} />;
    case "birthdays":   return <BirthdaysPanel />;
  }
}

/* ───────────────────────── Common wrappers ─────────────────────────────── */

function Panel({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-3">
        <span className="font-semibold text-sm">{title}</span>
        {right}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="px-4 py-10 text-center text-sm text-muted-foreground">{text}</div>;
}

function LoadingState() {
  return <div className="px-4 py-10 text-center text-sm text-muted-foreground">Carregando…</div>;
}

function ErrorState({ error }: { error: string }) {
  return <div className="px-4 py-6 text-center text-sm text-rose-600">Erro: {error}</div>;
}

/* ───────────────────────────── Sections ────────────────────────────────── */

function SalesListPanel({ dates }: { dates: any }) {
  const q = api.reports.salesList.useQuery(dates);
  if (q.isLoading) return <LoadingState />;
  if (q.error)     return <ErrorState error={q.error.message} />;
  const rows = q.data ?? [];
  const total = rows.reduce((s: number, r: any) => s + Number(r.total ?? 0), 0);
  return (
    <Panel
      title={`Consulta de Vendas · ${rows.length} pedido${rows.length === 1 ? "" : "s"}`}
      right={<span className="text-sm font-mono font-bold text-primary">{formatCurrency(total)}</span>}
    >
      {rows.length === 0 ? <EmptyState text="Nenhuma venda no período" /> : (
        <div className="divide-y divide-border">
          {rows.map((o: any) => {
            const st = PAYMENT_STATUS[o.payment_status] ?? { label: o.payment_status ?? "—", cls: "bg-muted text-muted-foreground" };
            return (
              <div key={o.id} className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">#{o.number}</span>
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", st.cls)}>{st.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {o.customerName ?? "Sem cliente"} · {fmtDate(o.created_at)}
                    {o.payment_method ? ` · ${METHOD_LABELS[o.payment_method] ?? o.payment_method}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold font-mono">{formatCurrency(Number(o.total ?? 0))}</p>
                  {Number(o.discount ?? 0) > 0 && (
                    <p className="text-[11px] text-rose-600 font-mono">-{formatCurrency(Number(o.discount))}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

function TopItemsPanel({ dates, kind, title }: { dates: any; kind: "product" | "service" | "all"; title: string }) {
  const q = api.reports.topItems.useQuery({ ...dates, kind, limit: 20 });
  if (q.isLoading) return <LoadingState />;
  if (q.error)     return <ErrorState error={q.error.message} />;
  const rows = q.data ?? [];
  return (
    <Panel title={title}>
      {rows.length === 0 ? <EmptyState text="Sem dados no período" /> : (
        <div className="divide-y divide-border">
          {rows.map((p: any, i: number) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <span className="w-6 text-sm font-bold text-muted-foreground">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground">
                  {p.quantity} {p.type === "service" ? "atendimentos" : "vendidos"}
                  {kind === "all" && (
                    <span className={cn("ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold",
                      p.type === "service" ? "bg-violet-100 text-violet-700" : "bg-sky-100 text-sky-700")}>
                      {p.type === "service" ? "Serviço" : "Produto"}
                    </span>
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold font-mono text-primary">{formatCurrency(p.revenue)}</p>
                <p className="text-xs text-emerald-600 font-mono">+{formatCurrency(p.profit)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function ByPaymentPanel({ dates }: { dates: any }) {
  const q = api.reports.paymentBreakdown.useQuery(dates);
  if (q.isLoading) return <LoadingState />;
  if (q.error)     return <ErrorState error={q.error.message} />;
  const data = q.data;
  if (!data || data.items.length === 0) return <Panel title="Vendas por tipo de pagamento"><EmptyState text="Sem pagamentos no período" /></Panel>;
  return (
    <Panel title="Vendas por tipo de pagamento">
      <div className="divide-y divide-border">
        {data.items.map((item: any) => (
          <div key={item.method} className="flex items-center gap-3 px-4 py-3">
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-semibold">{METHOD_LABELS[item.method] ?? item.method}</span>
                <span className="text-sm font-mono font-bold">{formatCurrency(item.amount)}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${item.percent}%` }} />
              </div>
              <span className="text-xs text-muted-foreground">{item.percent.toFixed(1)}%</span>
            </div>
          </div>
        ))}
        <div className="px-4 py-3 bg-muted/30 flex justify-between font-bold text-sm">
          <span>Total recebido</span>
          <span className="font-mono text-primary">{formatCurrency(data.total)}</span>
        </div>
      </div>
    </Panel>
  );
}

function BySellerPanel({ dates }: { dates: any }) {
  const q = api.reports.salesBySeller.useQuery(dates);
  if (q.isLoading) return <LoadingState />;
  if (q.error)     return <ErrorState error={q.error.message} />;
  const rows = q.data ?? [];
  return (
    <Panel title="Vendas por vendedor">
      {rows.length === 0 ? <EmptyState text="Sem vendas no período" /> : (
        <div className="divide-y divide-border">
          {rows.map((r: any) => (
            <div key={r.sellerId} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{r.name}</p>
                <p className="text-xs text-muted-foreground">{r.count} pedido{r.count === 1 ? "" : "s"}</p>
              </div>
              <p className="text-sm font-mono font-bold text-primary">{formatCurrency(r.total)}</p>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function ByCategoryPanel({ dates }: { dates: any }) {
  const q = api.reports.salesByCategory.useQuery(dates);
  if (q.isLoading) return <LoadingState />;
  if (q.error)     return <ErrorState error={q.error.message} />;
  const rows = q.data ?? [];
  return (
    <Panel title="Vendas por categoria">
      {rows.length === 0 ? <EmptyState text="Sem vendas no período" /> : (
        <div className="divide-y divide-border">
          {rows.map((r: any, i: number) => (
            <div key={i} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{r.emoji ? `${r.emoji} ` : ""}{r.name}</p>
                <p className="text-xs text-muted-foreground">{r.quantity} itens</p>
              </div>
              <p className="text-sm font-mono font-bold text-primary">{formatCurrency(r.revenue)}</p>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function ByCustomerPanel({ dates }: { dates: any }) {
  const q = api.reports.salesByCustomer.useQuery(dates);
  if (q.isLoading) return <LoadingState />;
  if (q.error)     return <ErrorState error={q.error.message} />;
  const rows = q.data ?? [];
  return (
    <Panel title="Vendas por cliente">
      {rows.length === 0 ? <EmptyState text="Sem vendas no período" /> : (
        <div className="divide-y divide-border">
          {rows.map((r: any) => (
            <div key={r.customerId} className="px-4 py-3 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{r.name}</p>
                <p className="text-xs text-muted-foreground">
                  {r.count} pedido{r.count === 1 ? "" : "s"}{r.phone ? ` · ${r.phone}` : ""}
                </p>
              </div>
              <p className="text-sm font-mono font-bold text-primary">{formatCurrency(r.total)}</p>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function RefundsPanel({ dates }: { dates: any }) {
  const q = api.reports.refundsList.useQuery(dates);
  if (q.isLoading) return <LoadingState />;
  if (q.error)     return <ErrorState error={q.error.message} />;
  const data = q.data ?? { rows: [], total: 0 };
  return (
    <Panel
      title={`Devoluções · ${data.rows.length}`}
      right={<span className="text-sm font-mono font-bold text-rose-600">-{formatCurrency(data.total)}</span>}
    >
      {data.rows.length === 0 ? <EmptyState text="Nenhuma devolução no período" /> : (
        <div className="divide-y divide-border">
          {data.rows.map((r: any) => (
            <div key={r.id} className="px-4 py-3 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold">#{r.orderNumber ?? "—"}</p>
                <p className="text-xs text-muted-foreground">{fmtDate(r.created_at)}</p>
                {r.reason && <p className="text-xs text-foreground mt-1 line-clamp-2">{r.reason}</p>}
              </div>
              <p className="text-sm font-mono font-bold text-rose-600">-{formatCurrency(Number(r.total_amount ?? 0))}</p>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function RegistersPanel({ dates }: { dates: any }) {
  const q = api.reports.registersList.useQuery(dates);
  if (q.isLoading) return <LoadingState />;
  if (q.error)     return <ErrorState error={q.error.message} />;
  const rows = q.data ?? [];
  return (
    <Panel title="Consulta de caixa">
      {rows.length === 0 ? <EmptyState text="Nenhum caixa no período" /> : (
        <div className="divide-y divide-border">
          {rows.map((r: any) => (
            <div key={r.id} className="px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{r.name ?? "Caixa"}</p>
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full",
                  r.status === "open" ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground")}>
                  {r.status === "open" ? "Aberto" : "Fechado"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Aberto: {fmtDate(r.opened_at)}{r.closed_at ? ` · Fechado: ${fmtDate(r.closed_at)}` : ""}
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Saldo</p>
                  <p className="font-mono font-bold">{formatCurrency(Number(r.balance ?? 0))}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Esperado</p>
                  <p className="font-mono">{formatCurrency(Number(r.expected_balance ?? 0))}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Diferença</p>
                  <p className={cn("font-mono font-bold", Number(r.variance ?? 0) < 0 ? "text-rose-600" : "text-emerald-600")}>
                    {formatCurrency(Number(r.variance ?? 0))}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function CashInOutPanel({ dates }: { dates: any }) {
  const q = api.reports.cashInOut.useQuery(dates);
  if (q.isLoading) return <LoadingState />;
  if (q.error)     return <ErrorState error={q.error.message} />;
  const data = q.data ?? { rows: [], totalIn: 0, totalOut: 0 };
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs text-muted-foreground">Entradas</p>
          <p className="text-xl font-bold font-mono text-emerald-600">{formatCurrency(data.totalIn)}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs text-muted-foreground">Saídas</p>
          <p className="text-xl font-bold font-mono text-rose-600">{formatCurrency(data.totalOut)}</p>
        </div>
      </div>
      <Panel title={`Movimentos · ${data.rows.length}`}>
        {data.rows.length === 0 ? <EmptyState text="Sem movimentações no período" /> : (
          <div className="divide-y divide-border">
            {data.rows.map((r: any) => {
              const isIn = r.action === "cash-in";
              return (
                <div key={r.id} className="px-4 py-3 flex items-start gap-3">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                    isIn ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")}>
                    <ArrowLeftRight className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{isIn ? "Entrada" : "Saída"}</p>
                    <p className="text-xs text-muted-foreground">
                      {fmtDate(r.created_at)}
                      {r.description ? ` · ${r.description}` : ""}
                    </p>
                  </div>
                  <p className={cn("text-sm font-mono font-bold", isIn ? "text-emerald-600" : "text-rose-600")}>
                    {isIn ? "+" : "-"}{formatCurrency(Number(r.value ?? 0))}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}

function ProductsPanel() {
  const q = api.reports.inventoryValuation.useQuery();
  if (q.isLoading) return <LoadingState />;
  if (q.error)     return <ErrorState error={q.error.message} />;
  const data = q.data;
  if (!data) return null;
  const inStock = data.products.filter((p: any) => p.stock > 0);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
            <Package className="h-3.5 w-3.5" />Valor de custo
          </p>
          <p className="text-xl font-bold font-mono">{formatCurrency(data.totalCostValue)}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Valor de venda</p>
          <p className="text-xl font-bold font-mono text-primary">{formatCurrency(data.totalRetailValue)}</p>
        </div>
      </div>
      <Panel title={`Produtos em estoque · ${inStock.length}`}>
        {inStock.length === 0 ? <EmptyState text="Nenhum produto em estoque" /> : (
          <div className="divide-y divide-border">
            {inStock.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.stock} un × {formatCurrency(p.costPrice)}</p>
                </div>
                <p className="font-mono font-bold text-sm">{formatCurrency(p.totalCost)}</p>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function StockMovesPanel({ dates }: { dates: any }) {
  const q = api.reports.stockMovements.useQuery(dates);
  if (q.isLoading) return <LoadingState />;
  if (q.error)     return <ErrorState error={q.error.message} />;
  const rows = q.data ?? [];
  return (
    <Panel title={`Movimentações de estoque · ${rows.length}`}>
      {rows.length === 0 ? <EmptyState text="Nenhuma movimentação no período" /> : (
        <div className="divide-y divide-border">
          {rows.map((r: any) => {
            const isIn = Number(r.quantity ?? 0) > 0;
            return (
              <div key={r.id} className="px-4 py-3 flex items-start gap-3">
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                  isIn ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")}>
                  <Boxes className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{r.productName}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.type ?? "—"} · {fmtDate(r.created_at)}
                    {r.reason ? ` · ${r.reason}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className={cn("text-sm font-mono font-bold", isIn ? "text-emerald-600" : "text-rose-600")}>
                    {isIn ? "+" : ""}{r.quantity}
                  </p>
                  <p className="text-[11px] text-muted-foreground font-mono">{r.before} → {r.after}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

function BirthdaysPanel() {
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const q = api.reports.birthdays.useQuery({ month });
  const MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
        {MONTHS.map((m, i) => (
          <button
            key={m}
            onClick={() => setMonth(i + 1)}
            className={cn(
              "flex-shrink-0 px-3 py-1.5 rounded-lg border text-xs font-semibold",
              month === i + 1 ? "bg-primary text-white border-primary" : "bg-card border-border text-muted-foreground",
            )}
          >
            {m}
          </button>
        ))}
      </div>
      {q.isLoading ? <LoadingState /> : q.error ? <ErrorState error={q.error.message} /> : (
        <Panel title={`Aniversariantes de ${MONTHS[month - 1]} · ${q.data?.rows.length ?? 0}`}>
          {(q.data?.rows.length ?? 0) === 0 ? <EmptyState text="Nenhum aniversariante neste mês" /> : (
            <div className="divide-y divide-border">
              {q.data!.rows.map((c: any) => (
                <div key={c.id} className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center flex-shrink-0">
                      <Cake className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{c.name}</p>
                      {c.phone && <p className="text-xs text-muted-foreground">{c.phone}</p>}
                    </div>
                  </div>
                  <p className="text-sm font-bold font-mono">
                    {String(c.day).padStart(2, "0")}/{String(c.month).padStart(2, "0")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}
