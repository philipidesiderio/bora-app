import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = "mkt.desiderio@gmail.com";

function getAdminSupa() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

/** Procedure restrita ao e-mail do dono da plataforma */
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  const email = (ctx.session as any).user?.email;
  if (email !== ADMIN_EMAIL) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito ao administrador." });
  }
  return next({ ctx });
});

const PLAN_PRICE: Record<string, number> = { free: 0, smart: 39, pro: 69, premium: 99 };

export const adminRouter = createTRPCRouter({

  /** Cards de visão geral */
  getStats: adminProcedure.query(async () => {
    const supa = getAdminSupa();
    const now  = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfWeek  = new Date(now.getTime() - 7 * 86_400_000).toISOString();
    const in5Days      = new Date(now.getTime() + 5 * 86_400_000).toISOString();

    const [allRes, monthRes, weekRes, expiringRes, ordersRes] = await Promise.all([
      supa.from("tenants").select("id, plan, is_active, plan_expires_at"),
      supa.from("tenants").select("id").gte("created_at", startOfMonth),
      supa.from("tenants").select("id").gte("created_at", startOfWeek),
      supa.from("tenants")
        .select("id, name, plan_expires_at")
        .lte("plan_expires_at", in5Days)
        .gt("plan_expires_at", now.toISOString())
        .neq("plan", "free"),
      supa.from("orders")
        .select("tenant_id, total")
        .gte("created_at", new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString())
        .eq("payment_status", "paid"),
    ]);

    const tenants  = allRes.data ?? [];
    const active   = tenants.filter(t => t.is_active);
    const paid     = tenants.filter(t => t.plan !== "free");
    const mrr      = paid.reduce((s, t) => s + (PLAN_PRICE[t.plan] ?? 0), 0);
    const planCount = { free: 0, smart: 0, pro: 0, premium: 0 } as Record<string, number>;
    tenants.forEach(t => { planCount[t.plan] = (planCount[t.plan] ?? 0) + 1; });

    const revenueToday = (ordersRes.data ?? []).reduce((s, o) => s + Number(o.total ?? 0), 0);

    return {
      total:        tenants.length,
      active:       active.length,
      inactive:     tenants.length - active.length,
      paid:         paid.length,
      free:         tenants.length - paid.length,
      mrr,
      newThisMonth: monthRes.data?.length ?? 0,
      newThisWeek:  weekRes.data?.length  ?? 0,
      expiringSoon: expiringRes.data ?? [],
      revenueToday,
      planCount,
    };
  }),

  /** Métricas de visitantes do site */
  getAnalytics: adminProcedure.query(async () => {
    const supa  = getAdminSupa();
    const now   = new Date();
    const d7    = new Date(now.getTime() - 7  * 86_400_000).toISOString();
    const d30   = new Date(now.getTime() - 30 * 86_400_000).toISOString();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const [all30, all7, todayRes] = await Promise.all([
      supa.from("site_analytics").select("event, page, country_code, country, city, device, os, browser, session_id, created_at").gte("created_at", d30),
      supa.from("site_analytics").select("event, session_id").gte("created_at", d7),
      supa.from("site_analytics").select("event, session_id").gte("created_at", today),
    ]);

    const rows30  = all30.data  ?? [];
    const rows7   = all7.data   ?? [];
    const todayRows = todayRes.data ?? [];

    // ── totais ──────────────────────────────────────────────────────────────
    const sessions30 = new Set(rows30.filter(r => r.session_id).map(r => r.session_id)).size;
    const sessions7  = new Set(rows7.filter(r => r.session_id).map(r => r.session_id)).size;
    const sessionsToday = new Set(todayRows.filter(r => r.session_id).map(r => r.session_id)).size;

    const pageviews30 = rows30.filter(r => r.event === "pageview").length;
    const clickAssinar = rows30.filter(r => r.event === "click_assinar").length;
    const checkoutStarted = rows30.filter(r => r.event === "checkout_started").length;
    const checkoutCompleted = rows30.filter(r => r.event === "checkout_completed").length;

    const conversionRate = checkoutStarted > 0
      ? Math.round((checkoutCompleted / checkoutStarted) * 100)
      : 0;

    // ── top países ───────────────────────────────────────────────────────────
    const countryMap: Record<string, { country: string; count: number }> = {};
    rows30.filter(r => r.event === "pageview" && r.country_code).forEach(r => {
      const k = r.country_code!;
      if (!countryMap[k]) countryMap[k] = { country: r.country ?? k, count: 0 };
      countryMap[k]!.count++;
    });
    const topCountries = Object.entries(countryMap)
      .map(([code, { country, count }]) => ({ code, country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // ── top cidades ──────────────────────────────────────────────────────────
    const cityMap: Record<string, number> = {};
    rows30.filter(r => r.event === "pageview" && r.city).forEach(r => {
      cityMap[r.city!] = (cityMap[r.city!] ?? 0) + 1;
    });
    const topCities = Object.entries(cityMap)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // ── devices ───────────────────────────────────────────────────────────────
    const deviceMap: Record<string, number> = {};
    rows30.filter(r => r.event === "pageview" && r.device).forEach(r => {
      deviceMap[r.device!] = (deviceMap[r.device!] ?? 0) + 1;
    });

    // ── OS ────────────────────────────────────────────────────────────────────
    const osMap: Record<string, number> = {};
    rows30.filter(r => r.event === "pageview" && r.os).forEach(r => {
      osMap[r.os!] = (osMap[r.os!] ?? 0) + 1;
    });

    // ── páginas mais visitadas ────────────────────────────────────────────────
    const pageMap: Record<string, number> = {};
    rows30.filter(r => r.event === "pageview" && r.page).forEach(r => {
      pageMap[r.page!] = (pageMap[r.page!] ?? 0) + 1;
    });
    const topPages = Object.entries(pageMap)
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // ── visitas por dia (últimos 30d) ─────────────────────────────────────────
    const dailyMap: Record<string, number> = {};
    rows30.filter(r => r.event === "pageview").forEach(r => {
      const day = (r.created_at as string).slice(0, 10);
      dailyMap[day] = (dailyMap[day] ?? 0) + 1;
    });
    // preenche dias faltando com 0
    const dailyVisits: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86_400_000);
      const key = d.toISOString().slice(0, 10);
      dailyVisits.push({ date: key, count: dailyMap[key] ?? 0 });
    }

    // ── planos mais clicados ──────────────────────────────────────────────────
    const planClickMap: Record<string, number> = {};
    rows30.filter(r => r.event === "click_assinar").forEach(r => {
      const p = (r as any).plan ?? "unknown";
      planClickMap[p] = (planClickMap[p] ?? 0) + 1;
    });

    return {
      // visões gerais
      sessionsToday,
      sessions7,
      sessions30,
      pageviews30,
      clickAssinar,
      checkoutStarted,
      checkoutCompleted,
      conversionRate,
      // distribuições
      topCountries,
      topCities,
      deviceMap,
      osMap,
      topPages,
      dailyVisits,
      planClickMap,
    };
  }),

  /** Tabela completa de empresas */
  getTenants: adminProcedure.query(async () => {
    const supa = getAdminSupa();
    const now  = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [tenantsRes, usersRes, salesTodayRes, salesMonthRes] = await Promise.all([
      supa.from("tenants").select("*").order("created_at", { ascending: false }),
      supa.from("users").select("tenant_id, name, email").eq("role", "owner"),
      supa.from("orders").select("tenant_id, total").gte("created_at", startOfToday).eq("payment_status", "paid"),
      supa.from("orders").select("tenant_id, total").gte("created_at", startOfMonth).eq("payment_status", "paid"),
    ]);

    const tenants    = tenantsRes.data ?? [];
    const owners     = usersRes.data ?? [];
    const todayOrders  = salesTodayRes.data ?? [];
    const monthOrders  = salesMonthRes.data ?? [];

    const ownerMap: Record<string, { name: string; email: string }> = {};
    owners.forEach(u => { ownerMap[u.tenant_id] = { name: u.name, email: u.email }; });

    const todayMap: Record<string, number> = {};
    todayOrders.forEach(o => { todayMap[o.tenant_id] = (todayMap[o.tenant_id] ?? 0) + Number(o.total ?? 0); });

    const monthMap: Record<string, number> = {};
    monthOrders.forEach(o => { monthMap[o.tenant_id] = (monthMap[o.tenant_id] ?? 0) + Number(o.total ?? 0); });

    return tenants.map(t => ({
      id:           t.id,
      name:         t.name,
      slug:         t.slug,
      plan:         t.plan as string,
      planExpiresAt: t.plan_expires_at as string | null,
      isActive:     t.is_active as boolean,
      createdAt:    t.created_at as string,
      phone:        t.phone as string | null,
      city:         t.city  as string | null,
      state:        t.state as string | null,
      ownerName:    ownerMap[t.id]?.name  ?? null,
      ownerEmail:   ownerMap[t.id]?.email ?? null,
      salesToday:   todayMap[t.id]  ?? 0,
      salesMonth:   monthMap[t.id]  ?? 0,
    }));
  }),
});
