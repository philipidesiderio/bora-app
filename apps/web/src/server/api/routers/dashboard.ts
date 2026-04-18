import { z } from "zod";
import { createTRPCRouter, tenantProcedure } from "../trpc";

export const dashboardRouter = createTRPCRouter({
  getStats: tenantProcedure.query(async ({ ctx }) => {
    const tenantId = ctx.tenant.id;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayIso = todayStart.toISOString();

    const [ordersToday, allCustomers, lowStockProducts] = await Promise.all([
      ctx.supa
        .from("orders")
        .select("total")
        .eq("tenant_id", tenantId)
        .gte("created_at", todayIso),

      ctx.supa
        .from("customers")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId),

      ctx.supa
        .from("products")
        .select("stock, min_stock")
        .eq("tenant_id", tenantId)
        .eq("is_active", true)
        .eq("track_stock", true),
    ]);

    if (ordersToday.error)      throw new Error(ordersToday.error.message);
    if (allCustomers.error)     throw new Error(allCustomers.error.message);
    if (lowStockProducts.error) throw new Error(lowStockProducts.error.message);

    const todayOrdersData = ordersToday.data ?? [];
    const todaySales  = todayOrdersData.reduce((sum, o) => sum + Number(o.total ?? 0), 0);
    const todayOrders = todayOrdersData.length;

    const totalCustomers = allCustomers.count ?? 0;

    const lowStockCount = (lowStockProducts.data ?? []).filter(
      p => (p.stock ?? 0) <= (p.min_stock ?? 0),
    ).length;

    const userName = (ctx.session.user.name ?? "").split(" ")[0] ?? "";

    return {
      userName,
      todaySales,
      todayOrders,
      totalCustomers,
      lowStockCount,
    };
  }),

  getBusinessData: tenantProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supa
      .from("tenants")
      .select("id, name, slug, phone, cnpj, description, logo_url, plan")
      .eq("id", ctx.tenant.id)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }),

  updateBusinessData: tenantProcedure
    .input(z.object({
      name:        z.string().min(1, "Nome é obrigatório"),
      phone:       z.string().optional(),
      cnpj:        z.string().optional(),
      description: z.string().optional(),
      logoUrl:     z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supa
        .from("tenants")
        .update({
          name:        input.name,
          phone:       input.phone       ?? null,
          cnpj:        input.cnpj        ?? null,
          description: input.description ?? null,
          logo_url:    input.logoUrl     ?? null,
          updated_at:  new Date().toISOString(),
        })
        .eq("id", ctx.tenant.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }),

  getRecentOrders: tenantProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supa
      .from("orders")
      .select("id, number, total, status, payment_status, created_at, customer:customers(name)")
      .eq("tenant_id", ctx.tenant.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) throw new Error(error.message);
    return data ?? [];
  }),

  getTopProducts: tenantProcedure.query(async ({ ctx }) => {
    // Pega itens de pedidos nos últimos 30 dias, agrega no cliente
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const { data: orders, error: ordersErr } = await ctx.supa
      .from("orders")
      .select("id")
      .eq("tenant_id", ctx.tenant.id)
      .neq("status", "cancelled")
      .gte("created_at", since.toISOString());

    if (ordersErr) throw new Error(ordersErr.message);
    const orderIds = (orders ?? []).map(o => o.id);
    if (orderIds.length === 0) return [];

    const { data: items, error: itemsErr } = await ctx.supa
      .from("order_items")
      .select("product_id, name, quantity, total")
      .in("order_id", orderIds);

    if (itemsErr) throw new Error(itemsErr.message);

    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const it of items ?? []) {
      const key = it.product_id ?? it.name;
      const cur = map.get(key) ?? { name: it.name, qty: 0, revenue: 0 };
      cur.qty     += Number(it.quantity ?? 0);
      cur.revenue += Number(it.total    ?? 0);
      map.set(key, cur);
    }
    return Array.from(map.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }),

  getSalesLast7Days: tenantProcedure.query(async ({ ctx }) => {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - 6);

    const { data, error } = await ctx.supa
      .from("orders")
      .select("total, created_at")
      .eq("tenant_id", ctx.tenant.id)
      .neq("status", "cancelled")
      .gte("created_at", since.toISOString());

    if (error) throw new Error(error.message);

    const LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const buckets: { day: string; value: number; today: boolean }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      buckets.push({
        day:   i === 0 ? "Hoje" : LABELS[d.getDay()]!,
        value: 0,
        today: i === 0,
      });
    }

    for (const row of data ?? []) {
      const created = new Date(row.created_at);
      created.setHours(0, 0, 0, 0);
      const diffDays = Math.round((today.getTime() - created.getTime()) / 86_400_000);
      const idx = 6 - diffDays;
      if (idx >= 0 && idx < 7) buckets[idx]!.value += Number(row.total ?? 0);
    }

    const monthTotal = buckets.reduce((s, b) => s + b.value, 0);
    return { buckets, monthTotal };
  }),

  getPaymentsBreakdown: tenantProcedure.query(async ({ ctx }) => {
    const since = new Date();
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    const { data, error } = await ctx.supa
      .from("order_payments")
      .select("method, amount")
      .eq("tenant_id", ctx.tenant.id)
      .gte("created_at", since.toISOString());

    if (error) throw new Error(error.message);

    const map = new Map<string, number>();
    for (const row of data ?? []) {
      map.set(row.method, (map.get(row.method) ?? 0) + Number(row.amount ?? 0));
    }
    const METHOD_LABELS: Record<string, string> = {
      pix:     "PIX",
      cash:    "Dinheiro",
      credit:  "Cartão Crédito",
      debit:   "Cartão Débito",
      voucher: "Voucher",
      mixed:   "Misto",
      account: "Fiado",
    };
    return Array.from(map.entries()).map(([method, value]) => ({
      method,
      name:  METHOD_LABELS[method] ?? method,
      value,
    }));
  }),

  getStorePreview: tenantProcedure.query(async ({ ctx }) => {
    const [tenantRes, productsRes] = await Promise.all([
      ctx.supa
        .from("tenants")
        .select("name, slug, logo_url")
        .eq("id", ctx.tenant.id)
        .single(),
      ctx.supa
        .from("products")
        .select("id, name, price")
        .eq("tenant_id", ctx.tenant.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(3),
    ]);

    if (tenantRes.error)   throw new Error(tenantRes.error.message);
    if (productsRes.error) throw new Error(productsRes.error.message);

    return {
      tenant:   tenantRes.data,
      products: productsRes.data ?? [],
    };
  }),
});
