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
import { uploadOfflineConversion, toGoogleAdsDateTime } from "@/lib/google-ads-conversions";

// Planos válidos mapeados ao enum do banco
const VALID_PLANS = ["smart", "pro", "premium", "free"] as const;
type ValidPlan = (typeof VALID_PLANS)[number];

const PLAN_PRICES: Record<string, number> = { smart: 39, pro: 69, premium: 99, free: 0 };

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

  // ── 3. Filtrar eventos relevantes ─────────────────────────────────────────
  const isConfirmed = event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED";
  const isOverdue   = event === "PAYMENT_OVERDUE";

  if (!isConfirmed && !isOverdue) {
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

    // Pagamento vencido → desativa tenant
    if (isOverdue) {
      await supa.from("tenants").update({ is_active: false }).eq("id", tenantId);
      console.log(`[asaas-webhook] Tenant ${tenantId} desativado por pagamento vencido`);
      return NextResponse.json({ ok: true, tenantId, event: "OVERDUE" });
    }

    // Pagamento confirmado → ativa e renova 35 dias (tolerância de 5 dias)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 35);

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

    // ── 6. Enviar conversão ao Google Ads (server-side, idempotente via orderId) ─
    if (process.env.GOOGLE_ADS_DEVELOPER_TOKEN) {
      try {
        await uploadOfflineConversion({
          conversionDateTime: toGoogleAdsDateTime(new Date()),
          transactionId:      payment.id as string,
          currencyCode:       "BRL",
          conversionValue:    PLAN_PRICES[planKey] ?? 0,
        });
        console.log(`[asaas-webhook] Google Ads conversion uploaded: ${payment.id}`);
      } catch (adsErr: any) {
        console.error("[asaas-webhook] Google Ads upload failed:", adsErr?.message);
        // Não bloqueia o webhook — retorna 200 mesmo se o Ads falhar
      }
    }

    return NextResponse.json({ ok: true, tenantId, plan: planKey });
  } catch (err: any) {
    console.error("[asaas-webhook] exceção:", err?.message);
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
