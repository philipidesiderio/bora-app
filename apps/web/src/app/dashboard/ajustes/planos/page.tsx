"use client";
import { Check, Crown, Sparkles, Zap, Rocket, Star } from "lucide-react";

const PLANS = [
  {
    name: "Lumi Start",
    price: "R$ 0",
    period: "/mês",
    icon: Star,
    features: [
      "1 usuário",
      "100 produtos",
      "PDV básico",
      "Catálogo online",
      "Relatórios simples",
    ],
    notFeatures: ["Cupons", "Múltiplas formas de pagamento", "API"],
    current: true,
    gradient: "from-emerald-500/10 to-emerald-500/5",
    borderColor: "border-emerald-200",
    iconColor: "text-emerald-500",
  },
  {
    name: "Lumi Prime",
    price: "R$ 39",
    period: "/mês",
    icon: Zap,
    features: [
      "2 usuários",
      "Produtos ilimitados",
      "PDV completo",
      "Catálogo online",
      "Cupons de desconto",
      "Relatórios avançados",
      "Fiado e parcelamento",
    ],
    notFeatures: ["API", "Múltiplas lojas"],
    gradient: "from-blue-500/10 to-blue-500/5",
    borderColor: "border-blue-200",
    iconColor: "text-blue-500",
  },
  {
    name: "Lumi Business",
    price: "R$ 69",
    period: "/mês",
    icon: Rocket,
    popular: true,
    features: [
      "5 usuários",
      "Produtos ilimitados",
      "PDV completo",
      "Catálogo online pro",
      "Cupons avançados",
      "Relatórios completos",
      "Fiado parcelado",
      "Integração API",
    ],
    notFeatures: [],
    gradient: "from-orange-500/10 to-orange-500/5",
    borderColor: "border-orange-200",
    iconColor: "text-orange-500",
  },
  {
    name: "Lumi Elite",
    price: "R$ 99",
    period: "/mês",
    icon: Crown,
    features: [
      "Usuários ilimitados",
      "Produtos ilimitados",
      "PDV multiloja",
      "Catálogo white-label",
      "Cupons avançados",
      "Relatórios premium",
      "Fiado parcelado",
      "API completa",
      "Suporte prioritário",
    ],
    notFeatures: [],
    gradient: "from-purple-500/10 to-purple-500/5",
    borderColor: "border-purple-200",
    iconColor: "text-purple-500",
  },
];

export default function PlanosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Planos</h1>
        <p className="text-sm text-muted-foreground">Escolha o plano ideal para seu negócio</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => {
          const IconComponent = plan.icon;
          return (
          <div
            key={plan.name}
            className={`relative rounded-2xl border p-5 flex flex-col bg-gradient-to-br ${plan.gradient} ${plan.current ? plan.borderColor : "border-border"}`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-lg">
                <Sparkles className="h-3 w-3" />
                Mais popular
              </div>
            )}

            <div className="text-center mb-4">
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${plan.gradient} border ${plan.borderColor} mb-3`}>
                <IconComponent className={`h-7 w-7 ${plan.iconColor}`} />
              </div>
              <p className="font-heading font-bold text-lg">{plan.name}</p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-2xl font-bold text-primary">{plan.price}</span>
                <span className="text-xs text-muted-foreground">{plan.period}</span>
              </div>
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
              className={`w-full py-2.5 rounded-xl font-semibold transition-all ${
                plan.current
                  ? "bg-muted text-muted-foreground cursor-default"
                  : "bg-primary text-white hover:bg-primary/90"
              }`}
              disabled={plan.current}
            >
              {plan.current ? "Plano atual" : "Assinar"}
            </button>
          </div>
          );
        })}
      </div>

      <div className="p-4 rounded-xl bg-muted/30 border border-dashed border-border">
        <p className="text-sm text-muted-foreground text-center">
          Precisa de algo personalizado? <span className="text-primary font-semibold cursor-pointer">Fale conosco</span>
        </p>
      </div>
    </div>
  );
}