import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, tenantProcedure } from "../trpc";

// ── Helpers ─────────────────────────────────────────────────────────────────

function calcPaymentStatus(total: number, paid: number): string {
  if (paid <= 0)        return "unpaid";
  if (paid >= total)    return "paid";
  return "partial";
}

const paymentMethodSchema = z.enum(["pix", "cash", "credit", "debit", "account", "voucher"]);

const orderItemSchema = z.object({
  productId:  z.string().optional(),
  name:       z.string(),
  quantity:   z.number().positive(),
  unitPrice:  z.number().positive(),
  costPrice:  z.number().default(0),
  discount:   z.number().default(0),
  notes:      z.string().optional(),
});

const paymentSchema = z.object({
  method: paymentMethodSchema,
  amount: z.number().positive(),
  note:   z.string().optional(),
});

const instalmentSchema = z.object({
  amount:  z.number().positive(),
  dueDate: z.string().optional(), // ISO date string, optional (fiado sem data)
});

// ── Router ───────────────────────────────────────────────────────────────────

export const ordersRouter = createTRPCRouter({

  // ─── Legacy simple create (kept for compatibility) ──────────────────────
  create: tenantProcedure
    .input(z.object({
      items:         z.array(orderItemSchema).min(1),
      customerId:    z.string().optional(),
      paymentMethod: paymentMethodSchema,
      discount:      z.number().default(0),
      notes:         z.string().optional(),
      channel:       z.enum(["pdv", "online", "whatsapp"]).default("pdv"),
    }))
    .mutation(async ({ ctx, input }) => {
      return _createOrder(ctx, {
        items:      input.items,
        customerId: input.customerId,
        payments:   [{ method: input.paymentMethod, amount: 0, note: undefined }],
        discount:   input.discount,
        notes:      input.notes,
        channel:    input.channel,
        instalments: [],
        autoPayFull: true,
      });
    }),

  // ─── Full create with multi-payment + instalments (NexoPOS engine) ──────
  createWithPayments: tenantProcedure
    .input(z.object({
      items:       z.array(orderItemSchema).min(1),
      customerId:  z.string().optional(),
      payments:    z.array(paymentSchema).min(1),
      instalments: z.array(instalmentSchema).optional().default([]),
      discount:    z.number().default(0),
      discountType: z.enum(["flat", "percent"]).default("flat"),
      couponCode:  z.string().optional(),
      notes:       z.string().optional(),
      channel:     z.enum(["pdv", "online", "whatsapp"]).default("pdv"),
      registerId:  z.string().optional(),
      deliveryFee:     z.number().min(0).default(0),
      deliveryAddress: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return _createOrder(ctx, {
        items:        input.items,
        customerId:   input.customerId,
        payments:     input.payments,
        instalments:  input.instalments,
        discount:     input.discount,
        discountType: input.discountType,
        couponCode:   input.couponCode,
        notes:        input.notes,
        channel:      input.channel,
        registerId:   input.registerId,
        deliveryFee:     input.deliveryFee,
        deliveryAddress: input.deliveryAddress,
        autoPayFull:  false,
      });
    }),

  // ─── List orders ─────────────────────────────────────────────────────────
  list: tenantProcedure
    .input(z.object({
      page:          z.number().default(1),
      limit:         z.number().default(20),
      status:        z.string().optional(),
      statuses:      z.array(z.string()).optional(),
      paymentStatus: z.string().optional(),
      customerId:    z.string().optional(),
      dateFrom:      z.string().optional(),
      dateTo:        z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      let query = ctx.supa
        .from("orders")
        .select("*, items:order_items(*), payments:order_payments(*), instalments:order_instalments(*)")
        .eq("tenant_id", ctx.tenant.id)
        .order("created_at", { ascending: false })
        .range((input.page - 1) * input.limit, input.page * input.limit - 1);

      if (input.status)         query = query.eq("status", input.status);
      if (input.statuses?.length) query = query.in("status", input.statuses);
      if (input.paymentStatus)  query = query.eq("payment_status", input.paymentStatus);
      if (input.customerId)     query = query.eq("customer_id", input.customerId);
      if (input.dateFrom)       query = query.gte("created_at", input.dateFrom);
      if (input.dateTo)         query = query.lte("created_at", input.dateTo);

      const { data, error } = await query;
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });

      // Attach customer via separate query (avoid embedded join FK dependency)
      const rows = data ?? [];
      const customerIds = [...new Set(rows.map((o: any) => o.customer_id).filter(Boolean))] as string[];
      let customersMap: Record<string, any> = {};
      if (customerIds.length) {
        const { data: customers } = await ctx.supa
          .from("customers")
          .select("id, name, phone")
          .in("id", customerIds)
          .eq("tenant_id", ctx.tenant.id);
        customersMap = Object.fromEntries((customers ?? []).map((c: any) => [c.id, c]));
      }
      return rows.map((o: any) => ({ ...o, customer: o.customer_id ? customersMap[o.customer_id] ?? null : null }));
    }),

  // ─── Get single order ────────────────────────────────────────────────────
  get: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supa
        .from("orders")
        .select("*, items:order_items(*), payments:order_payments(*), instalments:order_instalments(*), refunds:order_refunds(*)")
        .eq("id", input.id)
        .eq("tenant_id", ctx.tenant.id)
        .single();
      if (error) throw new TRPCError({ code: "NOT_FOUND" });
      return data;
    }),

  // ─── Void order (anular) ─────────────────────────────────────────────────
  void: tenantProcedure
    .input(z.object({
      orderId: z.string(),
      reason:  z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      // Fetch order + items
      const { data: order } = await ctx.supa
        .from("orders")
        .select("*, items:order_items(*)")
        .eq("id", input.orderId)
        .eq("tenant_id", ctx.tenant.id)
        .single();

      if (!order) throw new TRPCError({ code: "NOT_FOUND" });

      const voidable = ["paid", "partial", "unpaid", "hold"];
      if (!voidable.includes(order.payment_status)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Pedido não pode ser anulado neste estado." });
      }

      // Revert stock for each product item
      for (const item of (order.items ?? [])) {
        if (!item.product_id) continue;
        const { data: product } = await ctx.supa
          .from("products")
          .select("stock, track_stock")
          .eq("id", item.product_id)
          .single();
        if (!product?.track_stock) continue;
        const newStock = (product.stock ?? 0) + Number(item.quantity);
        await ctx.supa.from("products").update({ stock: newStock }).eq("id", item.product_id).eq("tenant_id", ctx.tenant.id);
        await ctx.supa.from("inventory_movements").insert({
          tenant_id:    ctx.tenant.id,
          product_id:   item.product_id,
          type:         "void-return",
          quantity:     Number(item.quantity),
          before: product.stock ?? 0,
          after:  newStock,
          reason:       `Pedido #${order.number} anulado: ${input.reason}`,
        });
      }

      // Update order
      await ctx.supa.from("orders").update({
        payment_status: "void",
        void_reason:    input.reason,
        status:         "cancelled",
        updated_at:     new Date().toISOString(),
      }).eq("id", input.orderId).eq("tenant_id", ctx.tenant.id);

      return { ok: true };
    }),

  // ─── Refund order items (devolução parcial ou total) ─────────────────────
  refund: tenantProcedure
    .input(z.object({
      orderId: z.string(),
      reason:  z.string().optional(),
      items: z.array(z.object({
        orderItemId: z.string(),
        quantity:    z.number().positive(),
        unitPrice:   z.number().positive(),
        condition:   z.enum(["good", "damaged"]).default("good"),
        notes:       z.string().optional(),
      })),
      refundToAccount: z.boolean().default(false), // credit customer account
    }))
    .mutation(async ({ ctx, input }) => {
      const { data: order } = await ctx.supa
        .from("orders")
        .select("*, items:order_items(*)")
        .eq("id", input.orderId)
        .eq("tenant_id", ctx.tenant.id)
        .single();

      if (!order) throw new TRPCError({ code: "NOT_FOUND" });

      const refundable = ["paid", "partial", "unpaid", "partially_refunded"];
      if (!refundable.includes(order.payment_status)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Pedido não pode ser reembolsado neste estado." });
      }

      const totalRefund = input.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

      // Create refund record
      const { data: refund, error: refundErr } = await ctx.supa
        .from("order_refunds")
        .insert({
          tenant_id:    ctx.tenant.id,
          order_id:     input.orderId,
          reason:       input.reason ?? null,
          total_amount: totalRefund,
          author_id:    ctx.session.user.id,
        })
        .select()
        .single();
      if (refundErr) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: refundErr.message });

      // Process each refund item
      for (const ri of input.items) {
        const orderItem = (order.items ?? []).find((oi: any) => oi.id === ri.orderItemId);
        if (!orderItem) continue;

        await ctx.supa.from("order_refund_items").insert({
          refund_id:     refund.id,
          order_item_id: ri.orderItemId,
          product_id:    orderItem.product_id ?? "",
          quantity:      ri.quantity,
          unit_price:    ri.unitPrice,
          condition:     ri.condition,
          notes:         ri.notes ?? null,
        });

        // Revert stock
        if (orderItem.product_id) {
          const { data: product } = await ctx.supa
            .from("products")
            .select("stock, track_stock")
            .eq("id", orderItem.product_id)
            .single();
          if (product?.track_stock) {
            const newStock = (product.stock ?? 0) + ri.quantity;
            await ctx.supa.from("products").update({ stock: newStock }).eq("id", orderItem.product_id).eq("tenant_id", ctx.tenant.id);
            await ctx.supa.from("inventory_movements").insert({
              tenant_id:    ctx.tenant.id,
              product_id:   orderItem.product_id,
              type:         ri.condition === "damaged" ? "defective" : "return",
              quantity:     ri.quantity,
              before: product.stock ?? 0,
              after:  newStock,
              reason:       `Devolução do pedido #${order.number}`,
            });
          }
        }
      }

      // Credit customer account if requested
      if (input.refundToAccount && order.customer_id) {
        const { data: customer } = await ctx.supa
          .from("customers")
          .select("credit_balance")
          .eq("id", order.customer_id)
          .single();
        const balanceBefore = Number(customer?.credit_balance ?? 0);
        const balanceAfter  = balanceBefore + totalRefund;
        await ctx.supa.from("customers").update({ credit_balance: balanceAfter }).eq("id", order.customer_id).eq("tenant_id", ctx.tenant.id);
        await ctx.supa.from("customer_account_history").insert({
          tenant_id:      ctx.tenant.id,
          customer_id:    order.customer_id,
          order_id:       input.orderId,
          operation:      "add",
          amount:         totalRefund,
          balance_before: balanceBefore,
          balance_after:  balanceAfter,
          description:    `Reembolso do pedido #${order.number}`,
        });
      }

      // Update order payment_status
      const newPayStatus = totalRefund >= Number(order.total) ? "refunded" : "partially_refunded";
      await ctx.supa.from("orders").update({
        payment_status: newPayStatus,
        updated_at: new Date().toISOString(),
      }).eq("id", input.orderId).eq("tenant_id", ctx.tenant.id);

      return { ok: true, refundId: refund.id };
    }),

  // ─── Pay an instalment ──────────────────────────────────────────────────
  payInstalment: tenantProcedure
    .input(z.object({
      instalmentId: z.string(),
      method:       paymentMethodSchema,
      amount:       z.number().positive(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { data: instalment } = await ctx.supa
        .from("order_instalments")
        .select("*, order:orders(*)")
        .eq("id", input.instalmentId)
        .eq("tenant_id", ctx.tenant.id)
        .single();

      if (!instalment) throw new TRPCError({ code: "NOT_FOUND" });
      if (instalment.paid) throw new TRPCError({ code: "BAD_REQUEST", message: "Parcela já paga." });

      // Create payment record
      const { data: payment } = await ctx.supa
        .from("order_payments")
        .insert({
          tenant_id: ctx.tenant.id,
          order_id:  instalment.order_id,
          method:    input.method,
          amount:    input.amount,
          note:      `Pagamento de parcela`,
        })
        .select()
        .single();

      // Mark instalment paid
      await ctx.supa.from("order_instalments").update({
        paid:       true,
        paid_at:    new Date().toISOString(),
        payment_id: payment?.id ?? null,
      }).eq("id", input.instalmentId);

      // Recalculate order payment_status
      const { data: allPayments } = await ctx.supa
        .from("order_payments")
        .select("amount")
        .eq("order_id", instalment.order_id);
      const totalPaid = (allPayments ?? []).reduce((s: number, p: any) => s + Number(p.amount), 0);
      const orderTotal = Number(instalment.order?.total ?? 0);
      const newStatus  = calcPaymentStatus(orderTotal, totalPaid);

      await ctx.supa.from("orders").update({
        payment_status: newStatus,
        updated_at: new Date().toISOString(),
      }).eq("id", instalment.order_id);

      // If customer owes — update credit_balance
      if (instalment.order?.customer_id) {
        const { data: customer } = await ctx.supa
          .from("customers")
          .select("credit_balance")
          .eq("id", instalment.order.customer_id)
          .single();
        const balanceBefore = Number(customer?.credit_balance ?? 0);
        const balanceAfter  = Math.max(0, balanceBefore - input.amount);
        await ctx.supa.from("customers").update({ credit_balance: balanceAfter }).eq("id", instalment.order.customer_id).eq("tenant_id", ctx.tenant.id);
        await ctx.supa.from("customer_account_history").insert({
          tenant_id:      ctx.tenant.id,
          customer_id:    instalment.order.customer_id,
          order_id:       instalment.order_id,
          operation:      "sub",
          amount:         input.amount,
          balance_before: balanceBefore,
          balance_after:  balanceAfter,
          description:    `Pagamento de parcela`,
        });
      }

      return { ok: true };
    }),

  // ─── Mark order as ready for pickup ──────────────────────────────────────
  markReady: tenantProcedure
    .input(z.object({ orderId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supa
        .from("orders")
        .update({ status: "ready", updated_at: new Date().toISOString() })
        .eq("id", input.orderId)
        .eq("tenant_id", ctx.tenant.id);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { ok: true };
    }),

  // ─── Mark order as delivered ─────────────────────────────────────────────
  markDelivered: tenantProcedure
    .input(z.object({ orderId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supa
        .from("orders")
        .update({ status: "delivered", updated_at: new Date().toISOString() })
        .eq("id", input.orderId)
        .eq("tenant_id", ctx.tenant.id);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { ok: true };
    }),

  // ─── Cancel order ────────────────────────────────────────────────────────
  cancel: tenantProcedure
    .input(z.object({ orderId: z.string(), reason: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supa
        .from("orders")
        .update({ status: "cancelled", void_reason: input.reason, updated_at: new Date().toISOString() })
        .eq("id", input.orderId)
        .eq("tenant_id", ctx.tenant.id);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { ok: true };
    }),

  // ─── Update order notes / edit ───────────────────────────────────────────
  update: tenantProcedure
    .input(z.object({
      orderId:    z.string(),
      notes:      z.string().optional(),
      editReason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supa
        .from("orders")
        .update({
          notes:       input.notes ?? null,
          edited_at:   new Date().toISOString(),
          edit_reason: input.editReason ?? null,
          updated_at:  new Date().toISOString(),
        })
        .eq("id", input.orderId)
        .eq("tenant_id", ctx.tenant.id);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { ok: true };
    }),

  // ─── Add note to order ───────────────────────────────────────────────────
  addNote: tenantProcedure
    .input(z.object({ orderId: z.string(), note: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supa
        .from("orders")
        .update({ notes: input.note, updated_at: new Date().toISOString() })
        .eq("id", input.orderId)
        .eq("tenant_id", ctx.tenant.id);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { ok: true };
    }),

  // ─── Pay order (add payment to existing order) ───────────────────────────
  pay: tenantProcedure
    .input(z.object({
      orderId:  z.string(),
      payments: z.array(z.object({
        method:       paymentMethodSchema,
        amount:       z.number().positive(),
        installments: z.number().optional(),
      })).min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const { data: order } = await ctx.supa
        .from("orders")
        .select("total, customer_id, number")
        .eq("id", input.orderId)
        .eq("tenant_id", ctx.tenant.id)
        .single();
      if (!order) throw new TRPCError({ code: "NOT_FOUND" });

      const totalPaid = input.payments.reduce((s, p) => s + p.amount, 0);

      // Insert payment records
      await ctx.supa.from("order_payments").insert(
        input.payments.map(p => ({
          tenant_id: ctx.tenant.id,
          order_id:  input.orderId,
          method:    p.method,
          amount:    p.amount,
          note:      p.installments ? `${p.installments}x` : null,
        }))
      );

      // Recalculate payment status
      const { data: allPayments } = await ctx.supa
        .from("order_payments")
        .select("amount")
        .eq("order_id", input.orderId);
      const totalAllPaid = (allPayments ?? []).reduce((s: number, p: any) => s + Number(p.amount), 0);
      const newStatus = calcPaymentStatus(Number(order.total), totalAllPaid);

      await ctx.supa.from("orders").update({
        payment_status: newStatus,
        updated_at: new Date().toISOString(),
      }).eq("id", input.orderId).eq("tenant_id", ctx.tenant.id);

      // Update customer credit balance if they had a debt
      if (order.customer_id) {
        const { data: customer } = await ctx.supa
          .from("customers")
          .select("credit_balance")
          .eq("id", order.customer_id)
          .single();
        if (customer && Number(customer.credit_balance) > 0) {
          const balanceBefore = Number(customer.credit_balance);
          const balanceAfter  = Math.max(0, balanceBefore - totalPaid);
          await ctx.supa.from("customers").update({ credit_balance: balanceAfter }).eq("id", order.customer_id).eq("tenant_id", ctx.tenant.id);
          await ctx.supa.from("customer_account_history").insert({
            tenant_id:      ctx.tenant.id,
            customer_id:    order.customer_id,
            order_id:       input.orderId,
            operation:      "sub",
            amount:         totalPaid,
            balance_before: balanceBefore,
            balance_after:  balanceAfter,
            description:    `Pagamento do pedido #${order.number}`,
          });
        }
      }

      return { ok: true };
    }),

  // ─── Validate + apply coupon ─────────────────────────────────────────────
  applyCoupon: tenantProcedure
    .input(z.object({
      orderId:    z.string(),
      couponCode: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { data: coupon } = await ctx.supa
        .from("coupons")
        .select("*")
        .eq("tenant_id", ctx.tenant.id)
        .eq("code", input.couponCode.toUpperCase())
        .eq("active", true)
        .single();

      if (!coupon) throw new TRPCError({ code: "NOT_FOUND", message: "Cupom inválido ou inativo." });
      if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cupom expirado." });
      }
      if (coupon.max_uses !== null && coupon.uses_count >= coupon.max_uses) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cupom esgotado." });
      }

      const { data: order } = await ctx.supa
        .from("orders")
        .select("total, subtotal, discount")
        .eq("id", input.orderId)
        .eq("tenant_id", ctx.tenant.id)
        .single();
      if (!order) throw new TRPCError({ code: "NOT_FOUND" });

      const cartTotal   = Number(order.subtotal);
      const minCart     = Number(coupon.min_cart_value ?? 0);
      if (cartTotal < minCart) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Valor mínimo para este cupom: R$ ${minCart.toFixed(2)}` });
      }

      const discountAmt = coupon.type === "percent"
        ? (cartTotal * Number(coupon.value)) / 100
        : Number(coupon.value);
      const newTotal = Math.max(0, cartTotal - discountAmt);

      await ctx.supa.from("orders").update({
        discount:      discountAmt,
        discount_type: coupon.type === "percent" ? "percent" : "flat",
        total:         newTotal,
        updated_at:    new Date().toISOString(),
      }).eq("id", input.orderId).eq("tenant_id", ctx.tenant.id);

      await ctx.supa.from("coupons").update({ uses_count: (coupon.uses_count ?? 0) + 1 }).eq("id", coupon.id).eq("tenant_id", ctx.tenant.id);

      return { ok: true, discountAmount: discountAmt, newTotal };
    }),
});

// ── Internal helper: full order creation ─────────────────────────────────────

async function _createOrder(ctx: any, opts: {
  items:        z.infer<typeof orderItemSchema>[];
  customerId?:  string;
  payments:     { method: string; amount: number; note?: string }[];
  instalments:  { amount: number; dueDate?: string }[];
  discount?:    number;
  discountType?: string;
  couponCode?:  string;
  notes?:       string;
  channel?:     string;
  registerId?:  string;
  deliveryFee?: number;
  deliveryAddress?: string;
  autoPayFull:  boolean;
}) {
  const itemsSubtotal = opts.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const deliveryFee   = opts.deliveryFee ?? 0;
  const subtotal      = itemsSubtotal + deliveryFee;
  const discount      = opts.discount ?? 0;
  const total         = Math.max(0, subtotal - discount);

  // Get next order number
  const { count } = await ctx.supa
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", ctx.tenant.id);
  const number = (count ?? 0) + 1;

  // Determine payment amounts
  const paymentsList = opts.autoPayFull
    ? [{ method: opts.payments[0]?.method ?? "cash", amount: total, note: null }]
    : opts.payments;
  const totalPaid     = paymentsList.reduce((s, p) => s + p.amount, 0);
  const totalInstalment = opts.instalments.reduce((s, i) => s + i.amount, 0);
  const paymentStatus = calcPaymentStatus(total, totalPaid + totalInstalment);

  // Primary payment method for legacy column
  const primaryMethod = paymentsList[0]?.method ?? "cash";
  const tendered  = paymentsList.find(p => p.method === "cash")?.amount ?? null;
  const change    = tendered && tendered > total ? tendered - total : null;

  // Generate ID (compatible with schema's cuid2)
  const orderId = crypto.randomUUID();

  // Create order
  const { data: order, error: orderErr } = await ctx.supa
    .from("orders")
    .insert({
      id:             orderId,
      tenant_id:      ctx.tenant.id,
      customer_id:    opts.customerId ?? null,
      number,
      channel:        opts.channel ?? "pdv",
      status:         "confirmed",
      payment_method: primaryMethod as any,
      payment_status: paymentStatus as any,
      subtotal,
      discount,
      discount_type:  opts.discountType ?? "flat",
      total,
      tendered,
      change_amount:  change,
      notes:          opts.notes ?? null,
      register_id:    opts.registerId ?? null,
      metadata:       (deliveryFee > 0 || opts.deliveryAddress)
        ? { delivery: { fee: deliveryFee, address: opts.deliveryAddress ?? null } }
        : null,
    })
    .select()
    .single();
  if (orderErr) throw new Error(orderErr.message);

  // Insert order items (with cost_price for COGS)
  const { error: itemsErr } = await ctx.supa.from("order_items").insert(
    opts.items.map(item => ({
      order_id:   order.id,
      product_id: item.productId ?? null,
      name:       item.name,
      quantity:   item.quantity,
      unit_price: item.unitPrice,
      cost_price: item.costPrice ?? 0,
      discount:   item.discount ?? 0,
      total:      item.unitPrice * item.quantity - (item.discount ?? 0),
      notes:      item.notes ?? null,
    }))
  );
  if (itemsErr) throw new Error(`Falha ao salvar itens: ${itemsErr.message}`);

  // Insert payment records
  const { error: paymentsErr } = await ctx.supa.from("order_payments").insert(
    paymentsList.map(p => ({
      tenant_id: ctx.tenant.id,
      order_id:  order.id,
      method:    p.method,
      amount:    p.amount,
      note:      p.note ?? null,
    }))
  );
  if (paymentsErr) throw new Error(`Falha ao salvar pagamentos: ${paymentsErr.message}`);

  // Insert instalments (fiado/parcelamento)
  if (opts.instalments.length > 0) {
    const { error: instErr } = await ctx.supa.from("order_instalments").insert(
      opts.instalments.map(inst => ({
        tenant_id: ctx.tenant.id,
        order_id:  order.id,
        amount:    inst.amount,
        due_date:  inst.dueDate ?? null,
        paid:      false,
      }))
    );
    if (instErr) throw new Error(`Falha ao salvar parcelas: ${instErr.message}`);

    // Update customer credit_balance if fiado
    if (opts.customerId) {
      const { data: customer } = await ctx.supa
        .from("customers")
        .select("credit_balance")
        .eq("id", opts.customerId)
        .single();
      const balanceBefore = Number(customer?.credit_balance ?? 0);
      const balanceAfter  = balanceBefore + totalInstalment;
      await ctx.supa.from("customers").update({ credit_balance: balanceAfter }).eq("id", opts.customerId).eq("tenant_id", ctx.tenant.id);
      await ctx.supa.from("customer_account_history").insert({
        tenant_id:      ctx.tenant.id,
        customer_id:    opts.customerId,
        order_id:       order.id,
        operation:      "add",
        amount:         totalInstalment,
        balance_before: balanceBefore,
        balance_after:  balanceAfter,
        description:    `Em aberto — Pedido #${number}`,
      });
    }
  }

  // Decrement stock
  for (const item of opts.items) {
    if (!item.productId) continue;
    const { data: product } = await ctx.supa
      .from("products")
      .select("stock, track_stock")
      .eq("id", item.productId)
      .single();
    if (!product?.track_stock) continue;
    const newStock = Math.max(0, (product.stock ?? 0) - item.quantity);
    await ctx.supa.from("products").update({ stock: newStock, updated_at: new Date().toISOString() }).eq("id", item.productId).eq("tenant_id", ctx.tenant.id);
    await ctx.supa.from("inventory_movements").insert({
      tenant_id:    ctx.tenant.id,
      product_id:   item.productId,
      type:         "sale",
      quantity:     item.quantity,
      before: product.stock ?? 0,
      after:  newStock,
      reason:       `Venda — Pedido #${number}`,
    });
  }

  // Apply coupon if provided
  if (opts.couponCode) {
    const { data: coupon } = await ctx.supa
      .from("coupons")
      .select("*")
      .eq("tenant_id", ctx.tenant.id)
      .eq("code", opts.couponCode.toUpperCase())
      .eq("active", true)
      .single();
    if (coupon) {
      await ctx.supa.from("coupons").update({ uses_count: (coupon.uses_count ?? 0) + 1 }).eq("id", coupon.id).eq("tenant_id", ctx.tenant.id);
    }
  }

  // ── Caixa: register_history rows for each received payment (ignore "account" = pendente)
  const cashOnlyMethods = new Set(["cash"]);
  const receivedPayments = paymentsList.filter(p => p.method !== "account" && p.amount > 0);
  if (receivedPayments.length > 0) {
    // Find an open register for this tenant (prefer the one explicitly passed)
    let openRegister: any = null;
    if (opts.registerId) {
      const { data } = await ctx.supa
        .from("registers")
        .select("id, balance, status")
        .eq("id", opts.registerId)
        .eq("tenant_id", ctx.tenant.id)
        .eq("status", "opened")
        .maybeSingle();
      openRegister = data;
    }
    if (!openRegister) {
      const { data } = await ctx.supa
        .from("registers")
        .select("id, balance, status")
        .eq("tenant_id", ctx.tenant.id)
        .eq("status", "opened")
        .limit(1)
        .maybeSingle();
      openRegister = data;
    }

    if (openRegister) {
      let runningBalance = Number(openRegister.balance ?? 0);
      for (const p of receivedPayments) {
        const before = runningBalance;
        const after  = cashOnlyMethods.has(p.method) ? before + p.amount : before;
        runningBalance = after;
        await ctx.supa.from("register_history").insert({
          tenant_id:        ctx.tenant.id,
          register_id:      openRegister.id,
          action:           "order-payment",
          value:            p.amount,
          balance_before:   before,
          balance_after:    after,
          transaction_type: "positive",
          description:      `Venda · Pedido #${number} · ${p.method}`,
          author_id:        ctx.session.user.id,
        });
      }
      // Update register balance (cash only bumped)
      await ctx.supa.from("registers").update({
        balance:    runningBalance,
        updated_at: new Date().toISOString(),
      }).eq("id", openRegister.id);
    }
  }

  // ── Financeiro: create a paid income transaction for the received amount
  if (totalPaid > 0) {
    await ctx.supa.from("transactions").insert({
      id:          crypto.randomUUID(),
      tenant_id:   ctx.tenant.id,
      type:        "income",
      category:    "sales",
      description: `Venda Pedido #${number}`,
      amount:      totalPaid,
      status:      "paid",
      paid_at:     new Date().toISOString(),
      reference:   `order:${order.id}`,
    });
  }

  // Update customer lifetime spend
  if (opts.customerId && totalPaid > 0) {
    const { data: customer } = await ctx.supa
      .from("customers")
      .select("total_orders, total_spent")
      .eq("id", opts.customerId)
      .single();
    if (customer) {
      await ctx.supa.from("customers").update({
        total_orders: (customer.total_orders ?? 0) + 1,
        total_spent:  (Number(customer.total_spent ?? 0) + totalPaid),
      }).eq("id", opts.customerId).eq("tenant_id", ctx.tenant.id);
    }
  }

  return order;
}
