import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, tenantProcedure } from "../trpc";

const customerInput = z.object({
  name:        z.string().min(1, "Nome é obrigatório"),
  phone:       z.string().optional(),
  email:       z.string().optional(),
  cpf:         z.string().optional(),
  address:     z.string().optional(),
  creditLimit: z.number().default(0),
  notes:       z.string().optional(),
});

export const customersRouter = createTRPCRouter({
  list: tenantProcedure
    .input(z.object({
      search: z.string().optional(),
      page:   z.number().default(1),
      limit:  z.number().default(30),
    }))
    .query(async ({ ctx, input }) => {
      let query = ctx.supa
        .from("customers")
        .select("*")
        .eq("tenant_id", ctx.tenant.id)
        .order("created_at", { ascending: false })
        .range(
          (input.page - 1) * input.limit,
          input.page * input.limit - 1,
        );

      if (input.search) {
        query = query.or(
          `name.ilike.%${input.search}%,phone.ilike.%${input.search}%`,
        );
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data ?? [];
    }),

  create: tenantProcedure
    .input(customerInput)
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supa
        .from("customers")
        .insert({
          tenant_id:    ctx.tenant.id,
          name:         input.name,
          phone:        input.phone ?? null,
          email:        input.email ?? null,
          cpf:          input.cpf ?? null,
          address:      input.address ?? null,
          credit_limit: input.creditLimit,
          notes:        input.notes ?? null,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }),

  update: tenantProcedure
    .input(customerInput.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input;

      const { data, error } = await ctx.supa
        .from("customers")
        .update({
          name:         rest.name,
          phone:        rest.phone ?? null,
          email:        rest.email ?? null,
          cpf:          rest.cpf ?? null,
          address:      rest.address ?? null,
          credit_limit: rest.creditLimit,
          notes:        rest.notes ?? null,
          updated_at:   new Date().toISOString(),
        })
        .eq("id", id)
        .eq("tenant_id", ctx.tenant.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }),

  delete: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supa
        .from("customers")
        .delete()
        .eq("id", input.id)
        .eq("tenant_id", ctx.tenant.id);

      if (error) throw new Error(error.message);
      return { success: true };
    }),

  addCredit: tenantProcedure
    .input(z.object({
      customerId:  z.string(),
      amount:      z.number().positive("Valor deve ser positivo"),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { data: customer, error: fetchError } = await ctx.supa
        .from("customers")
        .select("credit_balance, credit_limit")
        .eq("id", input.customerId)
        .eq("tenant_id", ctx.tenant.id)
        .single();

      if (fetchError || !customer) throw new Error("Cliente não encontrado");

      const newBalance = Number(customer.credit_balance ?? 0) + input.amount;
      const limit      = Number(customer.credit_limit ?? 0);

      if (limit > 0 && newBalance > limit) {
        throw new Error(`Limite de crédito (R$${limit.toFixed(2)}) excedido`);
      }

      const { data, error } = await ctx.supa
        .from("customers")
        .update({
          credit_balance: newBalance,
          updated_at:     new Date().toISOString(),
        })
        .eq("id", input.customerId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }),

  payCredit: tenantProcedure
    .input(z.object({
      customerId: z.string(),
      amount:     z.number().positive("Valor deve ser positivo"),
    }))
    .mutation(async ({ ctx, input }) => {
      const { data: customer, error: fetchError } = await ctx.supa
        .from("customers")
        .select("credit_balance")
        .eq("id", input.customerId)
        .eq("tenant_id", ctx.tenant.id)
        .single();

      if (fetchError || !customer) throw new Error("Cliente não encontrado");

      const newBalance = Math.max(0, Number(customer.credit_balance ?? 0) - input.amount);

      const { data, error } = await ctx.supa
        .from("customers")
        .update({
          credit_balance: newBalance,
          updated_at:     new Date().toISOString(),
        })
        .eq("id", input.customerId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }),

  // ─── NexoPOS engine additions ───────────────────────────────────────────

  getStatement: tenantProcedure
    .input(z.object({ customerId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [customerRes, ordersRes, instalmentsRes, historyRes] = await Promise.all([
        ctx.supa.from("customers").select("*").eq("id", input.customerId).eq("tenant_id", ctx.tenant.id).single(),
        ctx.supa.from("orders").select("id, number, total, payment_status, created_at")
          .eq("tenant_id", ctx.tenant.id).eq("customer_id", input.customerId)
          .order("created_at", { ascending: false }).limit(50),
        ctx.supa.from("order_instalments")
          .select("*, order:orders(number, total, created_at)")
          .eq("tenant_id", ctx.tenant.id)
          .eq("paid", false)
          .order("created_at", { ascending: true }),
        ctx.supa.from("customer_account_history")
          .select("*")
          .eq("tenant_id", ctx.tenant.id)
          .eq("customer_id", input.customerId)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      if (!customerRes.data) throw new TRPCError({ code: "NOT_FOUND" });

      // filter instalments belonging to this customer
      const pendingInstalments = (instalmentsRes.data ?? []).filter((i: any) =>
        (ordersRes.data ?? []).some((o: any) => o.id === i.order_id)
      );

      return {
        customer:           customerRes.data,
        orders:             ordersRes.data ?? [],
        pendingInstalments,
        accountHistory:     historyRes.data ?? [],
        totalDebt:          pendingInstalments.reduce((s: number, i: any) => s + Number(i.amount), 0),
      };
    }),

  creditAccount: tenantProcedure
    .input(z.object({
      customerId:  z.string(),
      amount:      z.number().positive(),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { data: customer } = await ctx.supa
        .from("customers").select("credit_balance").eq("id", input.customerId).eq("tenant_id", ctx.tenant.id).single();
      if (!customer) throw new TRPCError({ code: "NOT_FOUND" });
      const balanceBefore = Number(customer.credit_balance ?? 0);
      const balanceAfter  = balanceBefore + input.amount;
      await ctx.supa.from("customers").update({ credit_balance: balanceAfter, updated_at: new Date().toISOString() }).eq("id", input.customerId);
      await ctx.supa.from("customer_account_history").insert({
        tenant_id: ctx.tenant.id, customer_id: input.customerId,
        operation: "add", amount: input.amount,
        balance_before: balanceBefore, balance_after: balanceAfter,
        description: input.description ?? "Crédito adicionado",
      });
      return { ok: true, balance: balanceAfter };
    }),

  debitAccount: tenantProcedure
    .input(z.object({
      customerId:  z.string(),
      amount:      z.number().positive(),
      orderId:     z.string().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { data: customer } = await ctx.supa
        .from("customers").select("credit_balance").eq("id", input.customerId).eq("tenant_id", ctx.tenant.id).single();
      if (!customer) throw new TRPCError({ code: "NOT_FOUND" });
      const balanceBefore = Number(customer.credit_balance ?? 0);
      const balanceAfter  = Math.max(0, balanceBefore - input.amount);
      await ctx.supa.from("customers").update({ credit_balance: balanceAfter, updated_at: new Date().toISOString() }).eq("id", input.customerId);
      await ctx.supa.from("customer_account_history").insert({
        tenant_id: ctx.tenant.id, customer_id: input.customerId, order_id: input.orderId ?? null,
        operation: "sub", amount: input.amount,
        balance_before: balanceBefore, balance_after: balanceAfter,
        description: input.description ?? "Débito na conta",
      });
      return { ok: true, balance: balanceAfter };
    }),

  listInstalments: tenantProcedure
    .input(z.object({ customerId: z.string() }))
    .query(async ({ ctx, input }) => {
      // get unpaid instalments for orders belonging to this customer
      const { data: orders } = await ctx.supa
        .from("orders").select("id").eq("tenant_id", ctx.tenant.id).eq("customer_id", input.customerId);
      if (!orders?.length) return [];
      const orderIds = orders.map((o: any) => o.id);
      const { data, error } = await ctx.supa
        .from("order_instalments")
        .select("*, order:orders(number, total, created_at)")
        .eq("tenant_id", ctx.tenant.id)
        .in("order_id", orderIds)
        .eq("paid", false)
        .order("due_date", { ascending: true });
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return data ?? [];
    }),
});
