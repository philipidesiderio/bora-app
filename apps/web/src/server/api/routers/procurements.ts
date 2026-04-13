import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, tenantProcedure } from "../trpc";

export const procurementsRouter = createTRPCRouter({

  list: tenantProcedure
    .input(z.object({
      page:  z.number().default(1),
      limit: z.number().default(20),
    }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supa
        .from("procurements")
        .select("*, provider:providers(name), items:procurement_items(*, product:products(name, stock, cost_price))")
        .eq("tenant_id", ctx.tenant.id)
        .order("created_at", { ascending: false })
        .range((input.page - 1) * input.limit, input.page * input.limit - 1);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return data ?? [];
    }),

  create: tenantProcedure
    .input(z.object({
      providerId:   z.string().optional(),
      name:         z.string().optional(),
      invoiceRef:   z.string().optional(),
      deliveryDate: z.string().optional(),
      notes:        z.string().optional(),
      items: z.array(z.object({
        productId:     z.string(),
        quantity:      z.number().positive(),
        purchasePrice: z.number().positive(),
      })).min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const totalValue = input.items.reduce((s, i) => s + i.quantity * i.purchasePrice, 0);

      const { data: proc, error: procErr } = await ctx.supa
        .from("procurements")
        .insert({
          tenant_id:       ctx.tenant.id,
          provider_id:     input.providerId ?? null,
          name:            input.name ?? null,
          invoice_ref:     input.invoiceRef ?? null,
          delivery_date:   input.deliveryDate ?? null,
          notes:           input.notes ?? null,
          total_value:     totalValue,
          payment_status:  "unpaid",
          delivery_status: "pending",
          author_id:       ctx.session.user.id,
        })
        .select()
        .single();
      if (procErr) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: procErr.message });

      await ctx.supa.from("procurement_items").insert(
        input.items.map(i => ({
          procurement_id: proc.id,
          product_id:     i.productId,
          quantity:       i.quantity,
          purchase_price: i.purchasePrice,
          total_price:    i.quantity * i.purchasePrice,
        }))
      );

      return proc;
    }),

  // Confirm delivery — updates stock and cost_price (weighted average)
  deliver: tenantProcedure
    .input(z.object({ procurementId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { data: proc } = await ctx.supa
        .from("procurements")
        .select("*, items:procurement_items(*)")
        .eq("id", input.procurementId)
        .eq("tenant_id", ctx.tenant.id)
        .single();
      if (!proc) throw new TRPCError({ code: "NOT_FOUND" });
      if (proc.delivery_status === "delivered") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Compra já foi entregue." });
      }

      for (const item of (proc.items ?? [])) {
        const { data: product } = await ctx.supa
          .from("products")
          .select("stock, cost_price, track_stock")
          .eq("id", item.product_id)
          .single();
        if (!product) continue;

        const oldStock     = Number(product.stock ?? 0);
        const oldCost      = Number(product.cost_price ?? 0);
        const newQty       = Number(item.quantity);
        const newCost      = Number(item.purchase_price);
        const newStock     = oldStock + newQty;
        // Weighted average cost
        const avgCost = oldStock > 0
          ? ((oldStock * oldCost) + (newQty * newCost)) / newStock
          : newCost;

        await ctx.supa.from("products").update({
          stock:      newStock,
          cost_price: avgCost,
          updated_at: new Date().toISOString(),
        }).eq("id", item.product_id);

        await ctx.supa.from("inventory_movements").insert({
          tenant_id:    ctx.tenant.id,
          product_id:   item.product_id,
          type:         "procurement",
          quantity:     newQty,
          before: oldStock,
          after:  newStock,
          reason:       `Compra entregue — ${proc.name ?? proc.id}`,
        });
      }

      await ctx.supa.from("procurements").update({
        delivery_status: "delivered",
      }).eq("id", input.procurementId);

      return { ok: true };
    }),

  markPaid: tenantProcedure
    .input(z.object({ procurementId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.supa.from("procurements")
        .update({ payment_status: "paid" })
        .eq("id", input.procurementId)
        .eq("tenant_id", ctx.tenant.id);
      return { ok: true };
    }),
});
