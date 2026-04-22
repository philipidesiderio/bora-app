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
