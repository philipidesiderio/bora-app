import { headers } from "next/headers";
import { auth } from "@/server/auth";
import { db, users } from "@bora/db";
import { eq } from "drizzle-orm";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { BottomNav } from "@/components/dashboard/bottom-nav";
import type { User } from "@bora/db";

const DEMO_USER: User = {
  id: "demo",
  name: "Demo",
  email: "demo@bora.app",
  image: null,
  role: "owner",
  tenantId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let user: User = DEMO_USER;

  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (session?.user?.id) {
      const dbUser = await db
        .select()
        .from(users)
        .where(eq(users.id, session.user.id))
        .limit(1);
      
      if (dbUser[0]) {
        user = dbUser[0];
      }
    }
  } catch {}

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
