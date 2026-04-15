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
import { DashboardCalendar } from "@/components/dashboard/dashboard-calendar";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <div className="space-y-5 pb-28 md:pb-6">
      <UpgradeBanner />

      <div>
        <h1 className="font-heading text-xl md:text-2xl font-bold">
          Bom dia! 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Aqui está o resumo do seu negócio hoje.
        </p>
      </div>

      <StatsCards />

      {/* Calendário com filtro de datas */}
      <DashboardCalendar />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5">
        <SalesChart />
        <PaymentsDonut />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TopProducts />
        <RecentOrders />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <QuickActions />
        <StorePreview />
        <ActivityFeed />
      </div>
    </div>
  );
}
