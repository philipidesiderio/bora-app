import { pgTable, text, timestamp, integer, numeric, pgEnum, json } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { tenants } from "./tenants";
import { products } from "./products";
import { users } from "./users";

export const orderStatusEnum   = pgEnum("order_status",   ["pending","confirmed","preparing","ready","delivered","cancelled"]);
export const orderChannelEnum  = pgEnum("order_channel",  ["pdv","online","whatsapp"]);
export const paymentMethodEnum = pgEnum("payment_method", ["pix","cash","credit","debit","voucher","mixed","account"]);
// Align with statuses produced/used in the API layer
export const paymentStatusEnum = pgEnum("payment_status", [
  "unpaid",
  "paid",
  "partial",
  "hold",
  "void",
  "refunded",
  "partially_refunded",
]);
export const discountTypeEnum  = pgEnum("discount_type", ["flat", "percent"]);

export const orders = pgTable("orders", {
  id:            text("id").primaryKey().$defaultFn(() => createId()),
  tenantId:      text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  customerId:    text("customer_id"),
  sellerId:      text("seller_id").references(() => users.id),
  number:        integer("number").notNull(),
  channel:       orderChannelEnum("channel").default("pdv").notNull(),
  status:        orderStatusEnum("status").default("confirmed").notNull(),
  paymentMethod: paymentMethodEnum("payment_method"),
  paymentStatus: paymentStatusEnum("payment_status").default("unpaid").notNull(),
  subtotal:      numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  discount:      numeric("discount",  { precision: 10, scale: 2 }).default("0"),
  discountType:  discountTypeEnum("discount_type").default("flat").notNull(),
  total:         numeric("total",     { precision: 10, scale: 2 }).notNull(),
  tendered:      numeric("tendered",      { precision: 10, scale: 2 }),
  changeAmount:  numeric("change_amount", { precision: 10, scale: 2 }),
  registerId:    text("register_id"),
  voidReason:    text("void_reason"),
  notes:         text("notes"),
  metadata:      json("metadata"),
  createdAt:     timestamp("created_at").defaultNow().notNull(),
  updatedAt:     timestamp("updated_at").defaultNow().notNull(),
});

export const orderItems = pgTable("order_items", {
  id:        text("id").primaryKey().$defaultFn(() => createId()),
  orderId:   text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: text("product_id").references(() => products.id),
  name:      text("name").notNull(),
  quantity:  integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  costPrice: numeric("cost_price", { precision: 10, scale: 2 }).default("0"),
  discount:  numeric("discount",   { precision: 10, scale: 2 }).default("0"),
  total:     numeric("total",      { precision: 10, scale: 2 }).notNull(),
  notes:     text("notes"),
});

export const ordersRelations = relations(orders, ({ one, many }) => ({
  tenant: one(tenants, { fields: [orders.tenantId], references: [tenants.id] }),
  items:  many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order:   one(orders,   { fields: [orderItems.orderId],   references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));

export type Order      = typeof orders.$inferSelect;
export type NewOrder   = typeof orders.$inferInsert;
export type OrderItem  = typeof orderItems.$inferSelect;
