"use client";
import { useState } from "react";
import { UserCog, ChevronLeft, Crown, ShieldCheck, ShoppingBag, Wallet, Mail, UserPlus } from "lucide-react";
import Link from "next/link";
import { api } from "@/components/providers/trpc-provider";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<string, { label: string; icon: React.ComponentType<any>; color: string }> = {
  owner:   { label: "Proprietário", icon: Crown,       color: "text-yellow-600 bg-yellow-100" },
  admin:   { label: "Administrador", icon: ShieldCheck, color: "text-blue-600 bg-blue-100" },
  seller:  { label: "Vendedor",      icon: ShoppingBag, color: "text-green-600 bg-green-100" },
  cashier: { label: "Caixa",         icon: Wallet,      color: "text-purple-600 bg-purple-100" },
};

export default function UsuariosPage() {
  const { data: stats } = api.dashboard.getStats.useQuery();

  // Listar usuários do tenant via Supabase diretamente pelo lado do servidor não é possível aqui
  // então fazemos uma abordagem simplificada mostrando o usuário logado
  return (
    <div className="max-w-lg mx-auto pb-28 md:pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/ajustes" className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
          <UserCog className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="font-heading text-xl font-bold">Usuários</h1>
          <p className="text-xs text-muted-foreground">Gerenciar acessos ao sistema</p>
        </div>
      </div>

      {/* Usuário atual */}
      {stats?.userName && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden mb-4">
          <div className="px-4 py-2.5 bg-muted/40 border-b border-border">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Usuário ativo</p>
          </div>
          <div className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
              {stats.userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{stats.userName}</p>
              <p className="text-xs text-muted-foreground">Sessão ativa</p>
            </div>
            <span className={cn("text-[10px] font-bold px-2 py-1 rounded-full", ROLE_LABELS["owner"].color)}>
              {ROLE_LABELS["owner"].label}
            </span>
          </div>
        </div>
      )}

      {/* Convite */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <UserPlus className="w-4 h-4 text-primary" />
          <p className="font-semibold text-sm">Convidar colaborador</p>
        </div>
        <p className="text-xs text-muted-foreground">
          O gerenciamento completo de usuários e convites está disponível no plano Smart.
        </p>
        <Link
          href="/dashboard/ajustes/planos"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Ver planos disponíveis
        </Link>
      </div>

      {/* Roles info */}
      <div className="mt-4 bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-4 py-2.5 bg-muted/40 border-b border-border">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Níveis de acesso</p>
        </div>
        <div className="divide-y divide-border/60">
          {Object.entries(ROLE_LABELS).map(([key, { label, icon: Icon, color }]) => (
            <div key={key} className="flex items-center gap-3 px-4 py-3">
              <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", color)}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">
                  {key === "owner"   && "Acesso total ao sistema"}
                  {key === "admin"   && "Gerencia produtos, pedidos e relatórios"}
                  {key === "seller"  && "Realiza vendas e consulta produtos"}
                  {key === "cashier" && "Opera o caixa e registros financeiros"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
