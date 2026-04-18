import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db, tenants, users } from "@bora/db";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  let stage = "parse-body";
  try {
    const { name, email, password, storeName, slug } = await req.json();

    if (!name || !email || !password || !storeName || !slug) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando", stage },
        { status: 400 },
      );
    }

    // 1. Cria usuário via Better-Auth (seta cookie de sessão na resposta)
    stage = "signup";
    let signUpResponse: Response;
    try {
      signUpResponse = await auth.api.signUpEmail({
        body:       { email, password, name },
        asResponse: true,
      });
    } catch (err: any) {
      const raw = String(err?.message ?? "");
      console.error("[register][signup-throw]", err);

      // Supavisor/pooler rejeita auth com "Tenant or user not found" — DATABASE_URL inválido
      if (/tenant or user not found|sasl|password authentication failed|ENOTFOUND|ECONNREFUSED/i.test(raw)) {
        return NextResponse.json(
          {
            error: "Banco de dados indisponível. Contate o administrador (config DATABASE_URL).",
            stage,
            hint:  "DATABASE_URL com senha inválida no Vercel",
            raw,
          },
          { status: 503 },
        );
      }

      const msg = raw || err?.body?.message || "Falha ao criar usuário";
      return NextResponse.json({ error: msg, stage }, { status: 400 });
    }

    if (!signUpResponse.ok) {
      const rawBody = await signUpResponse.text();
      console.error("[register][signup-fail]", signUpResponse.status, rawBody);
      let parsed: any = null;
      try { parsed = JSON.parse(rawBody); } catch {}
      const msg =
        parsed?.message ??
        parsed?.error ??
        (signUpResponse.status === 422
          ? "Email já cadastrado"
          : `Falha ao criar usuário (${signUpResponse.status})`);
      return NextResponse.json(
        { error: msg, stage, status: signUpResponse.status },
        { status: signUpResponse.status },
      );
    }

    stage = "parse-signup-body";
    const signUpBody = (await signUpResponse.json().catch(() => null)) as
      | { user?: { id?: string }; token?: string }
      | null;
    const userId = signUpBody?.user?.id;

    if (!userId) {
      console.error("[register][no-user-id]", signUpBody);
      return NextResponse.json(
        { error: "Conta criada mas ID não retornado", stage },
        { status: 500 },
      );
    }

    // 2. Cria tenant (slug único — ajusta se já existe)
    stage = "create-tenant";
    let finalSlug = slug;
    const existing = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, finalSlug))
      .limit(1);

    if (existing.length > 0) {
      finalSlug = `${slug}-${Date.now().toString(36)}`;
    }

    const [tenant] = await db
      .insert(tenants)
      .values({ name: storeName, slug: finalSlug })
      .returning();

    if (!tenant) {
      return NextResponse.json(
        { error: "Falha ao criar loja", stage },
        { status: 500 },
      );
    }

    // 3. Vincula usuário ao tenant como owner
    stage = "link-user";
    await db
      .update(users)
      .set({ tenantId: tenant.id, role: "owner" })
      .where(eq(users.id, userId));

    // 4. Retorna resposta copiando os Set-Cookie do signUp
    const res = NextResponse.json({
      ok:       true,
      tenantId: tenant.id,
      userId,
    });

    const setCookie = signUpResponse.headers.get("set-cookie");
    if (setCookie) res.headers.set("set-cookie", setCookie);

    return res;
  } catch (err: any) {
    const raw = String(err?.message ?? "");
    console.error("[register][unhandled]", stage, err);

    if (/tenant or user not found|sasl|password authentication failed|ENOTFOUND|ECONNREFUSED/i.test(raw)) {
      return NextResponse.json(
        {
          error: "Banco de dados indisponível. Contate o administrador (config DATABASE_URL).",
          stage,
          hint:  "DATABASE_URL com senha inválida no Vercel",
          raw,
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        error: raw || "Erro interno ao criar conta",
        stage,
        name:  err?.name,
      },
      { status: 500 },
    );
  }
}
