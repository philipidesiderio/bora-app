import { notFound } from "next/navigation";
import { db } from "@bora/db";
import { StoreFront } from "@/components/store/storefront";

export const dynamic = "force-dynamic";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props) {
  const tenant = await db.query.tenants.findFirst({
    where: (t, { eq }) => eq(t.slug, params.slug),
  });
  if (!tenant) return { title: "Loja não encontrada" };
  return {
    title: tenant.name,
    description: tenant.description ?? `Compre online na ${tenant.name}`,
  };
}

export default async function StorePage({ params }: Props) {
  const tenant = await db.query.tenants.findFirst({
    where: (t, { eq, and }) => and(eq(t.slug, params.slug), eq(t.isActive, true)),
  });
  if (!tenant) notFound();

  const storeProducts = await db.query.products.findMany({
    where: (p, { eq, and }) =>
      and(eq(p.tenantId, tenant.id), eq(p.isActive, true), eq(p.showInStore, true)),
    with: { category: true },
  });

  return <StoreFront tenant={tenant} products={storeProducts} />;
}

