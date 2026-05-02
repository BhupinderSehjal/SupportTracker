import { pgTable, serial, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const webhooksTable = pgTable("webhooks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  events: text("events").array().notNull().default([]),
  secret: text("secret"),
  active: boolean("active").notNull().default(true),
  lastTriggeredAt: timestamp("last_triggered_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Webhook = typeof webhooksTable.$inferSelect;
