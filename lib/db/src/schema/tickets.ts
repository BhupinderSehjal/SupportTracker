import { pgTable, serial, text, timestamp, integer, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { clientsTable } from "./clients";
import { sitesTable } from "./sites";
import { employeesTable } from "./employees";
import { jobsTable } from "./jobs";
import { contactsTable } from "./contacts";
import { usersTable } from "./users";

export const ticketChannelEnum = pgEnum("ticket_channel", ["email", "whatsapp", "manual"]);
export const ticketStatusEnum = pgEnum("ticket_status", [
  "open", "in_progress", "waiting_customer", "waiting_internal", "escalated", "resolved", "closed"
]);
export const ticketPriorityEnum = pgEnum("ticket_priority", ["low", "medium", "high", "urgent"]);

export const ticketsTable = pgTable("tickets", {
  id: serial("id").primaryKey(),
  ticketNumber: text("ticket_number").notNull().unique(),
  subject: text("subject").notNull(),
  description: text("description"),
  channel: ticketChannelEnum("channel").notNull().default("manual"),
  status: ticketStatusEnum("status").notNull().default("open"),
  priority: ticketPriorityEnum("priority").notNull().default("medium"),
  clientId: integer("client_id").references(() => clientsTable.id),
  siteId: integer("site_id").references(() => sitesTable.id),
  employeeId: integer("employee_id").references(() => employeesTable.id),
  jobId: integer("job_id").references(() => jobsTable.id),
  contactId: integer("contact_id").references(() => contactsTable.id),
  assignedToId: integer("assigned_to_id").references(() => usersTable.id),
  tags: text("tags").array().notNull().default([]),
  slaBreached: boolean("sla_breached").notNull().default(false),
  firstResponseAt: timestamp("first_response_at"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertTicketSchema = createInsertSchema(ticketsTable).omit({ id: true, ticketNumber: true, createdAt: true, updatedAt: true });
export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Ticket = typeof ticketsTable.$inferSelect;
