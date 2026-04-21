export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db, tenants, users } from "@bora/db";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { storeName, slug } = await req.json();
    if (!storeName || !slug) {
      return NextResponse.json({ error: "storeName and slug are required" }, { status: 400 });
    }

    // Create tenant
    const [tenant] = await db.insert(tenants).values({ name: storeName, slug }).returning();

    // Link user to tenant
    await db.update(users).set({ tenantId: tenant.id }).where(eq(users.id, session.user.id));

    return NextResponse.json({ ok: true, tenantId: tenant.id });
  } catch (err: any) {
    console.error("[setup]", err);
    return NextResponse.json({ error: err.message ?? "Internal error" }, { status: 500 });
  }
}
