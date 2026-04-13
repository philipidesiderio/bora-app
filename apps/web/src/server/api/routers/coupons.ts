import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, tenantProcedure } from "../trpc";

export const couponsRouter = createTRPCRouter({

  list: tenantProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supa
      .from("coupons")
      .select("*")
      .eq("tenant_id", ctx.tenant.id)
      .order("created_at", { ascending: false });
    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
    return data ?? [];
  }),

  create: tenantProcedure
    .input(z.object({
      code:         z.string().min(1).transform(v => v.toUpperCase()),
      name:         z.string().optional(),
      type:         z.enum(["flat", "percent"]).default("flat"),
      value:        z.number().positive(),
      minCartValue: z.number().min(0).default(0),
      maxUses:      z.number().int().positive().optional(),
      validUntil:   z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check for duplicate code within tenant
      const { data: existing } = await ctx.supa
        .from("coupons")
        .select("id")
        .eq("tenant_id", ctx.tenant.id)
        .eq("code", input.code)
        .single();
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Já existe um cupom com este código." });

      const { data, error } = await ctx.supa
        .from("coupons")
        .insert({
          tenant_id:      ctx.tenant.id,
          code:           input.code,
          name:           input.name ?? null,
          type:           input.type,
          value:          input.value,
          min_cart_value: input.minCartValue,
          max_uses:       input.maxUses ?? null,
          valid_until:    input.validUntil ?? null,
          active:         true,
        })
        .select()
        .single();
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return data;
    }),

  update: tenantProcedure
    .input(z.object({
      id:           z.string(),
      name:         z.string().optional(),
      value:        z.number().positive().optional(),
      minCartValue: z.number().min(0).optional(),
      maxUses:      z.number().int().positive().nullable().optional(),
      validUntil:   z.string().nullable().optional(),
      active:       z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, minCartValue, maxUses, validUntil, ...rest } = input;
      const { data, error } = await ctx.supa
        .from("coupons")
        .update({
          ...rest,
          min_cart_value: minCartValue,
          max_uses:       maxUses,
          valid_until:    validUntil,
        })
        .eq("id", id)
        .eq("tenant_id", ctx.tenant.id)
        .select()
        .single();
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return data;
    }),

  delete: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.supa.from("coupons").delete().eq("id", input.id).eq("tenant_id", ctx.tenant.id);
      return { ok: true };
    }),

  validate: tenantProcedure
    .input(z.object({
      code:      z.string(),
      cartTotal: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const { data: coupon } = await ctx.supa
        .from("coupons")
        .select("*")
        .eq("tenant_id", ctx.tenant.id)
        .eq("code", input.code.toUpperCase())
        .eq("active", true)
        .single();

      if (!coupon) return { valid: false, error: "Cupom inválido ou inativo." };
      if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
        return { valid: false, error: "Cupom expirado." };
      }
      if (coupon.max_uses !== null && coupon.uses_count >= coupon.max_uses) {
        return { valid: false, error: "Cupom esgotado." };
      }
      if (input.cartTotal < Number(coupon.min_cart_value ?? 0)) {
        return { valid: false, error: `Valor mínimo: R$ ${Number(coupon.min_cart_value).toFixed(2)}` };
      }

      const discountAmount = coupon.type === "percent"
        ? (input.cartTotal * Number(coupon.value)) / 100
        : Number(coupon.value);

      return {
        valid:          true,
        discountAmount: Math.min(discountAmount, input.cartTotal),
        coupon,
      };
    }),
});
