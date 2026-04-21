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

  // ─── Consulta de vendas (lista de pedidos do período) ────────────────────
  salesList: tenantProcedure
    .input(dateRangeInput)
    .query(async ({ ctx, input }) => {
      let q = ctx.supa
        .from("orders")
        .select("id, number, total, subtotal, discount, payment_method, payment_status, status, channel, customer_id, created_at")
        .eq("tenant_id", ctx.tenant.id)
        .order("created_at", { ascending: false })
        .limit(200);
      if (input.dateFrom) q = q.gte("created_at", input.dateFrom);
      if (input.dateTo)   q = q.lte("created_at", input.dateTo);
      const { data, error } = await q;
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      const rows = data ?? [];
      const ids = [...new Set(rows.map((o: any) => o.customer_id).filter(Boolean))] as string[];
      let cmap: Record<string, string> = {};
      if (ids.length) {
        const { data: cs } = await ctx.supa
          .from("customers").select("id, name").in("id", ids).eq("tenant_id", ctx.tenant.id);
        cmap = Object.fromEntries((cs ?? []).map((c: any) => [c.id, c.name]));
      }
      return rows.map((o: any) => ({ ...o, customerName: o.customer_id ? cmap[o.customer_id] ?? null : null }));
    }),

  // ─── Top produtos/serviços filtrado por tipo ─────────────────────────────
  topItems: tenantProcedure
    .input(z.object({
      ...dateRangeInput.shape,
      kind:  z.enum(["all", "product", "service"]).default("all"),
      limit: z.number().default(20),
    }))
    .query(async ({ ctx, input }) => {
      let ordersQ = ctx.supa.from("orders").select("id").eq("tenant_id", ctx.tenant.id).neq("payment_status", "void");
      if (input.dateFrom) ordersQ = ordersQ.gte("created_at", input.dateFrom);
      if (input.dateTo)   ordersQ = ordersQ.lte("created_at", input.dateTo);
      const { data: validOrders } = await ordersQ;
      if (!validOrders?.length) return [];
      const orderIds = validOrders.map((o: any) => o.id);

      const { data: items, error } = await ctx.supa
        .from("order_items")
        .select("product_id, name, quantity, unit_price, cost_price, total")
        .in("order_id", orderIds);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });

      // Tipo do produto (product/service) via join manual
      let typeMap: Record<string, string> = {};
      const pids = [...new Set((items ?? []).map((i: any) => i.product_id).filter(Boolean))] as string[];
      if (pids.length) {
        const { data: prods } = await ctx.supa
          .from("products").select("id, type").in("id", pids).eq("tenant_id", ctx.tenant.id);
        typeMap = Object.fromEntries((prods ?? []).map((p: any) => [p.id, p.type ?? "product"]));
      }

      const bucket: Record<string, { name: string; revenue: number; quantity: number; profit: number; type: string }> = {};
      for (const it of items ?? []) {
        const pid = (it as any).product_id;
        const ptype = (pid && typeMap[pid]) || "product";
        if (input.kind !== "all" && ptype !== input.kind) continue;
        const key = pid ?? (it as any).name;
        if (!bucket[key]) bucket[key] = { name: (it as any).name, revenue: 0, quantity: 0, profit: 0, type: ptype };
        bucket[key].revenue  += Number((it as any).total ?? 0);
        bucket[key].quantity += Number((it as any).quantity ?? 0);
        bucket[key].profit   += (Number((it as any).unit_price) - Number((it as any).cost_price ?? 0)) * Number((it as any).quantity);
      }
      return Object.values(bucket).sort((a, b) => b.revenue - a.revenue).slice(0, input.limit);
    }),

  // ─── Vendas por vendedor ─────────────────────────────────────────────────
  salesBySeller: tenantProcedure
    .input(dateRangeInput)
    .query(async ({ ctx, input }) => {
      let q = ctx.supa
        .from("orders")
        .select("seller_id, total")
        .eq("tenant_id", ctx.tenant.id)
        .neq("payment_status", "void");
      if (input.dateFrom) q = q.gte("created_at", input.dateFrom);
      if (input.dateTo)   q = q.lte("created_at", input.dateTo);
      const { data, error } = await q;
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });

      const bucket: Record<string, { total: number; count: number }> = {};
      for (const o of data ?? []) {
        const sid = (o as any).seller_id ?? "—";
        if (!bucket[sid]) bucket[sid] = { total: 0, count: 0 };
        bucket[sid].total += Number((o as any).total ?? 0);
        bucket[sid].count += 1;
      }
      const sellerIds = Object.keys(bucket).filter(k => k !== "—");
      let names: Record<string, string> = {};
      if (sellerIds.length) {
        const { data: users } = await ctx.supa.from("users").select("id, name").in("id", sellerIds);
        names = Object.fromEntries((users ?? []).map((u: any) => [u.id, u.name]));
      }
      return Object.entries(bucket)
        .map(([id, v]) => ({ sellerId: id, name: id === "—" ? "Sem vendedor" : (names[id] ?? "—"), total: v.total, count: v.count }))
        .sort((a, b) => b.total - a.total);
    }),

  // ─── Vendas por categoria ────────────────────────────────────────────────
  salesByCategory: tenantProcedure
    .input(dateRangeInput)
    .query(async ({ ctx, input }) => {
      let ordersQ = ctx.supa.from("orders").select("id").eq("tenant_id", ctx.tenant.id).neq("payment_status", "void");
      if (input.dateFrom) ordersQ = ordersQ.gte("created_at", input.dateFrom);
      if (input.dateTo)   ordersQ = ordersQ.lte("created_at", input.dateTo);
      const { data: ords } = await ordersQ;
      if (!ords?.length) return [];
      const orderIds = ords.map((o: any) => o.id);

      const { data: items } = await ctx.supa
        .from("order_items").select("product_id, total, quantity").in("order_id", orderIds);

      const pids = [...new Set((items ?? []).map((i: any) => i.product_id).filter(Boolean))] as string[];
      let catMap: Record<string, string | null> = {};
      if (pids.length) {
        const { data: prods } = await ctx.supa
          .from("products").select("id, category_id").in("id", pids).eq("tenant_id", ctx.tenant.id);
        catMap = Object.fromEntries((prods ?? []).map((p: any) => [p.id, p.category_id]));
      }
      const catIds = [...new Set(Object.values(catMap).filter(Boolean))] as string[];
      let catNames: Record<string, { name: string; emoji: string | null }> = {};
      if (catIds.length) {
        const { data: cats } = await ctx.supa
          .from("categories").select("id, name, emoji").in("id", catIds).eq("tenant_id", ctx.tenant.id);
        catNames = Object.fromEntries((cats ?? []).map((c: any) => [c.id, { name: c.name, emoji: c.emoji }]));
      }
      const bucket: Record<string, { name: string; emoji: string | null; revenue: number; quantity: number }> = {};
      for (const it of items ?? []) {
        const catId = (it as any).product_id ? catMap[(it as any).product_id] : null;
        const key = catId || "_sem";
        const info = catId ? catNames[catId] : null;
        if (!bucket[key]) bucket[key] = { name: info?.name ?? "Sem categoria", emoji: info?.emoji ?? null, revenue: 0, quantity: 0 };
        bucket[key].revenue  += Number((it as any).total ?? 0);
        bucket[key].quantity += Number((it as any).quantity ?? 0);
      }
      return Object.values(bucket).sort((a, b) => b.revenue - a.revenue);
    }),

  // ─── Vendas por cliente ──────────────────────────────────────────────────
  salesByCustomer: tenantProcedure
    .input(dateRangeInput)
    .query(async ({ ctx, input }) => {
      let q = ctx.supa
        .from("orders")
        .select("customer_id, total")
        .eq("tenant_id", ctx.tenant.id)
        .neq("payment_status", "void");
      if (input.dateFrom) q = q.gte("created_at", input.dateFrom);
      if (input.dateTo)   q = q.lte("created_at", input.dateTo);
      const { data } = await q;
      const bucket: Record<string, { total: number; count: number }> = {};
      for (const o of data ?? []) {
        const cid = (o as any).customer_id ?? "—";
        if (!bucket[cid]) bucket[cid] = { total: 0, count: 0 };
        bucket[cid].total += Number((o as any).total ?? 0);
        bucket[cid].count += 1;
      }
      const ids = Object.keys(bucket).filter(k => k !== "—");
      let names: Record<string, { name: string; phone: string | null }> = {};
      if (ids.length) {
        const { data: cs } = await ctx.supa
          .from("customers").select("id, name, phone").in("id", ids).eq("tenant_id", ctx.tenant.id);
        names = Object.fromEntries((cs ?? []).map((c: any) => [c.id, { name: c.name, phone: c.phone }]));
      }
      return Object.entries(bucket)
        .map(([id, v]) => ({
          customerId: id,
          name: id === "—" ? "Venda sem cliente" : (names[id]?.name ?? "—"),
          phone: id === "—" ? null : (names[id]?.phone ?? null),
          total: v.total,
          count: v.count,
        }))
        .sort((a, b) => b.total - a.total);
    }),

  // ─── Devoluções ──────────────────────────────────────────────────────────
  refundsList: tenantProcedure
    .input(dateRangeInput)
    .query(async ({ ctx, input }) => {
      let q = ctx.supa
        .from("order_refunds")
        .select("id, order_id, total_amount, reason, created_at")
        .eq("tenant_id", ctx.tenant.id)
        .order("created_at", { ascending: false })
        .limit(200);
      if (input.dateFrom) q = q.gte("created_at", input.dateFrom);
      if (input.dateTo)   q = q.lte("created_at", input.dateTo);
      const { data, error } = await q;
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      const ids = [...new Set((data ?? []).map((r: any) => r.order_id))] as string[];
      let num: Record<string, number> = {};
      if (ids.length) {
        const { data: ords } = await ctx.supa.from("orders").select("id, number").in("id", ids).eq("tenant_id", ctx.tenant.id);
        num = Object.fromEntries((ords ?? []).map((o: any) => [o.id, o.number]));
      }
      const rows = (data ?? []).map((r: any) => ({ ...r, orderNumber: num[r.order_id] ?? null }));
      const total = rows.reduce((s, r) => s + Number(r.total_amount ?? 0), 0);
      return { rows, total };
    }),

  // ─── Consulta de caixa (histórico de aberturas/fechamentos) ─────────────
  registersList: tenantProcedure
    .input(dateRangeInput)
    .query(async ({ ctx, input }) => {
      let q = ctx.supa
        .from("registers")
        .select("id, name, status, balance, opened_at, closed_at, expected_balance, variance")
        .eq("tenant_id", ctx.tenant.id)
        .order("opened_at", { ascending: false })
        .limit(100);
      if (input.dateFrom) q = q.gte("opened_at", input.dateFrom);
      if (input.dateTo)   q = q.lte("opened_at", input.dateTo);
      const { data, error } = await q;
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return data ?? [];
    }),

  // ─── Entradas e saídas do caixa ──────────────────────────────────────────
  cashInOut: tenantProcedure
    .input(dateRangeInput)
    .query(async ({ ctx, input }) => {
      let q = ctx.supa
        .from("register_history")
        .select("id, register_id, action, value, description, transaction_type, created_at")
        .eq("tenant_id", ctx.tenant.id)
        .in("action", ["cash-in", "cash-out"])
        .order("created_at", { ascending: false })
        .limit(200);
      if (input.dateFrom) q = q.gte("created_at", input.dateFrom);
      if (input.dateTo)   q = q.lte("created_at", input.dateTo);
      const { data, error } = await q;
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      const rows = data ?? [];
      const totalIn  = rows.filter((r: any) => r.action === "cash-in") .reduce((s: number, r: any) => s + Number(r.value ?? 0), 0);
      const totalOut = rows.filter((r: any) => r.action === "cash-out").reduce((s: number, r: any) => s + Number(r.value ?? 0), 0);
      return { rows, totalIn, totalOut };
    }),

  // ─── Movimentações de estoque ────────────────────────────────────────────
  stockMovements: tenantProcedure
    .input(dateRangeInput)
    .query(async ({ ctx, input }) => {
      let q = ctx.supa
        .from("inventory_movements")
        .select("id, product_id, type, quantity, before, after, reason, created_at")
        .eq("tenant_id", ctx.tenant.id)
        .order("created_at", { ascending: false })
        .limit(300);
      if (input.dateFrom) q = q.gte("created_at", input.dateFrom);
      if (input.dateTo)   q = q.lte("created_at", input.dateTo);
      const { data, error } = await q;
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      const ids = [...new Set((data ?? []).map((r: any) => r.product_id))] as string[];
      let pmap: Record<string, string> = {};
      if (ids.length) {
        const { data: ps } = await ctx.supa.from("products").select("id, name").in("id", ids).eq("tenant_id", ctx.tenant.id);
        pmap = Object.fromEntries((ps ?? []).map((p: any) => [p.id, p.name]));
      }
      return (data ?? []).map((r: any) => ({ ...r, productName: pmap[r.product_id] ?? "—" }));
    }),

  // ─── Aniversariantes (mês específico) ────────────────────────────────────
  birthdays: tenantProcedure
    .input(z.object({ month: z.number().min(1).max(12).optional() }))
    .query(async ({ ctx, input }) => {
      const m = input.month ?? (new Date().getMonth() + 1);
      const { data, error } = await ctx.supa
        .from("customers")
        .select("id, name, phone, birthday")
        .eq("tenant_id", ctx.tenant.id)
        .not("birthday", "is", null);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      const rows = (data ?? [])
        .map((c: any) => {
          const d = c.birthday ? new Date(c.birthday + "T00:00:00") : null;
          return d ? { ...c, month: d.getMonth() + 1, day: d.getDate() } : null;
        })
        .filter((c: any) => c && c.month === m)
        .sort((a: any, b: any) => a.day - b.day);
      return { month: m, rows };
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
