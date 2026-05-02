import { Router, type IRouter } from "express";
import { eq, desc, and, sql } from "drizzle-orm";
import { db, notificationsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/notifications", async (req, res): Promise<void> => {
  const userId = req.query["userId"] ? parseInt(req.query["userId"] as string, 10) : null;
  const conditions = userId ? [eq(notificationsTable.userId, userId)] : [];
  const rows = await db
    .select()
    .from(notificationsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(notificationsTable.createdAt))
    .limit(50);
  res.json(rows);
});

router.get("/notifications/count", async (req, res): Promise<void> => {
  const userId = req.query["userId"] ? parseInt(req.query["userId"] as string, 10) : null;
  const conditions = [eq(notificationsTable.read, false)];
  if (userId) conditions.push(eq(notificationsTable.userId, userId));
  const [{ count }] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(notificationsTable)
    .where(and(...conditions));
  res.json({ count: count ?? 0 });
});

router.patch("/notifications/:id/read", async (req, res): Promise<void> => {
  const id = parseInt(req.params["id"] as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [row] = await db
    .update(notificationsTable)
    .set({ read: true })
    .where(eq(notificationsTable.id, id))
    .returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(row);
});

router.post("/notifications/read-all", async (req, res): Promise<void> => {
  const userId = req.body?.userId ? parseInt(req.body.userId, 10) : null;
  const conditions = [eq(notificationsTable.read, false)];
  if (userId) conditions.push(eq(notificationsTable.userId, userId));
  await db.update(notificationsTable).set({ read: true }).where(and(...conditions));
  res.json({ success: true });
});

export async function createNotification(opts: {
  userId?: number | null;
  ticketId?: number | null;
  type: "ticket_assigned" | "ticket_escalated" | "sla_breach" | "new_message" | "ticket_created" | "ticket_resolved" | "automation_triggered" | "mention";
  title: string;
  body: string;
}) {
  await db.insert(notificationsTable).values({
    userId: opts.userId ?? null,
    ticketId: opts.ticketId ?? null,
    type: opts.type,
    title: opts.title,
    body: opts.body,
  });
}

export default router;
