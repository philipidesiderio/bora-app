"use client";

import { useState, useMemo } from "react";
import { api } from "@/components/providers/trpc-provider";
import { cn } from "@/lib/utils";
import {
  Building2, TrendingUp, DollarSign, AlertTriangle,
  CheckCircle, XCircle, Search, RefreshCw, ShieldCheck,
  Crown, Zap, Rocket, Star, Calendar, Phone, Mail,
  ArrowUpRight, Globe, Smartphone, Monitor, Tablet,
  MousePointerClick, ShoppingBag, MapPin, BarChart2,
  Eye, Users,
} from "lucide-react";

// ─── helpers ──────────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString("pt-BR") : "—";

const daysUntil = (s: string | null) => {
  if (!s) return null;
  return Math.ceil((new Date(s).getTime() - Date.now()) / 86_400_000);
};

const PLAN_LABEL: Record<string, string> = {
  free: "Start", smart: "Prime", pro: "Business", premium: "Elite",
};
const PLAN_COLOR: Record<string, string> = {
  free:    "bg-slate-100 text-slate-600",
  smart:   "bg-blue-100 text-blue-700",
  pro:     "bg-violet-100 text-violet-700",
  premium: "bg-amber-100 text-amber-700",
};
const PLAN_ICON: Record<string, any> = {
  free: Star, smart: Zap, pro: Rocket, premium: Crown,
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon: Icon, color, small,
}: {
  label: string; value: string | number; sub?: string;
  icon: any; color: string; small?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-start gap-4">
      <div className={cn("p-3 rounded-xl", color)}>
        <Icon size={22} className="opacity-80" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide truncate">{label}</p>
        <p className={cn("font-bold text-slate-900 mt-0.5", small ? "text-xl" : "text-2xl")}>{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Plan Badge ───────────────────────────────────────────────────────────────

function PlanBadge({ plan }: { plan: string }) {
  const Icon = PLAN_ICON[plan] ?? Star;
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold", PLAN_COLOR[plan] ?? "bg-slate-100 text-slate-600")}>
      <Icon size={10} />
      {PLAN_LABEL[plan] ?? plan}
    </span>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

// ─── Visitor Analytics Components ────────────────────────────────────────────

function MiniBar({ label, count, max, color }: { label: string; count: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-28 truncate text-slate-600 font-medium shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-right text-slate-500">{count}</span>
    </div>
  );
}

function DailyChart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="flex items-end gap-0.5 h-16">
      {data.map(d => (
        <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5 group relative">
          <div
            className="w-full bg-indigo-200 hover:bg-indigo-400 rounded-sm transition-colors cursor-default"
            style={{ height: `${Math.max((d.count / max) * 100, 4)}%` }}
            title={`${d.date}: ${d.count} visitas`}
          />
        </div>
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState("todos");
  const [filterStatus, setFilterStatus] = useState("todos");

  const stats     = api.admin.getStats.useQuery(undefined, { refetchInterval: 60_000 });
  const tenants   = api.admin.getTenants.useQuery(undefined, { refetchInterval: 60_000 });
  const analytics = api.admin.getAnalytics.useQuery(undefined, { refetchInterval: 120_000 });

  const refetch = () => { stats.refetch(); tenants.refetch(); analytics.refetch(); };

  const filtered = useMemo(() => {
    let rows = tenants.data ?? [];
    if (search)
      rows = rows.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        (t.ownerEmail ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (t.city ?? "").toLowerCase().includes(search.toLowerCase())
      );
    if (filterPlan !== "todos") rows = rows.filter(t => t.plan === filterPlan);
    if (filterStatus === "ativos")   rows = rows.filter(t => t.isActive);
    if (filterStatus === "inativos") rows = rows.filter(t => !t.isActive);
    if (filterStatus === "pagos")    rows = rows.filter(t => t.plan !== "free");
    if (filterStatus === "free")     rows = rows.filter(t => t.plan === "free");
    return rows;
  }, [tenants.data, search, filterPlan, filterStatus]);

  const s = stats.data;

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">Super Admin</h1>
              <p className="text-xs text-slate-500">lumiPOS · Painel do Operador</p>
            </div>
          </div>
          <button
            onClick={refetch}
            disabled={stats.isFetching || tenants.isFetching}
            className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100"
          >
            <RefreshCw size={14} className={cn(stats.isFetching && "animate-spin")} />
            Atualizar
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── Alerta: vencendo em breve ── */}
        {s && s.expiringSoon.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                {s.expiringSoon.length} plano{s.expiringSoon.length > 1 ? "s" : ""} vencendo em menos de 5 dias
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                {s.expiringSoon.map((e: any) => e.name).join(", ")}
              </p>
            </div>
          </div>
        )}

        {/* ── Stat cards ── */}
        {s ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard label="Empresas total"    value={s.total}   sub={`+${s.newThisWeek} esta semana`} icon={Building2}   color="bg-indigo-50 text-indigo-600" />
              <StatCard label="Ativas"            value={s.active}  sub={`${s.inactive} inativas`}        icon={CheckCircle}  color="bg-emerald-50 text-emerald-600" />
              <StatCard label="MRR"               value={fmt(s.mrr)} sub={`${s.paid} pagantes`}           icon={DollarSign}   color="bg-violet-50 text-violet-600" />
              <StatCard label="Novas este mês"    value={s.newThisMonth} sub="cadastros"                  icon={TrendingUp}   color="bg-sky-50 text-sky-600" />
            </div>

            {/* ── Segunda linha ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard small label="Receita hoje"    value={fmt(s.revenueToday)} icon={ArrowUpRight} color="bg-green-50 text-green-600" />
              <StatCard small label="Plano free"      value={s.planCount.free ?? 0}    icon={Star}    color="bg-slate-100 text-slate-600" />
              <StatCard small label="Plano Prime"     value={s.planCount.smart ?? 0}   icon={Zap}     color="bg-blue-50 text-blue-600" />
              <StatCard small label="Plano Business+" value={(s.planCount.pro ?? 0) + (s.planCount.premium ?? 0)} icon={Crown} color="bg-amber-50 text-amber-600" />
            </div>
          </>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 h-24 animate-pulse" />
            ))}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            BLOCO: ANALYTICS DE VISITANTES
            ══════════════════════════════════════════════════════ */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 size={16} className="text-indigo-500" />
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Visitantes do site (últimos 30 dias)</h2>
          </div>

          {analytics.isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 h-24 animate-pulse" />
              ))}
            </div>
          ) : analytics.data ? (() => {
            const a = analytics.data;
            const deviceTotal = Object.values(a.deviceMap).reduce((s, v) => s + v, 0) || 1;
            return (
              <div className="space-y-4">
                {/* Métricas rápidas */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <StatCard label="Visitantes hoje"     value={a.sessionsToday} icon={Eye}              color="bg-sky-50 text-sky-600" />
                  <StatCard label="Visitantes 7 dias"   value={a.sessions7}     icon={Users}            color="bg-indigo-50 text-indigo-600" />
                  <StatCard label="Clicou em Assinar"   value={a.clickAssinar}  sub="últimos 30d"       icon={MousePointerClick} color="bg-violet-50 text-violet-600" />
                  <StatCard small label="Conversão checkout" value={`${a.conversionRate}%`}
                    sub={`${a.checkoutCompleted}/${a.checkoutStarted} pagaram`}
                    icon={ShoppingBag} color="bg-emerald-50 text-emerald-600" />
                </div>

                {/* Gráfico diário + países + devices */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                  {/* Gráfico 30 dias */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:col-span-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Pageviews por dia</p>
                    <DailyChart data={a.dailyVisits} />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>{a.dailyVisits[0]?.date?.slice(5)}</span>
                      <span>{a.dailyVisits[a.dailyVisits.length - 1]?.date?.slice(5)}</span>
                    </div>
                  </div>

                  {/* Devices */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Dispositivos</p>
                    <div className="space-y-2.5">
                      {[
                        { key: "mobile",  label: "Mobile",  icon: Smartphone },
                        { key: "desktop", label: "Desktop", icon: Monitor    },
                        { key: "tablet",  label: "Tablet",  icon: Tablet     },
                      ].map(({ key, label, icon: Icon }) => {
                        const count = a.deviceMap[key] ?? 0;
                        const pct   = Math.round((count / deviceTotal) * 100);
                        return (
                          <div key={key} className="flex items-center gap-2 text-xs">
                            <Icon size={13} className="text-slate-400 shrink-0" />
                            <span className="w-14 text-slate-600 font-medium">{label}</span>
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-slate-500 w-10 text-right">{count} ({pct}%)</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* OS */}
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 mt-4">Sistema operacional</p>
                    <div className="space-y-1.5">
                      {Object.entries(a.osMap)
                        .sort((x, y) => y[1] - x[1])
                        .slice(0, 5)
                        .map(([os, count]) => (
                          <MiniBar key={os} label={os} count={count} max={deviceTotal} color="bg-sky-400" />
                        ))}
                    </div>
                  </div>
                </div>

                {/* Países + cidades + páginas */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                  {/* Países */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                    <div className="flex items-center gap-1.5 mb-3">
                      <Globe size={13} className="text-indigo-400" />
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Países</p>
                    </div>
                    <div className="space-y-2">
                      {a.topCountries.length === 0 ? (
                        <p className="text-xs text-slate-400">Sem dados ainda.</p>
                      ) : a.topCountries.map(({ code, country, count }) => (
                        <MiniBar key={code} label={country || code} count={count}
                          max={a.topCountries[0]!.count} color="bg-indigo-400" />
                      ))}
                    </div>
                  </div>

                  {/* Cidades */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                    <div className="flex items-center gap-1.5 mb-3">
                      <MapPin size={13} className="text-rose-400" />
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Cidades</p>
                    </div>
                    <div className="space-y-2">
                      {a.topCities.length === 0 ? (
                        <p className="text-xs text-slate-400">Sem dados ainda.</p>
                      ) : a.topCities.map(({ city, count }) => (
                        <MiniBar key={city} label={city} count={count}
                          max={a.topCities[0]!.count} color="bg-rose-400" />
                      ))}
                    </div>
                  </div>

                  {/* Páginas mais visitadas */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                    <div className="flex items-center gap-1.5 mb-3">
                      <Eye size={13} className="text-amber-500" />
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Páginas populares</p>
                    </div>
                    <div className="space-y-2">
                      {a.topPages.length === 0 ? (
                        <p className="text-xs text-slate-400">Sem dados ainda.</p>
                      ) : a.topPages.map(({ page, count }) => (
                        <MiniBar key={page} label={page} count={count}
                          max={a.topPages[0]!.count} color="bg-amber-400" />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Funil de conversão */}
                {(a.clickAssinar > 0 || a.checkoutStarted > 0) && (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Funil de conversão (30 dias)</p>
                    <div className="flex items-end gap-3 flex-wrap">
                      {[
                        { label: "Visitantes únicos", count: a.sessions30, color: "bg-slate-300" },
                        { label: "Clicou em Assinar", count: a.clickAssinar, color: "bg-violet-400" },
                        { label: "Iniciou checkout",  count: a.checkoutStarted, color: "bg-blue-400" },
                        { label: "Pagou",             count: a.checkoutCompleted, color: "bg-emerald-500" },
                      ].map(({ label, count, color }) => (
                        <div key={label} className="flex-1 min-w-[80px] text-center">
                          <div className="text-2xl font-bold text-slate-800">{count}</div>
                          <div className={cn("h-1.5 w-full rounded-full mt-1 mb-1.5", color)} />
                          <div className="text-[10px] text-slate-500 font-medium">{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })() : null}
        </div>

        {/* ── Tabela de empresas ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Filtros */}
          <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar empresa, e-mail, cidade..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <select
              value={filterPlan}
              onChange={e => setFilterPlan(e.target.value)}
              className="text-sm rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="todos">Todos os planos</option>
              <option value="free">Free</option>
              <option value="smart">Prime</option>
              <option value="pro">Business</option>
              <option value="premium">Elite</option>
            </select>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="text-sm rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="todos">Todos os status</option>
              <option value="ativos">Ativos</option>
              <option value="inativos">Inativos</option>
              <option value="pagos">Pagantes</option>
              <option value="free">Só free</option>
            </select>
            <span className="text-xs text-slate-400 whitespace-nowrap">
              {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Tabela */}
          <div className="overflow-x-auto">
            {tenants.isLoading ? (
              <div className="p-8 text-center text-slate-400 text-sm">Carregando empresas...</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">Nenhuma empresa encontrada.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                    <th className="text-left px-4 py-3 font-medium">Empresa</th>
                    <th className="text-left px-4 py-3 font-medium">Contato</th>
                    <th className="text-left px-4 py-3 font-medium">Plano</th>
                    <th className="text-left px-4 py-3 font-medium">Venc.</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-right px-4 py-3 font-medium">Vendas hoje</th>
                    <th className="text-right px-4 py-3 font-medium">Vendas mês</th>
                    <th className="text-left px-4 py-3 font-medium">Cadastro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(t => {
                    const days = daysUntil(t.planExpiresAt);
                    const expireWarning = days !== null && days <= 5 && t.plan !== "free";
                    return (
                      <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                        {/* Empresa */}
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-800 truncate max-w-[160px]">{t.name}</p>
                          <p className="text-xs text-slate-400">{t.city}{t.state ? `, ${t.state}` : ""}</p>
                        </td>

                        {/* Contato */}
                        <td className="px-4 py-3">
                          {t.ownerEmail && (
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                              <Mail size={11} />
                              <span className="truncate max-w-[150px]">{t.ownerEmail}</span>
                            </div>
                          )}
                          {t.phone && (
                            <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                              <Phone size={11} />
                              {t.phone}
                            </div>
                          )}
                        </td>

                        {/* Plano */}
                        <td className="px-4 py-3">
                          <PlanBadge plan={t.plan} />
                        </td>

                        {/* Vencimento */}
                        <td className="px-4 py-3">
                          {t.plan === "free" ? (
                            <span className="text-xs text-slate-400">—</span>
                          ) : (
                            <span className={cn("text-xs", expireWarning ? "text-red-600 font-semibold" : "text-slate-500")}>
                              {expireWarning && <AlertTriangle size={10} className="inline mr-1" />}
                              {fmtDate(t.planExpiresAt)}
                              {days !== null && ` (${days}d)`}
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          {t.isActive ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                              <CheckCircle size={10} /> Ativa
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                              <XCircle size={10} /> Inativa
                            </span>
                          )}
                        </td>

                        {/* Vendas hoje */}
                        <td className="px-4 py-3 text-right">
                          {t.salesToday > 0 ? (
                            <span className="text-emerald-700 font-semibold">{fmt(t.salesToday)}</span>
                          ) : (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </td>

                        {/* Vendas mês */}
                        <td className="px-4 py-3 text-right">
                          {t.salesMonth > 0 ? (
                            <span className="text-slate-700 font-medium">{fmt(t.salesMonth)}</span>
                          ) : (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </td>

                        {/* Cadastro */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <Calendar size={11} />
                            {fmtDate(t.createdAt)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 pb-4">
          lumiPOS Super Admin · Atualizado a cada 60s · Restrito a {" "}
          <span className="font-medium">mkt.desiderio@gmail.com</span>
        </p>
      </div>
    </div>
  );
}
