import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, automationRulesTable, ticketsTable, activityTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/automation-rules", async (_req, res): Promise<void> => {
  const rows = await db.select().from(automationRulesTable).orderBy(desc(automationRulesTable.createdAt));
  res.json(rows);
});

router.post("/automation-rules", async (req, res): Promise<void> => {
  const { name, description, triggerType, conditions, actions, active } = req.body;
  if (!name || !triggerType) {
    res.status(400).json({ error: "name and triggerType are required" });
    return;
  }
  const [rule] = await db.insert(automationRulesTable).values({
    name,
    description: description ?? null,
    triggerType,
    conditions: conditions ?? [],
    actions: actions ?? [],
    active: active !== false,
  }).returning();
  res.status(201).json(rule);
});

router.patch("/automation-rules/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params["id"] as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { name, description, triggerType, conditions, actions, active } = req.body;
  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (name !== undefined) update["name"] = name;
  if (description !== undefined) update["description"] = description;
  if (triggerType !== undefined) update["triggerType"] = triggerType;
  if (conditions !== undefined) update["conditions"] = conditions;
  if (actions !== undefined) update["actions"] = actions;
  if (active !== undefined) update["active"] = active;
  const [rule] = await db.update(automationRulesTable).set(update as any).where(eq(automationRulesTable.id, id)).returning();
  if (!rule) { res.status(404).json({ error: "Not found" }); return; }
  res.json(rule);
});

router.delete("/automation-rules/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params["id"] as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(automationRulesTable).where(eq(automationRulesTable.id, id));
  res.json({ success: true });
});

// Evaluate and run automation rules for a ticket event
export async function runAutomations(
  triggerType: string,
  ticket: typeof ticketsTable.$inferSelect
) {
  const rules = await db
    .select()
    .from(automationRulesTable)
    .where(eq(automationRulesTable.active, true));

  for (const rule of rules) {
    if (rule.triggerType !== triggerType) continue;
    const conditions = rule.conditions as Array<{ field: string; operator: string; value: string }>;
    const actions = rule.actions as Array<{ type: string; value: string }>;

    // Evaluate conditions
    const matches = conditions.every(cond => {
      const fieldVal = (ticket as Record<string, unknown>)[cond.field];
      if (cond.operator === "equals") return String(fieldVal) === cond.value;
      if (cond.operator === "not_equals") return String(fieldVal) !== cond.value;
      if (cond.operator === "contains") return String(fieldVal ?? "").toLowerCase().includes(cond.value.toLowerCase());
      return true;
    });

    if (!matches && conditions.length > 0) continue;

    // Execute actions
    const updatePayload: Record<string, unknown> = { updatedAt: new Date() };
    for (const action of actions) {
      if (action.type === "set_priority") updatePayload["priority"] = action.value;
      if (action.type === "set_status") updatePayload["status"] = action.value;
      if (action.type === "assign_agent") updatePayload["assignedToId"] = parseInt(action.value, 10);
      if (action.type === "add_tags") {
        const current = ticket.tags ?? [];
        updatePayload["tags"] = [...new Set([...current, action.value])];
      }
    }

    if (Object.keys(updatePayload).length > 1) {
      await db.update(ticketsTable).set(updatePayload as any).where(eq(ticketsTable.id, ticket.id));
    }

    await db.insert(activityTable).values({
      ticketId: ticket.id,
      action: "automation_triggered",
      description: `Automation rule "${rule.name}" executed`,
      agentName: "Automation Engine",
    });

    // Increment run count
    await db.update(automationRulesTable)
      .set({ runCount: String(parseInt(rule.runCount ?? "0", 10) + 1) })
      .where(eq(automationRulesTable.id, rule.id));
  }
}

export default router;
