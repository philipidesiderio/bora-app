export const dynamic = 'force-dynamic';

/**
 * Webhook Asaas — confirma pagamento e atualiza plano do tenant
 *
 * Configurar no painel Asaas:
 *   URL: https://seu-dominio.com/api/webhooks/asaas
 *   Eventos: PAYMENT_CONFIRMED, PAYMENT_RECEIVED
 *
 * Variáveis de ambiente:
 *   ASAAS_API_KEY            → chave da API (usada para validar o webhook)
 *   SUPABASE_SERVICE_ROLE_KEY → chave de serviço do Supabase (bypass RLS)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Planos válidos mapeados ao enum do banco
const VALID_PLANS = ["smart", "pro", "premium", "free"] as const;
type ValidPlan = (typeof VALID_PLANS)[number];

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: NextRequest) {
  // ── 1. Validar token do webhook ────────────────────────────────────────────
  // Usa ASAAS_WEBHOOK_TOKEN (gerado no painel Asaas) para validar a origem
  const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN ?? process.env.ASAAS_API_KEY;
  if (webhookToken) {
    const incoming =
      req.headers.get("access_token") ??
      req.headers.get("asaas-access-token") ??
      req.headers.get("authorization")?.replace("Bearer ", "");
    if (incoming !== webhookToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // ── 2. Ler payload ─────────────────────────────────────────────────────────
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = body?.event as string;

  // ── 3. Só processar confirmações de pagamento ──────────────────────────────
  if (event !== "PAYMENT_CONFIRMED" && event !== "PAYMENT_RECEIVED") {
    return NextResponse.json({ ok: true, skipped: event });
  }

  const payment = body?.payment;
  if (!payment?.externalReference) {
    return NextResponse.json({ ok: true, reason: "no externalReference" });
  }

  // ── 4. Extrair tenantId e plano da externalReference ──────────────────────
  // Formato: "tenantId|planKey"
  const parts     = (payment.externalReference as string).split("|");
  const tenantId  = parts[0];
  const planKey   = parts[1] as ValidPlan;

  if (!tenantId || !VALID_PLANS.includes(planKey)) {
    console.error("[asaas-webhook] externalReference inválida:", payment.externalReference);
    return NextResponse.json({ ok: true, reason: "invalid ref" });
  }

  // ── 5. Atualizar plano do tenant ───────────────────────────────────────────
  try {
    const supa = getAdminSupabase();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const { error } = await supa
      .from("tenants")
      .update({
        plan:             planKey,
        plan_expires_at:  expiresAt.toISOString(),
        is_active:        true,
      })
      .eq("id", tenantId);

    if (error) {
      console.error("[asaas-webhook] erro ao atualizar tenant:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`[asaas-webhook] Tenant ${tenantId} → plano ${planKey} até ${expiresAt.toDateString()}`);
    return NextResponse.json({ ok: true, tenantId, plan: planKey });
  } catch (err: any) {
    console.error("[asaas-webhook] exceção:", err?.message);
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
