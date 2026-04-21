import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure, tenantProcedure } from "../trpc";
import * as asaas from "@/lib/asaas";

// ─── Planos disponíveis ───────────────────────────────────────────────────────

export const PLAN_CONFIG = {
  free: {
    label:    "Lumi Start",
    price:    0,
    planKey:  "free" as const,
  },
  smart: {
    label:    "Lumi Prime",
    price:    39,
    planKey:  "smart" as const,
  },
  pro: {
    label:    "Lumi Business",
    price:    69,
    planKey:  "pro" as const,
  },
  premium: {
    label:    "Lumi Elite",
    price:    99,
    planKey:  "premium" as const,
  },
} as const;

type PlanKey = keyof typeof PLAN_CONFIG;

// ─── Router ───────────────────────────────────────────────────────────────────

export const billingRouter = createTRPCRouter({

  /** Retorna configuração estática dos planos (sem autenticação) */
  getPlans: publicProcedure.query(() => PLAN_CONFIG),

  /** Retorna plano atual do tenant logado + status de expiração */
  getCurrentPlan: tenantProcedure.query(({ ctx }) => {
    const plan = (ctx.tenant as any).plan ?? "free";
    const expiresRaw = (ctx.tenant as any).plan_expires_at;
    const expiresAt  = expiresRaw ? new Date(expiresRaw) : null;
    const now        = new Date();
    const isActive   = plan === "free" || (expiresAt ? expiresAt > now : false);
    const daysRemaining = expiresAt
      ? Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / 86_400_000))
      : null;

    return {
      plan:           plan as PlanKey,
      planLabel:      PLAN_CONFIG[plan as PlanKey]?.label ?? plan,
      expiresAt:      expiresRaw ?? null,
      isActive,
      daysRemaining,
    };
  }),

  /**
   * Cria uma cobrança PIX no Asaas para o plano desejado.
   * Retorna QR Code base64 + código copia-e-cola.
   */
  createCheckout: tenantProcedure
    .input(z.object({ plan: z.enum(["smart", "pro", "premium"]) }))
    .mutation(async ({ ctx, input }) => {
      if (!process.env.ASAAS_API_KEY) {
        throw new TRPCError({
          code:    "PRECONDITION_FAILED",
          message: "Gateway de pagamento não configurado. Entre em contato com o suporte.",
        });
      }

      const config = PLAN_CONFIG[input.plan];
      const tenant = ctx.tenant as any;

      // ── 1. Buscar ou criar customer no Asaas ──────────────────────────────
      let customerId: string = tenant.asaas_customer_id ?? "";

      if (!customerId) {
        const customer = await asaas.createCustomer({
          name:     tenant.name,
          cpfCnpj:  tenant.cnpj   ?? undefined,
          phone:    tenant.phone  ?? undefined,
          email:    (ctx.session as any).user?.email ?? undefined,
        });
        customerId = customer.id;

        // Salva para reutilizar nas próximas cobranças
        await ctx.supa
          .from("tenants")
          .update({ asaas_customer_id: customerId } as any)
          .eq("id", tenant.id);
      }

      // ── 2. Criar cobrança PIX ─────────────────────────────────────────────
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dueDate = tomorrow.toISOString().slice(0, 10);

      // externalReference: "tenantId|planKey" — usado pelo webhook para atualizar o tenant
      const externalRef = `${tenant.id}|${input.plan}`;

      const payment = await asaas.createPixPayment({
        customer:          customerId,
        billingType:       "PIX",
        value:             config.price,
        dueDate,
        description:       `${config.label} - lumiPOS (mensal)`,
        externalReference: externalRef,
      });

      // ── 3. Obter QR Code PIX ──────────────────────────────────────────────
      const qr = await asaas.getPixQrCode(payment.id);

      return {
        paymentId:    payment.id,
        amount:       config.price,
        planLabel:    config.label,
        pixQrCode:    qr.encodedImage,   // base64 PNG
        pixCopyPaste: qr.payload,        // copia-e-cola
        expiresAt:    qr.expirationDate ?? dueDate,
      };
    }),

  /** Verifica status do pagamento diretamente na API Asaas (usado para polling) */
  checkPayment: tenantProcedure
    .input(z.object({ paymentId: z.string() }))
    .query(async ({ input }) => {
      if (!process.env.ASAAS_API_KEY) return { status: "PENDING" as const };
      try {
        const payment = await asaas.getPayment(input.paymentId);
        return { status: payment.status };
      } catch {
        return { status: "PENDING" as const };
      }
    }),
});
