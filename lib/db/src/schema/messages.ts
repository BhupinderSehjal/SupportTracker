import { pgTable, serial, text, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { ticketsTable } from "./tickets";

export const messageTypeEnum = pgEnum("message_type", ["inbound", "outbound", "internal_note"]);
export const messageChannelEnum = pgEnum("message_channel", ["email", "whatsapp", "internal"]);
export const messageSenderTypeEnum = pgEnum("message_sender_type", ["agent", "contact", "system"]);

export const messagesTable = pgTable("messages", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").notNull().references(() => ticketsTable.id),
  body: text("body").notNull(),
  type: messageTypeEnum("type").notNull(),
  channel: messageChannelEnum("channel").notNull(),
  senderName: text("sender_name").notNull(),
  senderType: messageSenderTypeEnum("sender_type").notNull().default("agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messagesTable).omit({ id: true, createdAt: true });
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messagesTable.$inferSelect;
