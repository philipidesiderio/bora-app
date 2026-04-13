import { notFound } from "next/navigation";
import { db, tenants, products } from "@bora/db";
import { eq, and } from "drizzle-orm";
import { StoreFront } from "@/components/store/storefront";

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const tenant = await db.query.tenants.findFirst({
    where: (t, { eq }) => eq(t.slug, slug),
  });
  if (!tenant) return { title: "Loja não encontrada" };
  return {
    title: tenant.name,
    description: tenant.description ?? `Compre online na ${tenant.name}`,
  };
}

export default async function StorePage({ params }: Props) {
  const { slug } = await params;
  const tenant = await db.query.tenants.findFirst({
    where: (t, { eq, and }) => and(eq(t.slug, slug), eq(t.isActive, true)),
  });
  if (!tenant) notFound();

  const storeProducts = await db.query.products.findMany({
    where: (p, { eq, and }) => and(
      eq(p.tenantId, tenant.id),
      eq(p.isActive, true),
      eq(p.showInStore, true),
    ),
    with: { category: true },
  });

  return <StoreFront tenant={tenant} products={storeProducts} />;
}
