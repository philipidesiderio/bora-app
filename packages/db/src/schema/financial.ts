import { pgTable, text, timestamp, numeric, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { tenants } from "./tenants";

export const txTypeEnum     = pgEnum("tx_type",     ["income", "expense"]);
export const txStatusEnum   = pgEnum("tx_status",   ["pending", "paid", "overdue", "cancelled"]);
export const txCategoryEnum = pgEnum("tx_category", ["sales","purchase","salary","tax","other"]);

export const transactions = pgTable("transactions", {
  id:          text("id").primaryKey().$defaultFn(() => createId()),
  tenantId:    text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  type:        txTypeEnum("type").notNull(),
  status:      txStatusEnum("status").default("pending").notNull(),
  category:    txCategoryEnum("category").default("other").notNull(),
  description: text("description").notNull(),
  amount:      numeric("amount", { precision: 10, scale: 2 }).notNull(),
  dueDate:     timestamp("due_date"),
  paidAt:      timestamp("paid_at"),
  reference:   text("reference"),
  notes:       text("notes"),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
  updatedAt:   timestamp("updated_at").defaultNow().notNull(),
});

export const cashSessions = pgTable("cash_sessions", {
  id:           text("id").primaryKey().$defaultFn(() => createId()),
  tenantId:     text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  openedBy:     text("opened_by").notNull(),
  openingFloat: numeric("opening_float", { precision: 10, scale: 2 }).default("0"),
  closingFloat: numeric("closing_float", { precision: 10, scale: 2 }),
  totalSales:   numeric("total_sales",   { precision: 10, scale: 2 }).default("0"),
  isOpen:       boolean("is_open").default(true).notNull(),
  openedAt:     timestamp("opened_at").defaultNow().notNull(),
  closedAt:     timestamp("closed_at"),
});

export type Transaction  = typeof transactions.$inferSelect;
export type CashSession  = typeof cashSessions.$inferSelect;
