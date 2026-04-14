"use client";
import { DollarSign, ShoppingCart, Users, Package } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
  color?: string;
}

function StatCard({ label, value, icon: Icon, trend, color = "text-primary" }: StatCardProps) {
  return (
    <div className="bg-card rounded-xl border p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        <div className={`w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {trend && <span className="text-xs text-emerald-600 font-medium">{trend}</span>}
    </div>
  );
}

export function StatsCards() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatCard 
        label="Vendas hoje" 
        value="R$ 1.847" 
        icon={DollarSign} 
        trend="+12%" 
        color="text-orange-600"
      />
      <StatCard 
        label="Pedidos hoje" 
        value="34" 
        icon={ShoppingCart} 
        trend="+8%"
        color="text-emerald-600"
      />
      <StatCard 
        label="Clientes novos" 
        value="5" 
        icon={Users} 
        trend="+5%"
        color="text-blue-600"
      />
      <StatCard 
        label="Estoque baixo" 
        value="7" 
        icon={Package} 
        trend="-3"
        color="text-purple-600"
      />
    </div>
  );
}
