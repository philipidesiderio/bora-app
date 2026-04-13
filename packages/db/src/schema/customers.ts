import { pgTable, text, timestamp, numeric, integer } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { tenants } from "./tenants";

export const customers = pgTable("customers", {
  id:           text("id").primaryKey().$defaultFn(() => createId()),
  tenantId:     text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name:         text("name").notNull(),
  phone:        text("phone"),
  email:        text("email"),
  cpf:          text("cpf"),
  address:      text("address"),
  creditLimit:  numeric("credit_limit", { precision: 10, scale: 2 }).default("0"),
  creditBalance: numeric("credit_balance", { precision: 10, scale: 2 }).default("0"),
  totalOrders:  integer("total_orders").default(0),
  totalSpent:   numeric("total_spent", { precision: 10, scale: 2 }).default("0"),
  notes:        text("notes"),
  createdAt:    timestamp("created_at").defaultNow().notNull(),
  updatedAt:    timestamp("updated_at").defaultNow().notNull(),
});

export type Customer    = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
