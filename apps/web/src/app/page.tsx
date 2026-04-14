import Link from "next/link";
import { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-button";
import { RegisterForm } from "@/components/auth/register-button";
import { ShoppingCart, Wallet, CreditCard, BarChart3, Package, Globe, ArrowRight, Check, Instagram, MessageCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "lumiPOS - Sistema de Gestao para Pequenos Negocios",
  description: "O sistema tudo-em-um que substitui o caderninho, organiza seu estoque e profissionaliza sua venda em segundos.",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F5F5DC]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#F5F5DC]/90 backdrop-blur-sm border-b border-[#E2D9CC]">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#87A96B] rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading text-xl font-bold text-[#2C2416]">lumi<span className="text-[#87A96B]">POS</span></span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#6B5744]">
            <a href="#funcionalidades" className="hover:text-[#2C2416] transition-colors">Funcionalidades</a>
            <a href="#planos" className="hover:text-[#2C2416] transition-colors">Planos</a>
            <a href="#ajuda" className="hover:text-[#2C2416] transition-colors">Ajuda</a>
          </nav>
          
          <div className="flex items-center gap-3">
            <LoginForm variant="button" />
            <RegisterForm variant="button" />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-[#2C2416] leading-tight mb-6">
            Sua loja no bolso, sua gestao no automatico.
          </h1>
          <p className="text-lg text-[#6B5744] mb-8 max-w-2xl mx-auto">
            O sistema "tudo-em-um" que substitui o caderninho, organiza seu estoque e profissionaliza sua venda em segundos.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/register" className="w-full sm:w-auto px-8 py-4 bg-[#87A96B] text-white font-bold rounded-xl hover:bg-[#7A9E7E] transition-colors shadow-lg shadow-[#87A96B]/30">
              Comecar agora — E Grtis
            </Link>
            <span className="text-sm text-[#9B8B7A]">
              Sem cartao de credito. Teste todas as funcoes Pro por 15 dias.
            </span>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-heading text-2xl font-bold text-[#2C2416] text-center mb-12">
            Voce sente que trabalha muito, mas nao sabe para onde o dinheiro esta indo?
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-6 bg-[#F5F5DC] rounded-2xl">
              <div className="w-12 h-12 bg-[#87A96B]/20 rounded-xl flex items-center justify-center mb-4">
                <Wallet className="w-6 h-6 text-[#87A96B]" />
              </div>
              <h3 className="font-bold text-[#2C2416] mb-2">O "Ralo" do Fiado</h3>
              <p className="text-sm text-[#6B5744]">O caderninho sumiu? O cliente esqueceu quanto devia? controle total com um clique.</p>
            </div>
            <div className="p-6 bg-[#F5F5DC] rounded-2xl">
              <div className="w-12 h-12 bg-[#87A96B]/20 rounded-xl flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-[#87A96B]" />
              </div>
              <h3 className="font-bold text-[#2C2416] mb-2">A Fadiga Visual</h3>
              <p className="text-sm text-[#6B5744]">Chega de telas que cansam a vista. Nossa interface Warm Tech protege sua visao.</p>
            </div>
            <div className="p-6 bg-[#F5F5DC] rounded-2xl">
              <div className="w-12 h-12 bg-[#87A96B]/20 rounded-xl flex items-center justify-center mb-4">
                <Package className="w-6 h-6 text-[#87A96B]" />
              </div>
              <h3 className="font-bold text-[#2C2416] mb-2">O Estoque "Cego"</h3>
              <p className="text-sm text-[#6B5744]">Saiba quanto pagou na ultima carga. O lucro sumiu na inflacao?</p>
            </div>
            <div className="p-6 bg-[#F5F5DC] rounded-2xl">
              <div className="w-12 h-12 bg-[#87A96B]/20 rounded-xl flex items-center justify-center mb-4">
                <CreditCard className="w-6 h-6 text-[#87A96B]" />
              </div>
              <h3 className="font-bold text-[#2C2416] mb-2">Vendas Perdidas</h3>
              <p className="text-sm text-[#6B5744]">Cliente quer pagar no PIX e resto no cartao? O lumiPOS permite.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="funcionalidades" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-heading text-2xl font-bold text-[#2C2416] text-center mb-4">
            Por que o lumiPOS e o parceiro ideal do seu comercio?
          </h2>
          <p className="text-center text-[#6B5744] mb-12">Tecnologia brasileira para o comercio real.</p>
          
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6 p-6 bg-white rounded-2xl shadow-sm">
              <div className="w-16 h-16 bg-[#87A96B]/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                <ShoppingCart className="w-8 h-8 text-[#87A96B]" />
              </div>
              <div>
                <h3 className="font-heading text-xl font-bold text-[#2C2416] mb-2">Primeiro o Celular (Mobile-First)</h3>
                <p className="text-[#6B5744]">Esqueça computadores lentos. Gerencie vendas, estoque e clientes direto do seu smartphone com a agilidade de quem está no campo de batalha.</p>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-6 p-6 bg-white rounded-2xl shadow-sm">
              <div className="w-16 h-16 bg-[#87A96B]/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Wallet className="w-8 h-8 text-[#87A96B]" />
              </div>
              <div>
                <h3 className="font-heading text-xl font-bold text-[#2C2416] mb-2">Gestao de "Fiado" Profissional</h3>
                <p className="text-[#6B5744]">Substitua a anotacao manual por um controle de limite de credito por cliente. Gere extratos detalhados e saiba exatamente quem deve e quanto deve.</p>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-6 p-6 bg-white rounded-2xl shadow-sm">
              <div className="w-16 h-16 bg-[#87A96B]/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-8 h-8 text-[#87A96B]" />
              </div>
              <div>
                <h3 className="font-heading text-xl font-bold text-[#2C2416] mb-2">PDV Inteligente e Multi-pagamento</h3>
                <p className="text-[#6B5744]">Divida vendas em varios metodos, aplique cupons de desconto e feche o caixa com precisao cirurgica. Sem furos, sem estresse.</p>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-6 p-6 bg-white rounded-2xl shadow-sm">
              <div className="w-16 h-16 bg-[#87A96B]/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Package className="w-8 h-8 text-[#87A96B]" />
              </div>
              <div>
                <h3 className="font-heading text-xl font-bold text-[#2C2416] mb-2">Estoque com Inteligencia de Lucro</h3>
                <p className="text-[#6B5744]">O lumiPOS calcula o Preco Medio Ponderado. Voce registra a entrada da mercadoria e nos te dizemos o custo real e a margem de lucro exata.</p>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-6 p-6 bg-white rounded-2xl shadow-sm">
              <div className="w-16 h-16 bg-[#87A96B]/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Globe className="w-8 h-8 text-[#87A96B]" />
              </div>
              <div>
                <h3 className="font-heading text-xl font-bold text-[#2C2416] mb-2">Sua Vitrine Online Automatica</h3>
                <p className="text-[#6B5744]">Ao cadastrar seus produtos, voce ganha um catalogo digital exclusivo para receber pedidos pela internet. E a sua loja aberta 24h.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="planos" className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-heading text-2xl font-bold text-[#2C2416] text-center mb-4">
            Escolha o plano que acompanha o seu crescimento
          </h2>
          <p className="text-center text-[#6B5744] mb-12">
            Todos os novos usuarios ganham 15 dias de acesso total. Apos esse periodo, voce decide.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Start Plan */}
            <div className="p-6 bg-[#F5F5DC] rounded-2xl border-2 border-[#E2D9CC]">
              <h3 className="font-heading text-lg font-bold text-[#2C2416] mb-2">Lumi Start</h3>
              <p className="text-sm text-[#6B5744] mb-4">Ideal para quem esta comeando agora</p>
              <div className="text-3xl font-bold text-[#2C2416] mb-6">R$ 0<span className="text-sm font-normal">/mes</span></div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-sm text-[#6B5744]">
                  <Check className="w-4 h-4 text-[#87A96B]" /> Vendas e Clientes
                </li>
                <li className="flex items-center gap-2 text-sm text-[#6B5744]">
                  <Check className="w-4 h-4 text-[#87A96B]" /> Historico de Vendas
                </li>
              </ul>
              <Link href="/auth/register" className="block w-full py-3 bg-[#87A96B] text-white font-bold text-center rounded-xl hover:bg-[#7A9E7E] transition-colors">
                Assinar Grats
              </Link>
            </div>
            
            {/* Prime Plan */}
            <div className="p-6 bg-[#F5F5DC] rounded-2xl border-2 border-[#87A96B] relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#87A96B] text-white text-xs font-bold rounded-full">
                POPULAR
              </div>
              <h3 className="font-heading text-lg font-bold text-[#2C2416] mb-2">Lumi Prime</h3>
              <p className="text-sm text-[#6B5744] mb-4">Organizar contas e vendas</p>
              <div className="text-3xl font-bold text-[#2C2416] mb-6">R$ 39,90<span className="text-sm font-normal">/mes</span></div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-sm text-[#6B5744]">
                  <Check className="w-4 h-4 text-[#87A96B]" /> Tudo do Start +
                </li>
                <li className="flex items-center gap-2 text-sm text-[#6B5744]">
                  <Check className="w-4 h-4 text-[#87A96B]" /> Contas a Pagar/Receber
                </li>
                <li className="flex items-center gap-2 text-sm text-[#6B5744]">
                  <Check className="w-4 h-4 text-[#87A96B]" /> Gestao de Estoque Pro
                </li>
              </ul>
              <Link href="/auth/register" className="block w-full py-3 bg-[#87A96B] text-white font-bold text-center rounded-xl hover:bg-[#7A9E7E] transition-colors">
                Assinar Prime
              </Link>
            </div>
            
            {/* Business Plan */}
            <div className="p-6 bg-[#F5F5DC] rounded-2xl border-2 border-[#E2D9CC]">
              <h3 className="font-heading text-lg font-bold text-[#2C2416] mb-2">Lumi Business</h3>
              <p className="text-sm text-[#6B5744] mb-4">Uso em PC + Celular</p>
              <div className="text-3xl font-bold text-[#2C2416] mb-6">R$ 69,90<span className="text-sm font-normal">/mes</span></div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-sm text-[#6B5744]">
                  <Check className="w-4 h-4 text-[#87A96B]" /> Tudo do Prime +
                </li>
                <li className="flex items-center gap-2 text-sm text-[#6B5744]">
                  <Check className="w-4 h-4 text-[#87A96B]" /> Versao PC/Web
                </li>
                <li className="flex items-center gap-2 text-sm text-[#6B5744]">
                  <Check className="w-4 h-4 text-[#87A96B]" /> Loja Virtual/Catalogo
                </li>
              </ul>
              <Link href="/auth/register" className="block w-full py-3 bg-[#2C2416] text-white font-bold text-center rounded-xl hover:bg-[#6B5744] transition-colors">
                Assinar Business
              </Link>
            </div>
            
            {/* Elite Plan */}
            <div className="p-6 bg-[#F5F5DC] rounded-2xl border-2 border-[#E2D9CC]">
              <h3 className="font-heading text-lg font-bold text-[#2C2416] mb-2">Lumi Elite</h3>
              <p className="text-sm text-[#6B5744] mb-4">Gestao total + Fiscal</p>
              <div className="text-3xl font-bold text-[#2C2416] mb-6">R$ 99,90<span className="text-sm font-normal">/mes</span></div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-sm text-[#6B5744]">
                  <Check className="w-4 h-4 text-[#87A96B]" /> Tudo do Business +
                </li>
                <li className="flex items-center gap-2 text-sm text-[#6B5744]">
                  <Check className="w-4 h-4 text-[#87A96B]" /> Emissao de Notas (Fiscal)
                </li>
              </ul>
              <Link href="/auth/register" className="block w-full py-3 bg-[#2C2416] text-white font-bold text-center rounded-xl hover:bg-[#6B5744] transition-colors">
                Assinar Elite
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-[#2C2416]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-heading text-3xl font-bold text-white mb-4">
            Chega de complicacoes. Tenha o controle total hoje mesmo.
          </h2>
          <p className="text-[#C4B8AB] mb-8">
            O lumiPOS foi feito por quem entende o mercado brasileiro para quem faz a economia girar.
          </p>
          <Link href="/auth/register" className="inline-flex items-center gap-2 px-8 py-4 bg-[#87A96B] text-white font-bold rounded-xl hover:bg-[#7A9E7E] transition-colors shadow-lg shadow-[#87A96B]/30">
            Quero profissionalizar meu negocio agora!
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-[#F5F5DC] border-t border-[#E2D9CC]">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#87A96B] rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-white" />
              </div>
              <span className="font-heading font-bold text-[#2C2416]">lumiPOS</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-[#6B5744]">
              <a href="#" className="flex items-center gap-2 hover:text-[#2C2416] transition-colors">
                <Instagram className="w-4 h-4" /> Instagram
              </a>
              <a href="#" className="flex items-center gap-2 hover:text-[#2C2416] transition-colors">
                <MessageCircle className="w-4 h-4" /> Suporte WhatsApp
              </a>
              <a href="#" className="hover:text-[#2C2416] transition-colors">Termos de Uso</a>
            </div>
            
            <p className="text-sm text-[#9B8B7A]">
              Tecnologia brasileira para o comercio real.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
