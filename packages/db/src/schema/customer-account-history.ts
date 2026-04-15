import { pgTable, text, timestamp, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { tenants } from "./tenants";
import { customers } from "./customers";
import { orders } from "./orders";

export const customerAccountOperationEnum = pgEnum("customer_account_operation", ["add", "sub"]);

export const customerAccountHistory = pgTable("customer_account_history", {
  id:            text("id").primaryKey().$defaultFn(() => createId()),
  tenantId:      text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  customerId:    text("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  orderId:       text("order_id").references(() => orders.id),
  operation:     customerAccountOperationEnum("operation").notNull(),
  amount:        numeric("amount", { precision: 10, scale: 2 }).notNull(),
  balanceBefore: numeric("balance_before", { precision: 10, scale: 2 }).default("0").notNull(),
  balanceAfter:  numeric("balance_after", { precision: 10, scale: 2 }).default("0").notNull(),
  description:   text("description"),
  createdAt:     timestamp("created_at").defaultNow().notNull(),
});

export type CustomerAccountHistoryRow = typeof customerAccountHistory.$inferSelect;

