import { pgTable, serial, text, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { clientsTable } from "./clients";
import { sitesTable } from "./sites";

export const jobTypeEnum = pgEnum("job_type", ["job", "work_order"]);
export const jobStatusEnum = pgEnum("job_status", ["pending", "active", "completed", "cancelled"]);

export const jobsTable = pgTable("jobs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  jobNumber: text("job_number").notNull().unique(),
  type: jobTypeEnum("type").notNull().default("job"),
  status: jobStatusEnum("status").notNull().default("pending"),
  clientId: integer("client_id").references(() => clientsTable.id),
  siteId: integer("site_id").references(() => sitesTable.id),
  description: text("description"),
  scheduledAt: timestamp("scheduled_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertJobSchema = createInsertSchema(jobsTable).omit({ id: true, jobNumber: true, createdAt: true, updatedAt: true });
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobsTable.$inferSelect;
