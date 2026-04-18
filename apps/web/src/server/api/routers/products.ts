import { z } from "zod";
import { createTRPCRouter, tenantProcedure } from "../trpc";

const productSchema = z.object({
  name:        z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  imageUrl:    z.string().optional(),
  price:       z.number().positive("Preço deve ser positivo"),
  costPrice:   z.number().optional(),
  stock:       z.number().int().default(0),
  minStock:    z.number().int().default(5),
  categoryId:  z.string().optional(),
  barcode:     z.string().optional(),
  type:        z.enum(["product", "service", "combo"]).default("product"),
  trackStock:  z.boolean().default(true),
  showInStore: z.boolean().default(true),
});

export const productsRouter = createTRPCRouter({
  list: tenantProcedure
    .input(z.object({
      search:     z.string().optional(),
      categoryId: z.string().optional(),
      type:       z.enum(["product", "service", "combo"]).optional(),
      page:       z.number().default(1),
      limit:      z.number().default(20),
    }))
    .query(async ({ ctx, input }) => {
      let query = ctx.supa
        .from("products")
        .select("*")
        .eq("tenant_id", ctx.tenant.id)
        .eq("is_active", true)
        .order("name", { ascending: true })
        .range(
          (input.page - 1) * input.limit,
          input.page * input.limit - 1,
        );

      if (input.search) {
        query = query.ilike("name", `%${input.search}%`);
      }
      if (input.categoryId) {
        query = query.eq("category_id", input.categoryId);
      }
      if (input.type) {
        query = query.eq("type", input.type);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data ?? [];
    }),

  create: tenantProcedure
    .input(productSchema)
    .mutation(async ({ ctx, input }) => {
      const productId = crypto.randomUUID();
      const { data, error } = await ctx.supa
        .from("products")
        .insert({
          id:           productId,
          tenant_id:    ctx.tenant.id,
          name:        input.name,
          description: input.description ?? null,
          image_url:   input.imageUrl ?? null,
          price:       input.price,
          cost_price:  input.costPrice ?? null,
          stock:       input.stock,
          min_stock:   input.minStock,
          category_id: input.categoryId ?? null,
          barcode:     input.barcode ?? null,
          type:        input.type,
          track_stock: input.trackStock,
          show_in_store: input.showInStore,
          is_active:   true,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }),

  update: tenantProcedure
    .input(productSchema.extend({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input;

      const { data, error } = await ctx.supa
        .from("products")
        .update({
          name:          rest.name,
          description:   rest.description ?? null,
          image_url:     rest.imageUrl ?? null,
          price:         rest.price,
          cost_price:    rest.costPrice ?? null,
          stock:         rest.stock,
          min_stock:     rest.minStock,
          category_id:   rest.categoryId ?? null,
          barcode:       rest.barcode ?? null,
          type:          rest.type,
          track_stock:   rest.trackStock,
          show_in_store: rest.showInStore,
          updated_at:    new Date().toISOString(),
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
        .from("products")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", input.id)
        .eq("tenant_id", ctx.tenant.id);

      if (error) throw new Error(error.message);
      return { success: true };
    }),

  listCategories: tenantProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supa
      .from("categories")
      .select("*")
      .eq("tenant_id", ctx.tenant.id)
      .order("order", { ascending: true });

    if (error) throw new Error(error.message);
    return data ?? [];
  }),

  createCategory: tenantProcedure
    .input(z.object({
      name:  z.string().min(1),
      emoji: z.string().optional(),
      color: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supa
        .from("categories")
        .insert({
          tenant_id: ctx.tenant.id,
          name:      input.name,
          emoji:     input.emoji ?? "📦",
          color:     input.color ?? "bg-primary",
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    }),

  updateCategory: tenantProcedure
    .input(z.object({
      id:    z.string(),
      name:  z.string().min(1),
      emoji: z.string().optional(),
      color: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supa
        .from("categories")
        .update({
          name:  input.name,
          emoji: input.emoji ?? "📦",
          color: input.color ?? "bg-primary",
        })
        .eq("id", input.id)
        .eq("tenant_id", ctx.tenant.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    }),

  deleteCategory: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supa
        .from("categories")
        .delete()
        .eq("id", input.id)
        .eq("tenant_id", ctx.tenant.id);
      if (error) throw new Error(error.message);
      return { ok: true };
    }),
});
