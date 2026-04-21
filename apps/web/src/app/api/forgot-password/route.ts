export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Endpoint de recuperação de senha.
 *
 * Estratégia atual (sem serviço de email configurado):
 *  - Valida que o email existe no banco
 *  - Registra a solicitação (placeholder — poderia salvar em tabela de audit)
 *  - Responde 200 independentemente (não vazar enumeração de emails)
 *
 * Quando for integrar email (Resend/SMTP), substituir o corpo por
 * `auth.api.forgetPassword({ body: { email, redirectTo } })` após configurar
 * `sendResetPassword` em `server/auth/index.ts`.
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }

    const supa = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } },
    );

    // Log silencioso — não expõe se o email existe ou não
    const { data } = await supa
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (data?.id) {
      console.info(`[forgot-password] solicitação registrada para userId=${data.id}`);
    } else {
      console.info(`[forgot-password] email desconhecido: ${email}`);
    }

    // Sempre 200 — não revela existência da conta
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[forgot-password]", err);
    return NextResponse.json(
      { error: "Erro ao processar solicitação" },
      { status: 500 },
    );
  }
}
