import type { Metadata } from "next";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { PaymentsDonut } from "@/components/dashboard/payments-donut";
import { RecentOrders } from "@/components/dashboard/recent-orders";
import { TopProducts } from "@/components/dashboard/top-products";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { StorePreview } from "@/components/dashboard/store-preview";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { UpgradeBanner } from "@/components/dashboard/upgrade-banner";
import { api } from "@/server/api/server";

export const metadata: Metadata = { title: "Dashboard" };

const DEMO_STATS = {
  userName: "Usuário",
  todaySales: 0,
  todayOrders: 0,
  totalCustomers: 0,
  lowStockCount: 0,
};

export default async function DashboardPage() {
  let stats = DEMO_STATS;
  try {
    stats = await api.dashboard.getStats();
  } catch {}

  return (
    <div className="space-y-6">
      <UpgradeBanner />

      <div>
        <h1 className="font-heading text-2xl font-bold">
          Bom dia, <span className="text-primary">{stats.userName}!</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Aqui está o resumo do seu negócio hoje.
        </p>
      </div>

      <StatsCards />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
        <SalesChart />
        <PaymentsDonut />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopProducts />
        <RecentOrders />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <QuickActions />
        <StorePreview />
        <ActivityFeed />
      </div>
    </div>
  );
}
