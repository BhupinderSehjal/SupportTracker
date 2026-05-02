import { pgTable, serial, text, timestamp, boolean, jsonb, pgEnum } from "drizzle-orm/pg-core";

export const automationTriggerEnum = pgEnum("automation_trigger", [
  "ticket_created", "ticket_updated", "message_received",
  "sla_breached", "status_changed", "priority_changed"
]);

export const automationRulesTable = pgTable("automation_rules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  triggerType: automationTriggerEnum("trigger_type").notNull(),
  conditions: jsonb("conditions").notNull().default([]),
  actions: jsonb("actions").notNull().default([]),
  active: boolean("active").notNull().default(true),
  runCount: text("run_count").notNull().default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type AutomationRule = typeof automationRulesTable.$inferSelect;
