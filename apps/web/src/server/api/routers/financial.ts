import { z } from "zod";
import { createTRPCRouter, tenantProcedure } from "../trpc";

export const financialRouter = createTRPCRouter({
  listTransactions: tenantProcedure
    .input(z.object({
      type:     z.enum(["income", "expense"]).optional(),
      status:   z.enum(["pending", "paid", "overdue", "cancelled"]).optional(),
      category: z.enum(["sales", "purchase", "salary", "tax", "other"]).optional(),
      dateFrom: z.string().optional(),
      dateTo:   z.string().optional(),
      page:     z.number().default(1),
      limit:    z.number().default(30),
    }))
    .query(async ({ ctx, input }) => {
      let query = ctx.supa
        .from("transactions")
        .select("*")
        .eq("tenant_id", ctx.tenant.id)
        .order("created_at", { ascending: false })
        .range(
          (input.page - 1) * input.limit,
          input.page * input.limit - 1,
        );

      if (input.type)     query = query.eq("type", input.type);
      if (input.status)   query = query.eq("status", input.status);
      if (input.category) query = query.eq("category", input.category);
      if (input.dateFrom) query = query.gte("created_at", input.dateFrom);
      if (input.dateTo)   query = query.lte("created_at", input.dateTo);

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data ?? [];
    }),

  createTransaction: tenantProcedure
    .input(z.object({
      type:        z.enum(["income", "expense"]),
      category:    z.enum(["sales", "purchase", "salary", "tax", "other"]).default("other"),
      description: z.string().min(1, "Descrição é obrigatória"),
      amount:      z.number().positive("Valor deve ser positivo"),
      dueDate:     z.string().optional(),
      notes:       z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const transactionId = crypto.randomUUID();
      const { data, error } = await ctx.supa
        .from("transactions")
        .insert({
          id:          transactionId,
          tenant_id:   ctx.tenant.id,
          type:        input.type,
          category:    input.category,
          description: input.description,
          amount:      input.amount,
          due_date:    input.dueDate ?? null,
          notes:       input.notes ?? null,
          status:      "pending",
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }),

  markPaid: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supa
        .from("transactions")
        .update({
          status:     "paid",
          paid_at:    new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.id)
        .eq("tenant_id", ctx.tenant.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }),

  getMonthlySummary: tenantProcedure
    .input(z.object({ year: z.number(), month: z.number() }))
    .query(async ({ ctx, input }) => {
      const start = new Date(input.year, input.month - 1, 1).toISOString();
      const end   = new Date(input.year, input.month, 1).toISOString();

      const { data, error } = await ctx.supa
        .from("transactions")
        .select("type, amount")
        .eq("tenant_id", ctx.tenant.id)
        .gte("created_at", start)
        .lt("created_at", end);

      if (error) throw new Error(error.message);

      const rows = data ?? [];
      const income  = rows.filter(r => r.type === "income").reduce((s, r) => s + Number(r.amount), 0);
      const expense = rows.filter(r => r.type === "expense").reduce((s, r) => s + Number(r.amount), 0);

      return { income, expense, balance: income - expense };
    }),

  getCurrentSession: tenantProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supa
      .from("cash_sessions")
      .select("*")
      .eq("tenant_id", ctx.tenant.id)
      .eq("status", "open")
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data ?? null;
  }),

  openCashSession: tenantProcedure
    .input(z.object({ openingBalance: z.number().default(0) }))
    .mutation(async ({ ctx, input }) => {
      const { data: existing, error: checkError } = await ctx.supa
        .from("cash_sessions")
        .select("id")
        .eq("tenant_id", ctx.tenant.id)
        .eq("status", "open")
        .limit(1)
        .maybeSingle();

      if (checkError) throw new Error(checkError.message);
      if (existing) throw new Error("Já existe um caixa aberto");

      const sessionId = crypto.randomUUID();
      const { data, error } = await ctx.supa
        .from("cash_sessions")
        .insert({
          id:              sessionId,
          tenant_id:       ctx.tenant.id,
          opened_by:       ctx.session.user.id,
          status:          "open",
          opening_balance: input.openingBalance,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }),

  closeCashSession: tenantProcedure
    .input(z.object({ closingBalance: z.number().default(0), notes: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { data: session, error: fetchError } = await ctx.supa
        .from("cash_sessions")
        .select("id")
        .eq("tenant_id", ctx.tenant.id)
        .eq("status", "open")
        .limit(1)
        .maybeSingle();

      if (fetchError) throw new Error(fetchError.message);
      if (!session)   throw new Error("Nenhum caixa aberto");

      const { data, error } = await ctx.supa
        .from("cash_sessions")
        .update({
          status:          "closed",
          closing_balance: input.closingBalance,
          notes:           input.notes ?? null,
          closed_at:       new Date().toISOString(),
        })
        .eq("id", session.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }),
});
