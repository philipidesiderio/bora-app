import { pgTable, text, timestamp, integer, numeric, boolean, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { tenants } from "./tenants";

export const productTypeEnum = pgEnum("product_type", ["product", "service", "combo"]);

export const categories = pgTable("categories", {
  id:        text("id").primaryKey().$defaultFn(() => createId()),
  tenantId:  text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name:      text("name").notNull(),
  emoji:     text("emoji"),
  color:     text("color"),
  order:     integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id:          text("id").primaryKey().$defaultFn(() => createId()),
  tenantId:    text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  categoryId:  text("category_id").references(() => categories.id),
  name:        text("name").notNull(),
  description: text("description"),
  imageUrl:    text("image_url"),
  barcode:     text("barcode"),
  sku:         text("sku"),
  type:        productTypeEnum("type").default("product").notNull(),
  price:       numeric("price", { precision: 10, scale: 2 }).notNull(),
  costPrice:   numeric("cost_price", { precision: 10, scale: 2 }),
  stock:       integer("stock").default(0),
  minStock:    integer("min_stock").default(5),
  trackStock:  boolean("track_stock").default(true),
  isActive:    boolean("is_active").default(true).notNull(),
  showInStore: boolean("show_in_store").default(true),
  isFavorite:  boolean("is_favorite").default(false),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
  updatedAt:   timestamp("updated_at").defaultNow().notNull(),
});

export const productsRelations = relations(products, ({ one }) => ({
  tenant:   one(tenants, { fields: [products.tenantId], references: [tenants.id] }),
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
}));

export type Product     = typeof products.$inferSelect;
export type NewProduct  = typeof products.$inferInsert;
export type Category    = typeof categories.$inferSelect;
