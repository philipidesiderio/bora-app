import { initTRPC, TRPCError } from "@trpc/server";
import { type NextRequest } from "next/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { createClient } from "@supabase/supabase-js";

// Cliente Supabase via HTTPS — nunca falha com ENOTFOUND
function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

const DEMO_TENANT_ID = "tenant_demo01";
const DEMO_USER_ID   = "user_demo01";

interface CreateContextOptions { req: NextRequest }

export const createTRPCContext = async (opts: CreateContextOptions) => {
  const supa = getSupabaseClient();

  // Tenta obter sessão do better-auth (opcional)
  let session: any = null;
  let tenant: any  = null;

  try {
    const { auth } = await import("@/server/auth");
    session = await auth.api.getSession({ headers: opts.req.headers });
  } catch {}

  if (session?.user?.id) {
    const { data: userData } = await supa
      .from("users")
      .select("*, tenants(*)")
      .eq("id", session.user.id)
      .single();
    tenant = userData?.tenants ?? null;
  }

  // Demo mode — sem sessão, usa tenant demo
  if (!tenant) {
    const { data: demoTenant } = await supa
      .from("tenants")
      .select("*")
      .eq("id", DEMO_TENANT_ID)
      .single();

    if (demoTenant) {
      tenant = demoTenant;
      if (!session) {
        session = {
          user: { id: DEMO_USER_ID, name: "Demo", email: "demo@bora.app" },
        };
      }
    }
  }

  return { supa, session, tenant, req: opts.req };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter    = t.router;
export const createCallerFactory = t.createCallerFactory;
export const publicProcedure     = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { ...ctx, session: ctx.session } });
});

export const tenantProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  if (!ctx.tenant) throw new TRPCError({ code: "FORBIDDEN", message: "Tenant não encontrado" });
  return next({ ctx: { ...ctx, session: ctx.session, tenant: ctx.tenant } });
});
