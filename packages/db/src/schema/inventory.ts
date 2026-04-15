import { pgTable, text, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { tenants } from "./tenants";
import { products } from "./products";

// Align with values written by the API layer (tRPC routers)
export const movTypeEnum = pgEnum("mov_type", [
  "in",
  "out",
  "adjustment",
  "return",
  "sale",
  "void-return",
  "defective",
  "procurement",
]);

export const inventoryMovements = pgTable("inventory_movements", {
  id:        text("id").primaryKey().$defaultFn(() => createId()),
  tenantId:  text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  type:      movTypeEnum("type").notNull(),
  quantity:  integer("quantity").notNull(),
  before:    integer("before").notNull(),
  after:     integer("after").notNull(),
  reason:    text("reason"),
  reference: text("reference"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type InventoryMovement = typeof inventoryMovements.$inferSelect;
