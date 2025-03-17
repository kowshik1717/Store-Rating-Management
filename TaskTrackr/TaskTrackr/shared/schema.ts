import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoles = ['admin', 'user', 'store_owner'] as const;
export type UserRole = typeof userRoles[number];

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  address: text("address").notNull(),
  role: text("role", { enum: userRoles }).notNull().default('user'),
});

export const stores = pgTable("stores", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  address: text("address").notNull(),
  ownerId: integer("owner_id").references(() => users.id),
});

export const ratings = pgTable("ratings", {
  id: serial("id").primaryKey(),
  rating: integer("rating").notNull(),
  userId: integer("user_id").references(() => users.id),
  storeId: integer("store_id").references(() => stores.id),
});

// Validation schemas
const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .max(16, "Password must not exceed 16 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character");

const nameSchema = z.string()
  .min(3, "Name must be at least 3 characters")
  .max(60, "Name must not exceed 60 characters");

const addressSchema = z.string()
  .min(5, "Address must be at least 5 characters")
  .max(400, "Address must not exceed 400 characters");

const emailSchema = z.string().email("Invalid email format");

export const insertUserSchema = createInsertSchema(users)
  .extend({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    address: addressSchema,
  });

export const insertStoreSchema = createInsertSchema(stores)
  .extend({
    name: nameSchema,
    email: emailSchema,
    address: addressSchema,
  });

export const insertRatingSchema = createInsertSchema(ratings)
  .extend({
    rating: z.number().min(1).max(5),
  });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertStore = z.infer<typeof insertStoreSchema>;
export type InsertRating = z.infer<typeof insertRatingSchema>;
export type User = typeof users.$inferSelect;
export type Store = typeof stores.$inferSelect;
export type Rating = typeof ratings.$inferSelect;