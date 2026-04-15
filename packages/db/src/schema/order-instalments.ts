import { pgTable, text, timestamp, numeric, boolean } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { tenants } from "./tenants";
import { orders } from "./orders";
import { orderPayments } from "./order-payments";

export const orderInstalments = pgTable("order_instalments", {
  id:        text("id").primaryKey().$defaultFn(() => createId()),
  tenantId:  text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  orderId:   text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  amount:    numeric("amount", { precision: 10, scale: 2 }).notNull(),
  dueDate:   timestamp("due_date"),
  paid:      boolean("paid").default(false).notNull(),
  paidAt:    timestamp("paid_at"),
  paymentId: text("payment_id").references(() => orderPayments.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type OrderInstalment = typeof orderInstalments.$inferSelect;

