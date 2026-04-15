import { pgTable, text, timestamp, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { tenants } from "./tenants";
import { orders, paymentMethodEnum } from "./orders";
import { users } from "./users";

export const orderPayments = pgTable("order_payments", {
  id:        text("id").primaryKey().$defaultFn(() => createId()),
  tenantId:  text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  orderId:   text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  method:    paymentMethodEnum("method").notNull(),
  amount:    numeric("amount", { precision: 10, scale: 2 }).notNull(),
  note:      text("note"),
  authorId:  text("author_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type OrderPayment = typeof orderPayments.$inferSelect;

