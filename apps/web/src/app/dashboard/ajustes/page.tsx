"use client";
import Link from "next/link";
import {
  Building2, Database, Bell, UserCog, Shield, Smartphone, Key,
  Tv, CreditCard, MonitorPlay, Gem, ChevronRight, Settings
} from "lucide-react";

const SECTIONS = [
  {
    title: "Gestão do Negócio",
    items: [
      { href: "/dashboard/ajustes/dados",        icon: Building2,   label: "Dados do Negócio",    desc: "Nome, endereço, CNPJ" },
      { href: "/dashboard/ajustes/gestao-dados",  icon: Database,    label: "Gestão de Dados",     desc: "Backup e exportação" },
      { href: "/dashboard/ajustes/notificacoes",  icon: Bell,        label: "Notificações",        desc: "Alertas e avisos" },
      { href: "/dashboard/ajustes/usuarios",      icon: UserCog,     label: "Usuários",            desc: "Gerenciar acessos" },
      { href: "/dashboard/ajustes/permissoes",    icon: Shield,      label: "Permissões",          desc: "Controle de acesso" },
      { href: "/dashboard/ajustes/dispositivos",  icon: Smartphone,  label: "Dispositivos",        desc: "Terminais e PDVs" },
      { href: "/dashboard/ajustes/senha-venda",   icon: Key,         label: "Senha na venda",      desc: "Segurança no PDV" },
    ],
  },
  {
    title: "Integrações",
    items: [
      { href: "/dashboard/ajustes/totem",         icon: Tv,          label: "Totem Digital",       desc: "Autoatendimento", badge: "PREMIUM" },
      { href: "/dashboard/ajustes/maquininhas",   icon: CreditCard,  label: "Maquininhas",         desc: "Integração de pagamento" },
      { href: "/dashboard/ajustes/equipamentos",  icon: MonitorPlay, label: "Equipamentos",        desc: "Impressoras e periféricos" },
      { href: "/dashboard/ajustes/smartpos",      icon: Smartphone,  label: "SmartPOS API",        desc: "API para SmartPOS", badge: "PREMIUM" },
    ],
  },
  {
    title: "Planos",
    items: [
      { href: "/dashboard/ajustes/planos",        icon: Gem,         label: "Meus Planos",         desc: "Assinar ou mudar plano" },
    ],
  },
];

export default function AjustesPage() {
  return (
    <div className="p-4 md:p-6 space-y-6 pb-28 md:pb-6">
      <div>
        <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6" /> Configurações
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Gerencie as configurações do seu negócio</p>
      </div>

      <div className="space-y-6">
        {SECTIONS.map(section => (
          <div key={section.title}>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 px-1">
              {section.title}
            </p>
            <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border/60">
              {section.items.map(item => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 transition-colors active:bg-muted/60"
                  >
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{item.label}</p>
                        {(item as any).badge && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-500 text-white">
                            {(item as any).badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
