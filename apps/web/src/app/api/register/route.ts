import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db, tenants, users } from "@bora/db";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, storeName, slug } = await req.json();

    if (!name || !email || !password || !storeName || !slug) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando" },
        { status: 400 },
      );
    }

    // 1. Cria usuário via Better-Auth (seta cookie de sessão na resposta)
    let signUpResponse: Response;
    try {
      signUpResponse = await auth.api.signUpEmail({
        body: { email, password, name },
        asResponse: true,
        headers: req.headers,
      });
    } catch (err: any) {
      const msg = err?.message ?? "Falha ao criar usuário";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    if (!signUpResponse.ok) {
      const body = await signUpResponse.json().catch(() => ({}));
      return NextResponse.json(
        { error: body?.message ?? "Email já cadastrado ou inválido" },
        { status: signUpResponse.status },
      );
    }

    const signUpBody = await signUpResponse.json().catch(() => null) as
      | { user?: { id?: string } }
      | null;
    const userId = signUpBody?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Conta criada mas ID não retornado" },
        { status: 500 },
      );
    }

    // 2. Cria tenant (slug único — ajusta se já existe)
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
        { error: "Falha ao criar loja" },
        { status: 500 },
      );
    }

    // 3. Vincula usuário ao tenant como owner
    await db
      .update(users)
      .set({ tenantId: tenant.id, role: "owner" })
      .where(eq(users.id, userId));

    // 4. Retorna resposta copiando os Set-Cookie do signUp
    const res = NextResponse.json({
      ok: true,
      tenantId: tenant.id,
      userId,
    });

    const setCookie = signUpResponse.headers.get("set-cookie");
    if (setCookie) res.headers.set("set-cookie", setCookie);

    return res;
  } catch (err: any) {
    console.error("[register]", err);
    return NextResponse.json(
      { error: err?.message ?? "Erro interno ao criar conta" },
      { status: 500 },
    );
  }
}
