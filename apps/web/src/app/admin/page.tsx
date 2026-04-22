import { redirect } from "next/navigation";
import { headers }  from "next/headers";
import { auth }     from "@/server/auth";
import AdminDashboard from "./_components/AdminDashboard";

export const dynamic = "force-dynamic";

const ADMIN_EMAIL = "mkt.desiderio@gmail.com";

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user || session.user.email !== ADMIN_EMAIL) {
    redirect("/auth/login");
  }

  return <AdminDashboard />;
}
