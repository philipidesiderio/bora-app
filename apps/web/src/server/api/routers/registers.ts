import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, tenantProcedure } from "../trpc";

export const registersRouter = createTRPCRouter({

  list: tenantProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supa
      .from("registers")
      .select("*")
      .eq("tenant_id", ctx.tenant.id)
      .order("created_at", { ascending: true });
    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
    return data ?? [];
  }),

  create: tenantProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supa
        .from("registers")
        .insert({ tenant_id: ctx.tenant.id, name: input.name })
        .select()
        .single();
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return data;
    }),

  open: tenantProcedure
    .input(z.object({
      registerId:     z.string(),
      openingAmount:  z.number().min(0),
    }))
    .mutation(async ({ ctx, input }) => {
      const { data: reg } = await ctx.supa
        .from("registers")
        .select("*")
        .eq("id", input.registerId)
        .eq("tenant_id", ctx.tenant.id)
        .single();
      if (!reg) throw new TRPCError({ code: "NOT_FOUND" });
      if (reg.status === "opened") throw new TRPCError({ code: "BAD_REQUEST", message: "Caixa já está aberto." });

      await ctx.supa.from("registers").update({
        status:     "opened",
        balance:    input.openingAmount,
        used_by:    ctx.session.user.id,
        updated_at: new Date().toISOString(),
      }).eq("id", input.registerId);

      await ctx.supa.from("register_history").insert({
        tenant_id:        ctx.tenant.id,
        register_id:      input.registerId,
        action:           "opening",
        value:            input.openingAmount,
        balance_before:   0,
        balance_after:    input.openingAmount,
        transaction_type: "positive",
        description:      "Abertura de caixa",
        author_id:        ctx.session.user.id,
      });

      return { ok: true };
    }),

  close: tenantProcedure
    .input(z.object({
      registerId:    z.string(),
      countedAmount: z.number().min(0),
    }))
    .mutation(async ({ ctx, input }) => {
      const { data: reg } = await ctx.supa
        .from("registers")
        .select("*")
        .eq("id", input.registerId)
        .eq("tenant_id", ctx.tenant.id)
        .single();
      if (!reg) throw new TRPCError({ code: "NOT_FOUND" });
      if (reg.status !== "opened") throw new TRPCError({ code: "BAD_REQUEST", message: "Caixa não está aberto." });

      const balanceBefore = Number(reg.balance);
      const variance      = input.countedAmount - balanceBefore;
      const txType        = variance === 0 ? "unchanged" : variance > 0 ? "positive" : "negative";

      await ctx.supa.from("register_history").insert({
        tenant_id:        ctx.tenant.id,
        register_id:      input.registerId,
        action:           "closing",
        value:            input.countedAmount,
        balance_before:   balanceBefore,
        balance_after:    0,
        transaction_type: txType,
        description:      `Fechamento — contado: R$ ${input.countedAmount.toFixed(2)}, variação: R$ ${variance.toFixed(2)}`,
        author_id:        ctx.session.user.id,
      });

      await ctx.supa.from("registers").update({
        status:     "closed",
        balance:    0,
        used_by:    null,
        updated_at: new Date().toISOString(),
      }).eq("id", input.registerId);

      return { ok: true, variance };
    }),

  cashIn: tenantProcedure
    .input(z.object({
      registerId:  z.string(),
      amount:      z.number().positive(),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { data: reg } = await ctx.supa
        .from("registers")
        .select("*")
        .eq("id", input.registerId)
        .eq("tenant_id", ctx.tenant.id)
        .single();
      if (!reg) throw new TRPCError({ code: "NOT_FOUND" });
      if (reg.status !== "opened") throw new TRPCError({ code: "BAD_REQUEST", message: "Caixa não está aberto." });

      const balanceBefore = Number(reg.balance);
      const balanceAfter  = balanceBefore + input.amount;

      await ctx.supa.from("registers").update({ balance: balanceAfter, updated_at: new Date().toISOString() }).eq("id", input.registerId);
      await ctx.supa.from("register_history").insert({
        tenant_id:        ctx.tenant.id,
        register_id:      input.registerId,
        action:           "cash-in",
        value:            input.amount,
        balance_before:   balanceBefore,
        balance_after:    balanceAfter,
        transaction_type: "positive",
        description:      input.description ?? "Entrada de caixa",
        author_id:        ctx.session.user.id,
      });

      return { ok: true, balance: balanceAfter };
    }),

  cashOut: tenantProcedure
    .input(z.object({
      registerId:  z.string(),
      amount:      z.number().positive(),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { data: reg } = await ctx.supa
        .from("registers")
        .select("*")
        .eq("id", input.registerId)
        .eq("tenant_id", ctx.tenant.id)
        .single();
      if (!reg) throw new TRPCError({ code: "NOT_FOUND" });
      if (reg.status !== "opened") throw new TRPCError({ code: "BAD_REQUEST", message: "Caixa não está aberto." });

      const balanceBefore = Number(reg.balance);
      if (input.amount > balanceBefore) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Saldo insuficiente no caixa." });
      }
      const balanceAfter = balanceBefore - input.amount;

      await ctx.supa.from("registers").update({ balance: balanceAfter, updated_at: new Date().toISOString() }).eq("id", input.registerId);
      await ctx.supa.from("register_history").insert({
        tenant_id:        ctx.tenant.id,
        register_id:      input.registerId,
        action:           "cash-out",
        value:            input.amount,
        balance_before:   balanceBefore,
        balance_after:    balanceAfter,
        transaction_type: "negative",
        description:      input.description ?? "Saída de caixa",
        author_id:        ctx.session.user.id,
      });

      return { ok: true, balance: balanceAfter };
    }),

  getHistory: tenantProcedure
    .input(z.object({
      registerId: z.string(),
      dateFrom:   z.string().optional(),
      dateTo:     z.string().optional(),
      limit:      z.number().default(50),
    }))
    .query(async ({ ctx, input }) => {
      let query = ctx.supa
        .from("register_history")
        .select("*")
        .eq("register_id", input.registerId)
        .eq("tenant_id", ctx.tenant.id)
        .order("created_at", { ascending: false })
        .limit(input.limit);
      if (input.dateFrom) query = query.gte("created_at", input.dateFrom);
      if (input.dateTo)   query = query.lte("created_at", input.dateTo);
      const { data, error } = await query;
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return data ?? [];
    }),

  getZReport: tenantProcedure
    .input(z.object({
      registerId: z.string(),
      dateFrom:   z.string().optional(),
      dateTo:     z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      let query = ctx.supa
        .from("register_history")
        .select("*")
        .eq("register_id", input.registerId)
        .eq("tenant_id", ctx.tenant.id)
        .order("created_at", { ascending: true });
      if (input.dateFrom) query = query.gte("created_at", input.dateFrom);
      if (input.dateTo)   query = query.lte("created_at", input.dateTo);

      const { data: history } = await query;
      const rows = history ?? [];

      const opening    = rows.find(r => r.action === "opening");
      const closing    = rows.find(r => r.action === "closing");
      const cashIns    = rows.filter(r => r.action === "cash-in").reduce((s, r) => s + Number(r.value), 0);
      const cashOuts   = rows.filter(r => r.action === "cash-out").reduce((s, r) => s + Number(r.value), 0);
      const payments   = rows.filter(r => r.action === "order-payment").reduce((s, r) => s + Number(r.value), 0);
      const refunds    = rows.filter(r => r.action === "refund").reduce((s, r) => s + Number(r.value), 0);
      const openAmount = Number(opening?.value ?? 0);
      const expected   = openAmount + cashIns + payments - cashOuts - refunds;
      const counted    = closing ? Number(closing.value) : null;
      const variance   = counted !== null ? counted - expected : null;

      return {
        openingAmount: openAmount,
        cashIns,
        cashOuts,
        salesTotal:    payments,
        refundsTotal:  refunds,
        expectedBalance: expected,
        countedAmount:   counted,
        variance,
        transactionType: closing?.transaction_type ?? null,
        history: rows,
      };
    }),
});
