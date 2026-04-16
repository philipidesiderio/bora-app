"use client";
import { DollarSign, ShoppingCart, Users, Package } from "lucide-react";
import { api } from "@/components/providers/trpc-provider";
import { formatCurrency } from "@/lib/utils";

function StatCardSkeleton() {
  return (
    <div className="bg-card rounded-xl border p-4 animate-pulse">
      <div className="flex items-center justify-between mb-2">
        <div className="h-3 w-20 bg-muted rounded" />
        <div className="w-8 h-8 rounded-lg bg-muted" />
      </div>
      <div className="h-7 w-24 bg-muted rounded mt-1" />
    </div>
  );
}

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
  const { data: stats, isLoading } = api.dashboard.getStats.useQuery(undefined, {
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatCard
        label="Vendas hoje"
        value={formatCurrency(stats?.todaySales ?? 0)}
        icon={DollarSign}
        color="text-orange-600"
      />
      <StatCard
        label="Pedidos hoje"
        value={stats?.todayOrders ?? 0}
        icon={ShoppingCart}
        color="text-emerald-600"
      />
      <StatCard
        label="Clientes"
        value={stats?.totalCustomers ?? 0}
        icon={Users}
        color="text-blue-600"
      />
      <StatCard
        label="Estoque baixo"
        value={stats?.lowStockCount ?? 0}
        icon={Package}
        color="text-purple-600"
      />
    </div>
  );
}
