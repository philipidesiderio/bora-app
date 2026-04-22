"use client";

import { useState, useMemo } from "react";
import { api } from "@/components/providers/trpc-provider";
import { cn } from "@/lib/utils";
import {
  Building2, Users, TrendingUp, DollarSign, AlertTriangle,
  CheckCircle, XCircle, Search, RefreshCw, ShieldCheck,
  Crown, Zap, Rocket, Star, Calendar, Phone, Mail,
  ArrowUpRight, Package,
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

export default function AdminDashboard() {
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState("todos");
  const [filterStatus, setFilterStatus] = useState("todos");

  const stats   = api.admin.getStats.useQuery(undefined, { refetchInterval: 60_000 });
  const tenants = api.admin.getTenants.useQuery(undefined, { refetchInterval: 60_000 });

  const refetch = () => { stats.refetch(); tenants.refetch(); };

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
