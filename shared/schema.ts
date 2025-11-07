import { sql } from 'drizzle-orm';
import {
  sqliteTable,
  integer,
  text,
  real,
  index,
} from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for authentication
export const sessions = sqliteTable(
  "sessions",
  {
    sid: text("sid").primaryKey(),
    sess: text("sess").notNull(),
    expire: integer("expire", { mode: 'timestamp' }).notNull(),
  },
  (table) => ({
    expireIdx: index("IDX_session_expire").on(table.expire),
  })
);

// Users table for authentication and role management
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username", { length: 50 }).notNull().unique(),
  email: text("email", { length: 100 }).unique(),
  passwordHash: text("password_hash", { length: 255 }).notNull(),
  fullName: text("full_name", { length: 100 }),
  role: text("role", { length: 20 }).notNull().default('sales_staff'), // 'admin', 'sales_staff', 'inventory_manager'
  phone: text("phone", { length: 15 }),
  isActive: integer("is_active", { mode: 'boolean' }).default(true),
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`(strftime('%s','now') * 1000)`),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).default(sql`(strftime('%s','now') * 1000)`),
});

// Products table for inventory management
export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productCode: text("product_code", { length: 50 }),
  name: text("name", { length: 100 }).notNull(),
  nameHindi: text("name_hindi", { length: 100 }),
  nameConvertLatin: text("name_convert_latin", { length: 100 }),
  brand: text("brand", { length: 50 }),
  sizeBrand: text("size_brand", { length: 50 }),
  model: text("model", { length: 50 }),
  category: text("category", { length: 50 }).notNull(), // 'smartphone', 'feature_phone', 'accessory', 'spare_part'
  imeiNumber: text("imei_number", { length: 15 }).unique(),
  color: text("color", { length: 30 }),
  storage: text("storage", { length: 20 }),
  ram: text("ram", { length: 20 }),
  price: real("price").notNull(),
  costPrice: real("cost_price").notNull(),
  stockQuantity: integer("stock_quantity").default(0),
  minStockLevel: integer("min_stock_level").default(5),
  description: text("description"),
  imageUrl: text("image_url", { length: 255 }),
  warrantyMonths: integer("warranty_months").default(12),
  isActive: integer("is_active", { mode: 'boolean' }).default(true),
  // Extended fields
  hsnCode: text("hsn_code", { length: 20 }),
  partGroup: text("part_group", { length: 50 }),
  unitCategory: text("unit_category", { length: 100 }),
  salesDiscount: real("sales_discount").default(0),
  purchaseUnit: text("purchase_unit", { length: 20 }),
  salesUnit: text("sales_unit", { length: 20 }),
  alterUnit: text("alter_unit", { length: 20 }),
  marginPercent1: real("margin_percent_1").default(0),
  marginPercent2: real("margin_percent_2").default(0),
  mrp: real("mrp").default(0),
  mrp2: real("mrp_2").default(0),
  retailPrice2: real("retail_price_2").default(0),
  wholesalePrice: real("wholesale_price").default(0),
  wholesalePrice2: real("wholesale_price_2").default(0),
  gst: real("gst").default(0),
  cgst: real("cgst").default(0),
  sgst: real("sgst").default(0),
  igst: real("igst").default(0),
  cess: real("cess").default(0),
  barcode: text("barcode", { length: 50 }),
  rack: text("rack", { length: 50 }),
  defaultQty: integer("default_qty").default(1),
  taxTypeSale: text("tax_type_sale", { length: 20 }).default('inclusive'),
  taxTypePurchase: text("tax_type_purchase", { length: 20 }).default('inclusive'),
  defaultSaleQty: integer("default_sale_qty").default(1),
  orderPrintSection: text("order_print_section", { length: 50 }),
  batchSerialNo: text("batch_serial_no", { length: 100 }),
  mfgDate: integer("mfg_date", { mode: 'timestamp' }),
  expiryDate: integer("expiry_date", { mode: 'timestamp' }),
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`(strftime('%s','now') * 1000)`),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).default(sql`(strftime('%s','now') * 1000)`),
});

// Customers table
export const customers = sqliteTable("customers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name", { length: 100 }).notNull(),
  phone: text("phone", { length: 15 }).notNull().unique(),
  email: text("email", { length: 100 }),
  address: text("address"),
  city: text("city", { length: 50 }),
  pincode: text("pincode", { length: 10 }),
  loyaltyPoints: integer("loyalty_points").default(0),
  totalPurchases: real("total_purchases").default(0),
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`(strftime('%s','now') * 1000)`),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).default(sql`(strftime('%s','now') * 1000)`),
});

// Sales table
export const sales = sqliteTable("sales", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  invoiceNumber: text("invoice_number", { length: 50 }).notNull().unique(),
  customerId: integer("customer_id").references(() => customers.id),
  userId: integer("user_id").references(() => users.id).notNull(),
  subtotal: real("subtotal").notNull(),
  discount: real("discount").default(0),
  taxAmount: real("tax_amount").default(0),
  totalAmount: real("total_amount").notNull(),
  paymentMethod: text("payment_method", { length: 20 }).notNull(), // 'cash', 'card', 'upi', 'emi'
  paymentStatus: text("payment_status", { length: 20 }).default('completed'), // 'completed', 'pending', 'refunded'
  notes: text("notes"),
  createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`(strftime('%s','now') * 1000)`),
});

// Sale items table (junction table for sales and products)
export const saleItems = sqliteTable("sale_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  saleId: integer("sale_id").references(() => sales.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  price: real("price").notNull(),
  costPrice: real("cost_price").notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sales: many(sales),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  sales: many(sales),
}));

export const salesRelations = relations(sales, ({ one, many }) => ({
  customer: one(customers, {
    fields: [sales.customerId],
    references: [customers.id],
  }),
  user: one(users, {
    fields: [sales.userId],
    references: [users.id],
  }),
  items: many(saleItems),
}));

export const productsRelations = relations(products, ({ many }) => ({
  saleItems: many(saleItems),
}));

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
  sale: one(sales, {
    fields: [saleItems.saleId],
    references: [sales.id],
  }),
  product: one(products, {
    fields: [saleItems.productId],
    references: [products.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSaleSchema = createInsertSchema(sales).omit({
  id: true,
  createdAt: true,
});

export const insertSaleItemSchema = createInsertSchema(saleItems).omit({
  id: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type Sale = typeof sales.$inferSelect;
export type InsertSale = z.infer<typeof insertSaleSchema>;

export type SaleItem = typeof saleItems.$inferSelect;
export type InsertSaleItem = z.infer<typeof insertSaleItemSchema>;
