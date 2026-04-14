"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef } from "react";
import { cn, getInitials, PLAN_LABELS } from "@/lib/utils";
import type { User } from "@bora/db";
import { 
  ChevronRight, 
  FileText, 
  Calendar, 
  BarChart3, 
  FileSignature, 
  Wallet, 
  CreditCard, 
  ShoppingBag, 
  Settings,
  FolderOpen,
  Package,
  Scissors,
  Gift,
  Upload,
  FileCode,
  Sliders,
  Truck,
  PenTool,
  Users,
  Receipt,
  TrendingUp,
  DollarSign,
  ArrowLeftRight,
  Box,
  PartyPopper,
  Zap,
  Building,
  Calculator,
  Gauge,
  Link as LinkIcon,
  Layers,
  Monitor,
  Ticket,
  Palette,
  Image,
  BookOpen,
  Plug,
  Store,
  Trophy,
  Building2,
  Database,
  Bell,
  UserCog,
  Shield,
  Smartphone,
  Key,
  Tv,
  MonitorPlay,
  Printer
} from "lucide-react";

type NavItem = {
  href: string;
  icon: string;
  label: string;
  badge?: string;
  badgeColor?: "orange" | "yellow" | "default";
};

type NavGroup = {
  groupLabel: string;
  items: NavItem[];
};

type NavSection = {
  label: string;
  icon: string;
  items?: NavItem[];
  groups?: NavGroup[];
};

// Mapeamento de ícones para componentes React
const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  // Nível 1
  cadastros: FileText,
  calendario: Calendar,
  relatorios: BarChart3,
  fiscal: FileSignature,
  financeiro: Wallet,
  pagamentos: CreditCard,
  catalogo: ShoppingBag,
  configuracoes: Settings,
  // Submenus
  categorias: FolderOpen,
  produtos: Package,
  servicos: Scissors,
  combos: Gift,
  importarxls: Upload,
  importarnota: FileCode,
  modificadores: Sliders,
  fornecedores: Truck,
  editarestoque: PenTool,
  vendedores: Users,
  clientes: Users,
  vendas: Receipt,
  pedidos: TrendingUp,
  graficos: BarChart3,
  consulavendas: DollarSign,
  produtosservicos: ShoppingBag,
  tipopagamento: CreditCard,
  vendasvendedor: Users,
  vendasclientes: Users,
  devolucoes: ArrowLeftRight,
  caixa: Wallet,
  entradassaidas: ArrowLeftRight,
  operacional: Box,
  movimentacoes: PartyPopper,
  aniversariantes: PartyPopper,
  ativarnfe: Zap,
  grupostributarios: FileText,
  regrasibs: FileSignature,
  notasemitidas: FileSignature,
  historiocontador: FileText,
  inutilizar: FileSignature,
  terminais: Monitor,
  contaspagar: ArrowLeftRight,
  contasreceber: ArrowLeftRight,
  contascliente: Users,
  fluxofinanceiro: TrendingUp,
  pixpagseguro: Zap,
  pixaixada: Zap,
  tipos: CreditCard,
  adquirentes: Building,
  paineltaxas: Gauge,
  relatoriotaxas: BarChart3,
  linkpagamento: LinkIcon,
  pedidosloja: ShoppingBag,
  monitoramento: Monitor,
  configuracoess: Settings,
  cupons: Ticket,
  personalizacao: Palette,
  banner: Image,
  cardapio: BookOpen,
  integracoes: Plug,
  vitrine: Store,
  top10: Trophy,
  dados: Building2,
  gestaodedados: Database,
  notificacoes: Bell,
  usuarios: UserCog,
  permissoes: Shield,
  dispositivos: Smartphone,
  senhavenda: Key,
  totem: Tv,
  maquininhas: CreditCard,
  equipamentos: MonitorPlay,
  smartpos: Smartphone,
};

function IconDisplay({ icon, className }: { icon: string; className?: string }) {
  const IconComponent = ICONS[icon] || FileText;
  return <IconComponent className={className} />;
}

// Estrutura de menus principais (Nível 1) - com ícones outline
const MAIN_MENU: { label: string; icon: string; key: string }[] = [
  { label: "Cadastros", icon: "cadastros", key: "cadastros" },
  { label: "Calendário", icon: "calendario", key: "calendario" },
  { label: "Gráficos", icon: "graficos", key: "graficos" },
  { label: "Relatórios", icon: "relatorios", key: "relatorios" },
  { label: "Área Fiscal", icon: "fiscal", key: "fiscal" },
  { label: "Financeiro", icon: "financeiro", key: "financeiro" },
  { label: "Pagamentos", icon: "pagamentos", key: "pagamentos" },
  { label: "Catálogo", icon: "catalogo", key: "catalogo" },
  { label: "Configurações", icon: "configuracoes", key: "configuracoes" },
];

// Dados dos submenus (Nível 2) - com icon keys
const SUBMENUS: Record<string, NavSection> = {
  cadastros: {
    label: "Cadastros",
    icon: "cadastros",
    items: [
      { href: "/dashboard/categorias", icon: "categorias", label: "Categorias" },
      { href: "/dashboard/produtos", icon: "produtos", label: "Produtos" },
      { href: "/dashboard/servicos", icon: "servicos", label: "Serviços", badge: "ESSENCIAL", badgeColor: "orange" },
      { href: "/dashboard/combos", icon: "combos", label: "Combo de Produtos", badge: "PREMIUM", badgeColor: "yellow" },
      { href: "/dashboard/importar-produtos", icon: "importarxls", label: "Importar produtos XLS" },
      { href: "/dashboard/importar-xml", icon: "importarnota", label: "Importar Nota XML", badge: "ESSENCIAL", badgeColor: "orange" },
      { href: "/dashboard/modificadores", icon: "modificadores", label: "Modificadores" },
      { href: "/dashboard/fornecedores", icon: "fornecedores", label: "Fornecedores" },
      { href: "/dashboard/estoque-editar", icon: "editarestoque", label: "Edição de Estoque" },
      { href: "/dashboard/vendedores", icon: "vendedores", label: "Vendedores" },
      { href: "/dashboard/clientes", icon: "clientes", label: "Clientes" },
    ]
  },
  calendario: {
    label: "Calendário",
    icon: "calendario",
    items: [
      { href: "/dashboard/vendas", icon: "vendas", label: "Vendas", badge: "ESSENCIAL", badgeColor: "orange" },
      { href: "/dashboard/pedidos", icon: "pedidos", label: "Pedidos", badge: "ESSENCIAL", badgeColor: "orange" },
    ]
  },
  graficos: {
    label: "Gráficos",
    icon: "graficos",
    items: [
      { href: "/dashboard", icon: "graficos", label: "Dashboard Geral" },
    ]
  },
  relatorios: {
    label: "Relatórios",
    icon: "relatorios",
    groups: [
      {
        groupLabel: "Vendas",
        items: [
          { href: "/dashboard/relatorios/vendas", icon: "consulavendas", label: "Consulta de Vendas" },
          { href: "/dashboard/relatorios/produtos-mais-vendidos", icon: "produtosservicos", label: "Produtos mais Vendidos" },
          { href: "/dashboard/relatorios/servicos-mais-vendidos", icon: "servicos", label: "Serviços mais Vendidos" },
          { href: "/dashboard/relatorios/produtos-servicos-vendidos", icon: "produtosservicos", label: "Produtos/Serviços mais Vendidos" },
          { href: "/dashboard/relatorios/vendas-tipo-pagamento", icon: "tipopagamento", label: "Vendas por Tipo de Pagamento" },
          { href: "/dashboard/relatorios/vendas-vendedor", icon: "vendasvendedor", label: "Vendas por Vendedor" },
          { href: "/dashboard/relatorios/vendas-categorias", icon: "categorias", label: "Vendas por Categorias" },
          { href: "/dashboard/relatorios/vendas-clientes", icon: "vendasclientes", label: "Vendas por Clientes" },
          { href: "/dashboard/relatorios/devolucoes", icon: "devolucoes", label: "Devoluções" },
        ]
      },
      {
        groupLabel: "Caixa",
        items: [
          { href: "/dashboard/relatorios/caixa", icon: "caixa", label: "Consulta de Caixa" },
          { href: "/dashboard/relatorios/entradas-saidas", icon: "entradassaidas", label: "Entradas e Saídas" },
        ]
      },
      {
        groupLabel: "Operacional",
        items: [
          { href: "/dashboard/relatorios/produtos", icon: "produtos", label: "Produtos" },
          { href: "/dashboard/relatorios/estoque", icon: "movimentacoes", label: "Movimentações de Estoque" },
          { href: "/dashboard/relatorios/aniversariantes", icon: "aniversariantes", label: "Aniversariantes" },
        ]
      }
    ]
  },
  fiscal: {
    label: "Área Fiscal",
    icon: "fiscal",
    items: [
      { href: "/dashboard/fiscal/ativar", icon: "ativarnfe", label: "Ativar emissão NFE/NFC-e", badge: "PREMIUM", badgeColor: "yellow" },
      { href: "/dashboard/fiscal/grupos-tributarios", icon: "grupostributarios", label: "Grupos de Regras Tributárias", badge: "PREMIUM", badgeColor: "yellow" },
      { href: "/dashboard/fiscal/regras-ibs", icon: "regrasibs", label: "Regras IBS, CBS e IS", badge: "PREMIUM", badgeColor: "yellow" },
      { href: "/dashboard/fiscal/notas-emitidas", icon: "notasemitidas", label: "Notas Emitidas", badge: "PREMIUM", badgeColor: "yellow" },
      { href: "/dashboard/fiscal/historico-contador", icon: "historiocontador", label: "Histórico deNotas do Contador", badge: "PREMIUM", badgeColor: "yellow" },
      { href: "/dashboard/fiscal/inutilizar", icon: "inutilizar", label: "Inutilização de Notas Fiscais" },
      { href: "/dashboard/fiscal/terminais", icon: "terminais", label: "Terminais" },
    ]
  },
  financeiro: {
    label: "Financeiro",
    icon: "financeiro",
    items: [
      { href: "/dashboard/financeiro/contas-pagar", icon: "contaspagar", label: "Contas a pagar" },
      { href: "/dashboard/financeiro/contas-receber", icon: "contasreceber", label: "Contas a receber" },
      { href: "/dashboard/financeiro/contas-cliente", icon: "contascliente", label: "Contas de Cliente (Fiado)" },
      { href: "/dashboard/financeiro/fluxo", icon: "fluxofinanceiro", label: "Fluxo Financeiro" },
    ]
  },
  pagamentos: {
    label: "Pagamentos",
    icon: "pagamentos",
    groups: [
      {
        groupLabel: "Área PIX",
        items: [
          { href: "/dashboard/pagamentos/pix-pagseguro", icon: "pixpagseguro", label: "PIX PagSeguro" },
          { href: "/dashboard/pagamentos/pix-padrao", icon: "pixaixada", label: "PIX Padrão" },
        ]
      },
      {
        groupLabel: "Pagamentos",
        items: [
          { href: "/dashboard/pagamentos/tipos", icon: "tipos", label: "Tipos de pagamento" },
          { href: "/dashboard/pagamentos/adquirentes", icon: "adquirentes", label: "Adquirentes/Taxas" },
          { href: "/dashboard/pagamentos/painel-taxas", icon: "paineltaxas", label: "Painel de taxas" },
          { href: "/dashboard/pagamentos/relatorio-taxas", icon: "relatoriotaxas", label: "Relatório de taxas" },
        ]
      },
      {
        groupLabel: "Link de Pagamento",
        items: [
          { href: "/dashboard/pagamentos/link-pagamento", icon: "linkpagamento", label: "Link Pagamento PagSeguro" },
        ]
      }
    ]
  },
  catalogo: {
    label: "Catálogo",
    icon: "catalogo",
    items: [
      { href: "/dashboard/catalogo/pedidos", icon: "pedidosloja", label: "Pedidos" },
      { href: "/dashboard/catalogo/monitoramento", icon: "monitoramento", label: "Monitoramento de Pedidos", badge: "ESSENCIAL", badgeColor: "orange" },
      { href: "/dashboard/catalogo/configuracoes", icon: "configuracoess", label: "Configurações" },
      { href: "/dashboard/catalogo/cupons", icon: "cupons", label: "Cupom de desconto", badge: "ESSENCIAL", badgeColor: "orange" },
      { href: "/dashboard/catalogo/personalizacao", icon: "personalizacao", label: "Personalização" },
      { href: "/dashboard/catalogo/banner", icon: "banner", label: "Banner", badge: "ESSENCIAL", badgeColor: "orange" },
      { href: "/dashboard/catalogo/cardapio", icon: "cardapio", label: "Cardápio digital", badge: "ESSENCIAL", badgeColor: "orange" },
      { href: "/dashboard/catalogo/integracoes", icon: "integracoes", label: "Integrações", badge: "ESSENCIAL", badgeColor: "orange" },
      { href: "/dashboard/catalogo/vitrine", icon: "vitrine", label: "Vitrine" },
      { href: "/dashboard/catalogo/top10", icon: "top10", label: "Top 10 Catálogos" },
    ]
  },
  configuracoes: {
    label: "Configurações",
    icon: "configuracoes",
    groups: [
      {
        groupLabel: "Gestão do Negócio",
        items: [
          { href: "/dashboard/ajustes/dados", icon: "dados", label: "Dados do Negócio" },
          { href: "/dashboard/ajustes/gestao-dados", icon: "gestaodedados", label: "Gestão de Dados" },
          { href: "/dashboard/ajustes/notificacoes", icon: "notificacoes", label: "Notificações" },
          { href: "/dashboard/ajustes/usuarios", icon: "usuarios", label: "Usuários" },
          { href: "/dashboard/ajustes/permissoes", icon: "permissoes", label: "Permissões" },
          { href: "/dashboard/ajustes/dispositivos", icon: "dispositivos", label: "Dispositivos" },
          { href: "/dashboard/ajustes/senha-venda", icon: "senhavenda", label: "Senha na venda" },
        ]
      },
      {
        groupLabel: "Integrações",
        items: [
          { href: "/dashboard/ajustes/totem", icon: "totem", label: "Totem Digital", badge: "PREMIUM", badgeColor: "yellow" },
          { href: "/dashboard/ajustes/maquininhas", icon: "maquininhas", label: "Maquininhas" },
          { href: "/dashboard/ajustes/equipamentos", icon: "equipamentos", label: "Equipamentos" },
          { href: "/dashboard/ajustes/smartpos", icon: "smartpos", label: "SmartPOS API", badge: "PREMIUM", badgeColor: "yellow" },
        ]
      }
    ]
  },
};

// Função para obter cor do badge
function getBadgeClass(color?: "orange" | "yellow" | "default") {
  switch (color) {
    case "orange":
      return "bg-orange-500";
    case "yellow":
      return "bg-yellow-500";
    default:
      return "bg-primary";
  }
}

interface SidebarProps { user: User & { tenant?: { name: string; plan: string } | null } }

// Componente do painel Flyout (submenu) - com ícones outline
function FlyoutPanel({ sectionKey }: { sectionKey: string }) {
  const pathname = usePathname();
  const section = SUBMENUS[sectionKey];
  
  if (!section) return null;
  
  return (
    <div className="absolute left-full top-0 ml-0 w-64 bg-card border-r border-border h-full overflow-y-auto z-50">
      {/* Cabeçalho do painel - apenas título sem botão de fechar */}
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <IconDisplay icon={section.icon} className="w-5 h-5 text-muted-foreground" />
          <span className="font-semibold text-sm">{section.label}</span>
        </div>
      </div>
      
      {/* Itens simples */}
      {section.items && (
        <div className="p-2 space-y-0.5">
          {section.items.map(item => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all relative",
                  active
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}>
                <IconDisplay icon={item.icon} className="w-4 h-4 text-muted-foreground" />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white",
                    getBadgeClass(item.badgeColor))}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
      
      {/* Grupos de submenus */}
      {section.groups && (
        <div className="p-2 space-y-3">
          {section.groups.map(group => (
            <div key={group.groupLabel}>
              <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                {group.groupLabel}
              </p>
              <div className="space-y-0.5">
                {group.items.map(item => {
                  const active = pathname === item.href;
                  return (
                    <Link key={item.href} href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all relative",
                        active
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}>
                      <IconDisplay icon={item.icon} className="w-4 h-4 text-muted-foreground" />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white",
                          getBadgeClass(item.badgeColor))}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Sidebar com ícones outline profissionais
export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const plan = user.tenant?.plan ?? "free";
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  
  return (
    <aside 
      ref={sidebarRef}
      className="fixed left-0 top-0 bottom-0 w-16 bg-card border-r border-border flex flex-col z-50 hidden md:flex group"
      onMouseLeave={() => setActiveSection(null)}
    >
      {/* Logo - minimal */}
      <div className="p-3 border-b border-border flex justify-center">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
          <ShoppingBag className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Menu Principal - ícones + nomes abaixo */}
      <nav className="flex-1 py-2 space-y-1">
        {MAIN_MENU.map(item => (
          <div 
            key={item.key}
            className="relative"
            onMouseEnter={() => setActiveSection(item.key)}
          >
            <button
              className={cn(
                "w-full p-2 flex flex-col items-center justify-center rounded-lg transition-all relative gap-1",
                activeSection === item.key
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <IconDisplay icon={item.icon} className="w-5 h-5" />
              <span className="text-[10px] leading-tight">{item.label}</span>
              
              {/* Indicador ativo lateral */}
              {activeSection === item.key && (
                <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-primary rounded-full" />
              )}
            </button>
            
            {/* Tooltip ao hover */}
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
              {item.label}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border flex justify-center">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-xs font-bold text-white">
          {getInitials(user.name)}
        </div>
      </div>
      
      {/* Flyout Panel - aparece ao hover */}
      {activeSection && (
        <FlyoutPanel 
          sectionKey={activeSection} 
        />
      )}
    </aside>
  );
}
