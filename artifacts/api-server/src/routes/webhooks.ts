import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, webhooksTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/webhooks", async (_req, res): Promise<void> => {
  const rows = await db.select().from(webhooksTable).orderBy(desc(webhooksTable.createdAt));
  res.json(rows);
});

router.post("/webhooks", async (req, res): Promise<void> => {
  const { name, url, events, secret, active } = req.body;
  if (!name || !url) {
    res.status(400).json({ error: "name and url are required" });
    return;
  }
  const [hook] = await db.insert(webhooksTable).values({
    name,
    url,
    events: events ?? [],
    secret: secret ?? null,
    active: active !== false,
  }).returning();
  res.status(201).json(hook);
});

router.patch("/webhooks/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params["id"] as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { name, url, events, secret, active } = req.body;
  const update: Record<string, unknown> = {};
  if (name !== undefined) update["name"] = name;
  if (url !== undefined) update["url"] = url;
  if (events !== undefined) update["events"] = events;
  if (secret !== undefined) update["secret"] = secret;
  if (active !== undefined) update["active"] = active;
  const [hook] = await db.update(webhooksTable).set(update as any).where(eq(webhooksTable.id, id)).returning();
  if (!hook) { res.status(404).json({ error: "Not found" }); return; }
  res.json(hook);
});

router.delete("/webhooks/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params["id"] as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(webhooksTable).where(eq(webhooksTable.id, id));
  res.json({ success: true });
});

// Fire a webhook event to all registered listeners for that event
export async function fireWebhook(event: string, payload: Record<string, unknown>) {
  try {
    const hooks = await db.select().from(webhooksTable).where(eq(webhooksTable.active, true));
    for (const hook of hooks) {
      if (!hook.events.includes(event) && !hook.events.includes("*")) continue;
      const body = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (hook.secret) headers["X-Webhook-Secret"] = hook.secret;
      try {
        await fetch(hook.url, { method: "POST", headers, body, signal: AbortSignal.timeout(5000) });
        await db.update(webhooksTable).set({ lastTriggeredAt: new Date() }).where(eq(webhooksTable.id, hook.id));
      } catch (_err) {
        // Webhook delivery failure — log silently
      }
    }
  } catch (_err) {
    // Don't crash the main request
  }
}

export default router;
