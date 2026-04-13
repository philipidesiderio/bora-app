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

  getRecentOrders: tenantProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supa
      .from("orders")
      .select("*, items:order_items(*)")
      .eq("tenant_id", ctx.tenant.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) throw new Error(error.message);
    return data ?? [];
  }),
});
