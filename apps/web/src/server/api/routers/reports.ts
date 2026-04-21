import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, tenantProcedure } from "../trpc";

const dateRangeInput = z.object({
  dateFrom: z.string().optional(),
  dateTo:   z.string().optional(),
});

export const reportsRouter = createTRPCRouter({

  // ─── Sales summary ────────────────────────────────────────────────────────
  salesSummary: tenantProcedure
    .input(dateRangeInput)
    .query(async ({ ctx, input }) => {
      let query = ctx.supa
        .from("orders")
        .select("id, total, subtotal, discount, payment_status, created_at")
        .eq("tenant_id", ctx.tenant.id)
        .neq("payment_status", "void");

      if (input.dateFrom) query = query.gte("created_at", input.dateFrom);
      if (input.dateTo)   query = query.lte("created_at", input.dateTo);

      const { data: orders, error } = await query;
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });

      const rows = orders ?? [];
      const orderIds = rows.map((o: any) => o.id);

      // Busca itens separadamente (evita dependência de FK no PostgREST)
      let totalCost = 0;
      if (orderIds.length) {
        const { data: items } = await ctx.supa
          .from("order_items")
          .select("order_id, cost_price, quantity")
          .in("order_id", orderIds);
        for (const i of items ?? []) {
          totalCost += Number((i as any).cost_price ?? 0) * Number((i as any).quantity ?? 0);
        }
      }

      const totalRevenue  = rows.reduce((s: number, o: any) => s + Number(o.total), 0);
      const totalDiscount = rows.reduce((s: number, o: any) => s + Number(o.discount ?? 0), 0);
      const grossProfit   = totalRevenue - totalCost;
      const ticketMedio   = rows.length > 0 ? totalRevenue / rows.length : 0;

      const byStatus = rows.reduce((acc: Record<string, number>, o: any) => {
        const s = o.payment_status ?? "unknown";
        acc[s] = (acc[s] ?? 0) + 1;
        return acc;
      }, {});

      return {
        totalOrders:  rows.length,
        totalRevenue,
        totalCost,
        totalDiscount,
        grossProfit,
        grossMargin:  totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0,
        ticketMedio,
        byStatus,
      };
    }),

  // ─── Payment breakdown by method ─────────────────────────────────────────
  paymentBreakdown: tenantProcedure
    .input(dateRangeInput)
    .query(async ({ ctx, input }) => {
      let query = ctx.supa
        .from("order_payments")
        .select("method, amount, created_at")
        .eq("tenant_id", ctx.tenant.id);

      if (input.dateFrom) query = query.gte("created_at", input.dateFrom);
      if (input.dateTo)   query = query.lte("created_at", input.dateTo);

      const { data, error } = await query;
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });

      const breakdown = (data ?? []).reduce((acc: Record<string, number>, p) => {
        acc[p.method] = (acc[p.method] ?? 0) + Number(p.amount);
        return acc;
      }, {});

      const total = Object.values(breakdown).reduce((s, v) => s + v, 0);
      return {
        breakdown,
        total,
        items: Object.entries(breakdown).map(([method, amount]) => ({
          method,
          amount,
          percent: total > 0 ? (amount / total) * 100 : 0,
        })).sort((a, b) => b.amount - a.amount),
      };
    }),

  // ─── Top products by revenue ──────────────────────────────────────────────
  productPerformance: tenantProcedure
    .input(z.object({
      ...dateRangeInput.shape,
      limit: z.number().default(10),
    }))
    .query(async ({ ctx, input }) => {
      // Step 1: get valid order IDs for this tenant/period (exclude void)
      let ordersQ = ctx.supa
        .from("orders")
        .select("id")
        .eq("tenant_id", ctx.tenant.id)
        .neq("payment_status", "void");
      if (input.dateFrom) ordersQ = ordersQ.gte("created_at", input.dateFrom);
      if (input.dateTo)   ordersQ = ordersQ.lte("created_at", input.dateTo);
      const { data: validOrders } = await ordersQ;
      if (!validOrders?.length) return [];

      const orderIds = validOrders.map((o: any) => o.id);

      // Step 2: get items for those orders
      const { data, error } = await ctx.supa
        .from("order_items")
        .select("product_id, name, quantity, unit_price, cost_price, total")
        .in("order_id", orderIds);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });

      // Aggregate by product
      const byProduct: Record<string, { name: string; revenue: number; quantity: number; profit: number }> = {};
      for (const item of (data ?? [])) {
        const key = item.product_id ?? item.name;
        if (!byProduct[key]) byProduct[key] = { name: item.name, revenue: 0, quantity: 0, profit: 0 };
        byProduct[key].revenue  += Number(item.total ?? 0);
        byProduct[key].quantity += Number(item.quantity ?? 0);
        byProduct[key].profit   += (Number(item.unit_price) - Number(item.cost_price ?? 0)) * Number(item.quantity);
      }

      return Object.values(byProduct)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, input.limit);
    }),

  // ─── Customer statement ───────────────────────────────────────────────────
  customerStatement: tenantProcedure
    .input(z.object({ customerId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Fetch customer orders first, then use IDs for instalments
      const [customerRes, ordersRes, historyRes] = await Promise.all([
        ctx.supa.from("customers").select("*").eq("id", input.customerId).single(),
        ctx.supa.from("orders")
          .select("id, number, total, payment_status, created_at")
          .eq("tenant_id", ctx.tenant.id)
          .eq("customer_id", input.customerId)
          .order("created_at", { ascending: false })
          .limit(50),
        ctx.supa.from("customer_account_history")
          .select("*")
          .eq("tenant_id", ctx.tenant.id)
          .eq("customer_id", input.customerId)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      // Get unpaid instalments for this customer's orders
      const orderIds = (ordersRes.data ?? []).map((o: any) => o.id);
      let pendingInstalments: any[] = [];
      if (orderIds.length > 0) {
        const { data: instData } = await ctx.supa
          .from("order_instalments")
          .select("*, order:orders(number, total)")
          .eq("tenant_id", ctx.tenant.id)
          .in("order_id", orderIds)
          .eq("paid", false)
          .order("due_date", { ascending: true });
        pendingInstalments = instData ?? [];
      }

      return {
        customer:           customerRes.data,
        orders:             ordersRes.data ?? [],
        pendingInstalments,
        accountHistory:     historyRes.data ?? [],
      };
    }),

  // ─── Inventory valuation ──────────────────────────────────────────────────
  inventoryValuation: tenantProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supa
      .from("products")
      .select("id, name, stock, cost_price, price")
      .eq("tenant_id", ctx.tenant.id)
      .eq("is_active", true)
      .eq("track_stock", true);

    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });

    const products = (data ?? []).map(p => ({
      id:           p.id,
      name:         p.name,
      stock:        Number(p.stock ?? 0),
      costPrice:    Number(p.cost_price ?? 0),
      salePrice:    Number(p.price ?? 0),
      totalCost:    Number(p.stock ?? 0) * Number(p.cost_price ?? 0),
      totalRetail:  Number(p.stock ?? 0) * Number(p.price ?? 0),
    }));

    const totalCostValue   = products.reduce((s, p) => s + p.totalCost, 0);
    const totalRetailValue = products.reduce((s, p) => s + p.totalRetail, 0);

    return { products, totalCostValue, totalRetailValue };
  }),

  // ─── Monthly summary (for dashboard charts) ───────────────────────────────
  monthlySummary: tenantProcedure
    .input(z.object({ months: z.number().default(6) }))
    .query(async ({ ctx, input }) => {
      const from = new Date();
      from.setMonth(from.getMonth() - input.months + 1);
      from.setDate(1);

      const { data, error } = await ctx.supa
        .from("orders")
        .select("total, created_at, payment_status")
        .eq("tenant_id", ctx.tenant.id)
        .neq("payment_status", "void")
        .gte("created_at", from.toISOString());

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });

      const byMonth: Record<string, number> = {};
      for (const order of (data ?? [])) {
        const key = order.created_at.slice(0, 7); // "YYYY-MM"
        byMonth[key] = (byMonth[key] ?? 0) + Number(order.total);
      }

      return Object.entries(byMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, revenue]) => ({ month, revenue }));
    }),
});
