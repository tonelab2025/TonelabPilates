import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fullName: text("full_name").notNull(),
  telephone: text("telephone").notNull(),
  email: text("email").notNull(),
  receiptPath: text("receipt_path"),
  earlyBirdConfirmed: boolean("early_bird_confirmed").notNull().default(false),
  cancellationPolicyAccepted: boolean("cancellation_policy_accepted").notNull().default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertBookingSchema = createInsertSchema(bookings)
  .omit({
    id: true,
    createdAt: true,
  })
  .extend({
    fullName: z.string()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name is too long")
      .regex(/^[a-zA-Z\s\'\-\.]+$/, "Full name can only contain letters, spaces, apostrophes, hyphens, and periods")
      .refine(val => {
        // Must contain at least one letter
        return /[a-zA-Z]/.test(val);
      }, "Full name must contain at least one letter")
      .refine(val => {
        // Cannot be all numbers
        return !/^\d+$/.test(val.trim());
      }, "Full name cannot be only numbers"),
    telephone: z.string()
      .min(1, "Phone number is required")
      .regex(/^[\+]?[\d\s\-\(\)]+$/, "Phone number can only contain digits, spaces, dashes, parentheses, and + for country code")
      .refine(val => {
        // Remove all non-digit characters to count actual digits
        const digitsOnly = val.replace(/\D/g, '');
        return digitsOnly.length >= 8 && digitsOnly.length <= 15;
      }, "Phone number must have 8-15 digits")
      .refine(val => {
        // Validate common phone formats
        const cleaned = val.replace(/\s/g, '');
        return /^[\+]?[\d\-\(\)]+$/.test(cleaned);
      }, "Please enter a valid phone number format"),
    email: z.string()
      .min(1, "Email is required")
      .email("Please enter a valid email address")
      .toLowerCase()
      .refine(val => {
        // More strict email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(val);
      }, "Please enter a valid email format")
      .refine(val => {
        // Reject obviously fake emails
        const domain = val.split('@')[1];
        return domain && domain.length > 2 && !domain.includes('example');
      }, "Please use a real email address"),
    receiptPath: z.string().optional(),
    earlyBirdConfirmed: z.boolean().refine(val => val === true, {
      message: "You must confirm the Early Bird payment deadline",
    }),
    cancellationPolicyAccepted: z.boolean().refine(val => val === true, {
      message: "You must accept the cancellation policy",
    }),
  });

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

// Content management schema
export const siteContent = pgTable("site_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertContentSchema = createInsertSchema(siteContent)
  .omit({
    id: true,
    updatedAt: true,
  })
  .extend({
    key: z.string().min(1, "Key is required"),
    title: z.string().min(1, "Title is required"),
    content: z.string().min(1, "Content is required"),
  });

export type InsertContent = z.infer<typeof insertContentSchema>;
export type SiteContent = typeof siteContent.$inferSelect;
