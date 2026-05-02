import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { ticketsTable } from "./tickets";

export const activityTable = pgTable("activity", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").notNull().references(() => ticketsTable.id),
  action: text("action").notNull(),
  description: text("description").notNull(),
  agentName: text("agent_name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Activity = typeof activityTable.$inferSelect;
