import { z } from "zod";
import { createTRPCRouter, tenantProcedure } from "../trpc";

export const inventoryRouter = createTRPCRouter({
  list: tenantProcedure
    .input(z.object({
      productId: z.string().optional(),
      page:      z.number().default(1),
      limit:     z.number().default(30),
    }))
    .query(async ({ ctx, input }) => {
      let query = ctx.supa
        .from("inventory_movements")
        .select("*, product:products(name)")
        .eq("tenant_id", ctx.tenant.id)
        .order("created_at", { ascending: false })
        .range(
          (input.page - 1) * input.limit,
          input.page * input.limit - 1,
        );

      if (input.productId) {
        query = query.eq("product_id", input.productId);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data ?? [];
    }),

  getLowStock: tenantProcedure.query(async ({ ctx }) => {
    // Supabase does not support column-to-column comparisons via the JS client,
    // so we use a raw RPC or fetch all and filter in JS.
    const { data, error } = await ctx.supa
      .from("products")
      .select("*")
      .eq("tenant_id", ctx.tenant.id)
      .eq("is_active", true)
      .eq("track_stock", true)
      .order("stock", { ascending: true });

    if (error) throw new Error(error.message);

    // filter where stock <= min_stock
    return (data ?? []).filter(p => (p.stock ?? 0) <= (p.min_stock ?? 0));
  }),

  adjustStock: tenantProcedure
    .input(z.object({
      productId: z.string(),
      type:      z.enum(["in", "out", "adjustment", "return"]),
      quantity:  z.number().int().positive(),
      reason:    z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { data: product, error: productError } = await ctx.supa
        .from("products")
        .select("*")
        .eq("id", input.productId)
        .eq("tenant_id", ctx.tenant.id)
        .single();

      if (productError || !product) throw new Error("Produto não encontrado");

      const before = product.stock ?? 0;
      let after: number;

      if (input.type === "in" || input.type === "return") {
        after = before + input.quantity;
      } else if (input.type === "out") {
        after = Math.max(0, before - input.quantity);
      } else {
        // adjustment = absolute value
        after = input.quantity;
      }

      const { error: updateError } = await ctx.supa
        .from("products")
        .update({ stock: after, updated_at: new Date().toISOString() })
        .eq("id", input.productId);

      if (updateError) throw new Error(updateError.message);

      const { data: movement, error: movError } = await ctx.supa
        .from("inventory_movements")
        .insert({
          tenant_id:  ctx.tenant.id,
          product_id: input.productId,
          type:       input.type,
          quantity:   input.quantity,
          before,
          after,
          reason:     input.reason ?? null,
        })
        .select()
        .single();

      if (movError) throw new Error(movError.message);
      return movement;
    }),
});
