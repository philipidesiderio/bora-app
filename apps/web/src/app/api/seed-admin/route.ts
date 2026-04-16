import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db, tenants, users } from "@bora/db";
import { eq } from "drizzle-orm";

const SEED_SECRET = "bora-seed-2024";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== SEED_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // 1. Criar usuário via Better-Auth
    const signUpResult = await auth.api.signUpEmail({
      body: {
        email: "mkt.desiderio@gmail.com",
        password: "Bora@2024",
        name: "Admin Master",
      },
    });

    if (signUpResult.error) {
      return NextResponse.json({ error: signUpResult.error.message }, { status: 400 });
    }

    const userId = signUpResult.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Usuário criado mas ID não retornado" }, { status: 500 });
    }

    // 2. Criar tenant padrão
    const [tenant] = await db
      .insert(tenants)
      .values({ id: `tenant_master`, name: "Bora App", slug: "bora-app" })
      .onConflictDoNothing()
      .returning();

    const tenantId = tenant?.id ?? "tenant_master";

    // 3. Vincular usuário ao tenant e definir role owner
    await db
      .update(users)
      .set({ tenantId, role: "owner" })
      .where(eq(users.id, userId));

    return NextResponse.json({
      ok: true,
      message: "Usuário master criado com sucesso!",
      email: "mkt.desiderio@gmail.com",
      password: "Bora@2024",
      tenantId,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Erro interno" }, { status: 500 });
  }
}
