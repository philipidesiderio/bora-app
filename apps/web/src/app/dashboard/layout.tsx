import { headers } from "next/headers";
import { auth } from "@/server/auth";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { BottomNav } from "@/components/dashboard/bottom-nav";

const DEMO_USER = {
  id: "demo",
  name: "Demo",
  email: "demo@bora.app",
  image: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let session = null;
  try {
    session = await auth.api.getSession({ headers: await headers() });
  } catch {}

  const user = session?.user ?? DEMO_USER;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar user={user} />
      <div className="flex flex-1 flex-col md:ml-60">
        <Topbar user={user} />
        <main className="flex-1 p-4 md:p-6 overflow-auto pb-24 md:pb-6">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
