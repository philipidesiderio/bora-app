import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, tenantProcedure } from "../trpc";

export const providersRouter = createTRPCRouter({

  list: tenantProcedure
    .input(z.object({ search: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      let query = ctx.supa
        .from("providers")
        .select("*")
        .eq("tenant_id", ctx.tenant.id)
        .order("name", { ascending: true });
      if (input.search) {
        query = query.ilike("name", `%${input.search}%`);
      }
      const { data, error } = await query;
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return data ?? [];
    }),

  create: tenantProcedure
    .input(z.object({
      name:    z.string().min(1),
      phone:   z.string().optional(),
      email:   z.string().email().optional().or(z.literal("")),
      address: z.string().optional(),
      notes:   z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supa
        .from("providers")
        .insert({ tenant_id: ctx.tenant.id, ...input })
        .select()
        .single();
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return data;
    }),

  update: tenantProcedure
    .input(z.object({
      id:      z.string(),
      name:    z.string().min(1).optional(),
      phone:   z.string().optional(),
      email:   z.string().optional(),
      address: z.string().optional(),
      notes:   z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...rest } = input;
      const { data, error } = await ctx.supa
        .from("providers")
        .update(rest)
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
      await ctx.supa.from("providers").delete().eq("id", input.id).eq("tenant_id", ctx.tenant.id);
      return { ok: true };
    }),
});
