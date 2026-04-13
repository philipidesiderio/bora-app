import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { headers } from "next/headers";

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/dashboard");
  redirect("/auth/login");
}
