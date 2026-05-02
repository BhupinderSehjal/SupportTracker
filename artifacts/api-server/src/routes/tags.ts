import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db, tagsTable, ticketsTable } from "@workspace/db";
import { CreateTagBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/tags", async (_req, res): Promise<void> => {
  const rows = await db.select().from(tagsTable).orderBy(tagsTable.name);
  // count tickets per tag
  const allTickets = await db.select({ tags: ticketsTable.tags }).from(ticketsTable);
  const tagCounts: Record<string, number> = {};
  for (const t of allTickets) {
    for (const tag of t.tags ?? []) {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
    }
  }
  const result = rows.map(t => ({ ...t, ticketCount: tagCounts[t.name] ?? 0 }));
  res.json(result);
});

router.post("/tags", async (req, res): Promise<void> => {
  const parsed = CreateTagBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [tag] = await db.insert(tagsTable).values(parsed.data).returning();
  res.status(201).json({ ...tag, ticketCount: 0 });
});

export default router;
