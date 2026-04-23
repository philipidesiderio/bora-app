"use client";
import { useState, useEffect, useRef } from "react";
import { api } from "@/components/providers/trpc-provider";
import { trackBeginCheckout, trackPurchase, trackClickAssinar } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import {
  Check, Crown, Sparkles, Zap, Rocket, Star,
  Copy, CheckCheck, Loader2, X, AlertCircle,
} from "lucide-react";

// ─── Configuração dos planos (espelha PLAN_CONFIG do servidor) ──────────────

const PLANS = [
  {
    key:         "free" as const,
    name:        "Lumi Start",
    price:       "R$ 0",
    priceNum:    0,
    period:      "/mês",
    icon:        Star,
    features:    ["1 usuário", "100 produtos", "PDV básico", "Catálogo online", "Relatórios simples"],
    notFeatures: ["Cupons", "Múltiplas formas de pagamento", "API"],
    gradient:    "from-emerald-500/10 to-emerald-500/5",
    border:      "border-emerald-200",
    iconColor:   "text-emerald-500",
  },
  {
    key:         "smart" as const,
    name:        "Lumi Prime",
    price:       "R$ 39",
    priceNum:    39,
    period:      "/mês",
    icon:        Zap,
    features:    ["2 usuários", "Produtos ilimitados", "PDV completo", "Catálogo online", "Cupons de desconto", "Relatórios avançados", "Fiado e parcelamento"],
    notFeatures: ["API", "Múltiplas lojas"],
    gradient:    "from-blue-500/10 to-blue-500/5",
    border:      "border-blue-200",
    iconColor:   "text-blue-500",
  },
  {
    key:         "pro" as const,
    name:        "Lumi Business",
    price:       "R$ 69",
    priceNum:    69,
    period:      "/mês",
    icon:        Rocket,
    popular:     true,
    features:    ["5 usuários", "Produtos ilimitados", "PDV completo", "Catálogo online pro", "Cupons avançados", "Relatórios completos", "Fiado parcelado", "Integração API"],
    notFeatures: [],
    gradient:    "from-orange-500/10 to-orange-500/5",
    border:      "border-orange-200",
    iconColor:   "text-orange-500",
  },
  {
    key:         "premium" as const,
    name:        "Lumi Elite",
    price:       "R$ 99",
    priceNum:    99,
    period:      "/mês",
    icon:        Crown,
    features:    ["Usuários ilimitados", "Produtos ilimitados", "PDV multiloja", "Catálogo white-label", "Cupons avançados", "Relatórios premium", "Fiado parcelado", "API completa", "Suporte prioritário"],
    notFeatures: [],
    gradient:    "from-purple-500/10 to-purple-500/5",
    border:      "border-purple-200",
    iconColor:   "text-purple-500",
  },
];

type PaidPlanKey = "smart" | "pro" | "premium";

interface CheckoutData {
  paymentId:    string;
  amount:       number;
  planLabel:    string;
  pixQrCode:    string;  // base64 PNG
  pixCopyPaste: string;
  expiresAt:    string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("pt-BR");
}

function useCountdown(targetIso: string | null) {
  const [secs, setSecs] = useState<number>(0);
  useEffect(() => {
    if (!targetIso) return;
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(targetIso).getTime() - Date.now()) / 1000));
      setSecs(diff);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetIso]);
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return { display: `${m}:${s}`, expired: secs === 0 };
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function PlanosPage() {
  const planQ    = api.billing.getCurrentPlan.useQuery(undefined, { refetchInterval: 6000 });
  const checkout = api.billing.createCheckout.useMutation();

  const [modal, setModal]         = useState<CheckoutData | null>(null);
  const [copied, setCopied]       = useState(false);
  const [success, setSuccess]     = useState(false);
  const [cpfModal, setCpfModal]   = useState<PaidPlanKey | null>(null);
  const [cpfValue, setCpfValue]   = useState("");
  const [cpfError, setCpfError]   = useState("");
  const prevPlan                  = useRef<string | null>(null);
  const checkoutDataRef           = useRef<CheckoutData | null>(null);

  const currentPlan = planQ.data?.plan ?? "free";

  // Detecta quando o plano muda (webhook confirmou pagamento)
  useEffect(() => {
    if (!planQ.data) return;
    if (prevPlan.current && prevPlan.current !== planQ.data.plan) {
      const cd = checkoutDataRef.current;
      if (cd) {
        const planCfg = PLANS.find(p => p.key === planQ.data!.plan);
        trackPurchase({
          transactionId: cd.paymentId,
          planKey:       planQ.data.plan,
          planLabel:     cd.planLabel,
          value:         planCfg?.priceNum ?? cd.amount,
          currency:      "BRL",
        });
        checkoutDataRef.current = null;
      }
      setModal(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 6000);
    }
    prevPlan.current = planQ.data.plan;
  }, [planQ.data?.plan]);

  async function handleSubscribe(planKey: PaidPlanKey, cpfCnpj?: string) {
    try {
      const data = await checkout.mutateAsync({ plan: planKey, cpfCnpj });
      const planCfg = PLANS.find(p => p.key === planKey);
      trackBeginCheckout({
        planKey,
        planLabel: data.planLabel,
        value:     planCfg?.priceNum ?? data.amount,
        currency:  "BRL",
      });
      checkoutDataRef.current = data;
      setCpfModal(null);
      setModal(data);
    } catch (err: any) {
      const msg = err?.message ?? "";
      if (msg === "CPF_CNPJ_REQUIRED") {
        // Abre modal para coletar CPF/CNPJ
        setCpfValue("");
        setCpfError("");
        setCpfModal(planKey);
      } else {
        alert(msg || "Erro ao gerar cobrança. Tente novamente.");
      }
    }
  }

  async function handleCpfSubmit() {
    const digits = cpfValue.replace(/\D/g, "");
    if (digits.length !== 11 && digits.length !== 14) {
      setCpfError("Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.");
      return;
    }
    setCpfError("");
    if (cpfModal) await handleSubscribe(cpfModal, digits);
  }

  function handleCopy() {
    if (!modal) return;
    navigator.clipboard.writeText(modal.pixCopyPaste).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  const countdown = useCountdown(modal?.expiresAt ?? null);

  return (
    <div className="space-y-6 pb-28 md:pb-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Planos</h1>
        <p className="text-sm text-muted-foreground">Escolha o plano ideal para seu negócio</p>
      </div>

      {/* Plano ativo */}
      {planQ.data && planQ.data.plan !== "free" && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm">
          <CheckCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span className="text-emerald-800">
            <span className="font-semibold">{planQ.data.planLabel}</span> ativo
            {planQ.data.expiresAt && (
              <> — renova em <span className="font-semibold">{fmtDate(planQ.data.expiresAt)}</span>
              {planQ.data.daysRemaining !== null && ` (${planQ.data.daysRemaining} dias)`}</>
            )}
          </span>
        </div>
      )}

      {/* Banner de sucesso após upgrade */}
      {success && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm animate-in slide-in-from-top-2">
          <CheckCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span className="text-emerald-800 font-semibold">🎉 Plano ativado com sucesso!</span>
        </div>
      )}

      {/* Cards dos planos */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {PLANS.map(plan => {
          const Icon       = plan.icon;
          const isCurrent  = currentPlan === plan.key;
          const isUpgrade  = PLANS.findIndex(p => p.key === plan.key) > PLANS.findIndex(p => p.key === currentPlan);
          const isDowngrade = PLANS.findIndex(p => p.key === plan.key) < PLANS.findIndex(p => p.key === currentPlan);
          const loading    = checkout.isPending && checkout.variables?.plan === plan.key;

          return (
            <div
              key={plan.key}
              className={cn(
                "relative rounded-2xl border p-5 flex flex-col bg-gradient-to-br",
                plan.gradient,
                isCurrent ? plan.border : "border-border",
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-lg">
                  <Sparkles className="h-3 w-3" />
                  Mais popular
                </div>
              )}

              {isCurrent && (
                <div className="absolute -top-3 right-4 px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full">
                  Ativo
                </div>
              )}

              <div className="text-center mb-4">
                <div className={cn(
                  "inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br border mb-3",
                  plan.gradient, plan.border,
                )}>
                  <Icon className={cn("h-7 w-7", plan.iconColor)} />
                </div>
                <p className="font-heading font-bold text-lg">{plan.name}</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-2xl font-bold text-primary">{plan.price}</span>
                  <span className="text-xs text-muted-foreground">{plan.period}</span>
                </div>
                {isCurrent && planQ.data?.expiresAt && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    até {fmtDate(planQ.data.expiresAt)}
                  </p>
                )}
              </div>

              <div className="space-y-2 flex-1 mb-4">
                {plan.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
                {plan.notFeatures.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-4 w-4 rounded-full border border-border flex-shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              <button
                disabled={isCurrent || isDowngrade || loading || planQ.isLoading}
                onClick={() => {
                  if (plan.key !== "free") {
                    trackClickAssinar(plan.key);
                    void handleSubscribe(plan.key as PaidPlanKey);
                  }
                }}
                className={cn(
                  "w-full py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2",
                  isCurrent || isDowngrade
                    ? "bg-muted text-muted-foreground cursor-default"
                    : "bg-primary text-white hover:bg-primary/90 active:scale-[0.98]",
                )}
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isCurrent  ? "Plano atual"
                 : isDowngrade ? "Plano inferior"
                 : isUpgrade   ? "Fazer upgrade"
                 : "Assinar"}
              </button>
            </div>
          );
        })}
      </div>

      <div className="p-4 rounded-xl bg-muted/30 border border-dashed border-border">
        <p className="text-sm text-muted-foreground text-center">
          Precisa de algo personalizado?{" "}
          <span className="text-primary font-semibold cursor-pointer">Fale conosco</span>
        </p>
      </div>

      {/* ─── Modal CPF/CNPJ ────────────────────────────────────────────────── */}
      {cpfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setCpfModal(null)} />
          <div className="relative z-10 bg-card border border-border rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-heading font-bold text-lg">Identificação</p>
              <button onClick={() => setCpfModal(null)} className="p-2 rounded-xl hover:bg-muted transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              O Asaas exige CPF ou CNPJ para emitir a cobrança. Informe apenas uma vez — salvamos para as próximas renovações.
            </p>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">CPF ou CNPJ (só números)</label>
              <input
                value={cpfValue}
                onChange={e => { setCpfValue(e.target.value.replace(/\D/g, "")); setCpfError(""); }}
                placeholder="000.000.000-00 ou 00.000.000/0001-00"
                maxLength={14}
                className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {cpfError && (
                <p className="text-xs text-rose-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />{cpfError}
                </p>
              )}
            </div>
            <button
              onClick={handleCpfSubmit}
              disabled={checkout.isPending}
              className="w-full py-2.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              {checkout.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Continuar para pagamento
            </button>
          </div>
        </div>
      )}

      {/* ─── Modal de pagamento PIX ─────────────────────────────────────────── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModal(null)} />
          <div className="relative z-10 bg-card border border-border rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <p className="font-heading font-bold text-lg">Pagar via PIX</p>
                <p className="text-xs text-muted-foreground">{modal.planLabel} — R$ {modal.amount},00/mês</p>
              </div>
              <button
                onClick={() => setModal(null)}
                className="p-2 rounded-xl hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {/* QR Code */}
              <div className="flex justify-center">
                {modal.pixQrCode ? (
                  <img
                    src={`data:image/png;base64,${modal.pixQrCode}`}
                    alt="QR Code PIX"
                    className="w-52 h-52 rounded-xl border border-border"
                  />
                ) : (
                  <div className="w-52 h-52 rounded-xl bg-muted flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Countdown */}
              <div className="text-center">
                {countdown.expired ? (
                  <div className="flex items-center justify-center gap-2 text-rose-600 text-sm font-semibold">
                    <AlertCircle className="h-4 w-4" />
                    QR Code expirado — feche e tente novamente
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Válido por{" "}
                    <span className="font-mono font-bold text-foreground">{countdown.display}</span>
                  </p>
                )}
              </div>

              {/* Copia e cola */}
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Ou copie o código PIX:</p>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={modal.pixCopyPaste}
                    className="flex-1 text-xs bg-muted rounded-lg px-3 py-2 font-mono border border-border truncate"
                  />
                  <button
                    onClick={handleCopy}
                    className="flex-shrink-0 p-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
                    title="Copiar código PIX"
                  >
                    {copied
                      ? <CheckCheck className="h-4 w-4" />
                      : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Instrução */}
              <div className="rounded-xl bg-muted/60 px-4 py-3 text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">Como pagar:</p>
                <p>1. Abra o app do seu banco</p>
                <p>2. Escolha Pix → Pagar com QR Code</p>
                <p>3. Escaneie o QR ou cole o código</p>
                <p>4. Seu plano será ativado automaticamente ✓</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
