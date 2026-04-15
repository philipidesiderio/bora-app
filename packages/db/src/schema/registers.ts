import { pgTable, text, timestamp, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { tenants } from "./tenants";
import { users } from "./users";

export const registerStatusEnum = pgEnum("register_status", ["opened", "closed"]);
export const registerTxTypeEnum = pgEnum("register_tx_type", ["positive", "negative", "unchanged"]);
export const registerActionEnum = pgEnum("register_action", [
  "opening",
  "closing",
  "cash-in",
  "cash-out",
  "order-payment",
  "refund",
]);

export const registers = pgTable("registers", {
  id:        text("id").primaryKey().$defaultFn(() => createId()),
  tenantId:  text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name:      text("name").notNull(),
  status:    registerStatusEnum("status").default("closed").notNull(),
  balance:   numeric("balance", { precision: 10, scale: 2 }).default("0").notNull(),
  usedBy:    text("used_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const registerHistory = pgTable("register_history", {
  id:             text("id").primaryKey().$defaultFn(() => createId()),
  tenantId:       text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  registerId:     text("register_id").notNull().references(() => registers.id, { onDelete: "cascade" }),
  action:         registerActionEnum("action").notNull(),
  value:          numeric("value", { precision: 10, scale: 2 }).default("0").notNull(),
  balanceBefore:  numeric("balance_before", { precision: 10, scale: 2 }).default("0").notNull(),
  balanceAfter:   numeric("balance_after", { precision: 10, scale: 2 }).default("0").notNull(),
  transactionType: registerTxTypeEnum("transaction_type").notNull(),
  description:    text("description"),
  authorId:       text("author_id").references(() => users.id),
  createdAt:      timestamp("created_at").defaultNow().notNull(),
});

export type Register = typeof registers.$inferSelect;

