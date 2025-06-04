import { pgTable, text, serial, integer, boolean, timestamp, json, real, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { ITEM_TYPES } from "./constants";

// Base user schema kept for compatibility
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Suppliers schema
export const suppliers = pgTable("suppliers", {
  id: text("id").primaryKey(), // Using UUID strings
  name: text("name").notNull(),
  debt: real("debt").notNull().default(0),
  contact: text("contact"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
});

export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Supplier = typeof suppliers.$inferSelect;

// Inventory schema
export const inventory = pgTable("inventory", {
  id: text("id").primaryKey(), // Using UUID strings
  type: text("type").notNull(), // chicken, eeral, leg piece, goat, kadai, beef, kodal, chops, boneless, order
  quantity: real("quantity").notNull().default(0), // in kg
  rate: real("rate").notNull().default(0), // per kg, varies daily
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertInventorySchema = createInsertSchema(inventory).omit({
  id: true,
  updatedAt: true,
}).extend({
  type: z.enum(ITEM_TYPES.map(item => item.value) as [string, ...string[]])
});

export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type Inventory = typeof inventory.$inferSelect;

// Customers schema
export const customers = pgTable("customers", {
  id: text("id").primaryKey(), // Using UUID strings
  name: text("name").notNull(),
  type: text("type").notNull(), // hotel/random
  contact: text("contact"),
  pendingAmount: real("pending_amount").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
});

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

// Orders schema
export const orders = pgTable("orders", {
  id: text("id").primaryKey(), // Using UUID strings
  customerId: text("customer_id").notNull(),
  items: json("items").notNull(), // Array of OrderItem objects
  date: timestamp("date").defaultNow(),
  total: real("total").notNull().default(0),
  status: text("status").notNull(), // pending/paid
  type: text("type").notNull(), // hotel/random
});

export const orderItemSchema = z.object({
  itemId: z.string(),
  type: z.string(),
  quantity: z.number(),
  rate: z.number(),
  details: z.string().optional(), // Added new field for item details
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
}).extend({
  items: z.array(orderItemSchema),
});

export type OrderItem = z.infer<typeof orderItemSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

// Transactions schema
export const transactions = pgTable("transactions", {
  id: text("id").primaryKey(), // Using UUID strings
  entityId: text("entity_id").notNull(), // supplierId or customerId
  entityType: text("entity_type").notNull(), // supplier/customer
  amount: real("amount").notNull(),
  date: timestamp("date").defaultNow(),
  type: text("type").notNull(), // payment/receipt
  description: text("description"),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
