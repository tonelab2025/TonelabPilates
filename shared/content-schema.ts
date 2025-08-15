import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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

// Default content for the website
export const defaultSiteContent = [
  {
    key: "hero_title",
    title: "Hero Title",
    content: "Tune Your Tone with Tonelab"
  },
  {
    key: "hero_description", 
    title: "Hero Description",
    content: "Join us for an exclusive Pilates experience that combines traditional techniques with modern fitness innovation."
  },
  {
    key: "event_title",
    title: "Event Title", 
    content: "Pilates Full Body Sculpt & Burn"
  },
  {
    key: "event_date",
    title: "Event Date",
    content: "Sunday, 19th January 2025"
  },
  {
    key: "event_time",
    title: "Event Time",
    content: "4:00 PM - 5:30 PM"
  },
  {
    key: "early_bird_price",
    title: "Early Bird Price",
    content: "฿890"
  },
  {
    key: "regular_price", 
    title: "Regular Price",
    content: "฿1,190"
  },
  {
    key: "venue_name",
    title: "Venue Name",
    content: "Asoke Sports Club"
  },
  {
    key: "venue_address",
    title: "Venue Address", 
    content: "48 Soi Sukhumvit 16, Khlong Toei,<br />Bangkok 10110, Thailand"
  },
  {
    key: "google_maps_url",
    title: "Google Maps URL",
    content: "https://maps.app.goo.gl/5Tru3vjNYC87xc1g7?g_st=ipc"
  },
  {
    key: "contact_email",
    title: "Contact Email",
    content: "collective.tonelab@gmail.com"
  },
  {
    key: "contact_phone",
    title: "Contact Phone",
    content: "+66 (0) 12-345-6789"
  }
];