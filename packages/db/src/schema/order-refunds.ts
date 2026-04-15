import { pgTable, text, timestamp, numeric } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { tenants } from "./tenants";
import { orders, orderItems } from "./orders";
import { users } from "./users";
import { products } from "./products";

export const orderRefunds = pgTable("order_refunds", {
  id:          text("id").primaryKey().$defaultFn(() => createId()),
  tenantId:    text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  orderId:     text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  reason:      text("reason"),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).default("0").notNull(),
  authorId:    text("author_id").references(() => users.id),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
});

export const orderRefundItems = pgTable("order_refund_items", {
  id:          text("id").primaryKey().$defaultFn(() => createId()),
  refundId:    text("refund_id").notNull().references(() => orderRefunds.id, { onDelete: "cascade" }),
  orderItemId: text("order_item_id").references(() => orderItems.id),
  productId:   text("product_id").references(() => products.id),
  quantity:    numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice:   numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  condition:   text("condition"),
  notes:       text("notes"),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
});

export type OrderRefund = typeof orderRefunds.$inferSelect;

