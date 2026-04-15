import { pgTable, text, timestamp, numeric, integer, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { tenants } from "./tenants";
import { providers } from "./providers";
import { users } from "./users";
import { products } from "./products";

export const procurementPaymentStatusEnum = pgEnum("procurement_payment_status", ["unpaid", "paid"]);
export const procurementDeliveryStatusEnum = pgEnum("procurement_delivery_status", ["pending", "delivered"]);

export const procurements = pgTable("procurements", {
  id:            text("id").primaryKey().$defaultFn(() => createId()),
  tenantId:      text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  providerId:    text("provider_id").references(() => providers.id),
  name:          text("name"),
  invoiceRef:    text("invoice_ref"),
  deliveryDate:  timestamp("delivery_date"),
  notes:         text("notes"),
  totalValue:    numeric("total_value", { precision: 10, scale: 2 }).default("0").notNull(),
  paymentStatus: procurementPaymentStatusEnum("payment_status").default("unpaid").notNull(),
  deliveryStatus: procurementDeliveryStatusEnum("delivery_status").default("pending").notNull(),
  authorId:      text("author_id").references(() => users.id),
  createdAt:     timestamp("created_at").defaultNow().notNull(),
  updatedAt:     timestamp("updated_at").defaultNow().notNull(),
});

export const procurementItems = pgTable("procurement_items", {
  id:            text("id").primaryKey().$defaultFn(() => createId()),
  procurementId: text("procurement_id").notNull().references(() => procurements.id, { onDelete: "cascade" }),
  productId:     text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  quantity:      integer("quantity").notNull(),
  purchasePrice: numeric("purchase_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice:    numeric("total_price", { precision: 10, scale: 2 }).notNull(),
  createdAt:     timestamp("created_at").defaultNow().notNull(),
});

export type Procurement = typeof procurements.$inferSelect;

