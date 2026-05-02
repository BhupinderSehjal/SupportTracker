import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db, usersTable, ticketsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/users", async (_req, res): Promise<void> => {
  const assignedCountSq = db
    .select({ assignedToId: ticketsTable.assignedToId, assignedCount: sql<number>`cast(count(*) as int)`.as("assigned_count") })
    .from(ticketsTable)
    .where(sql`${ticketsTable.status} NOT IN ('resolved', 'closed')`)
    .groupBy(ticketsTable.assignedToId)
    .as("assigned_counts");

  const rows = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      role: usersTable.role,
      avatar: usersTable.avatar,
      status: usersTable.status,
      createdAt: usersTable.createdAt,
      assignedTicketCount: sql<number>`coalesce(${assignedCountSq.assignedCount}, 0)`,
    })
    .from(usersTable)
    .leftJoin(assignedCountSq, sql`${assignedCountSq.assignedToId} = ${usersTable.id}`)
    .orderBy(usersTable.name);

  res.json(rows);
});

export default router;
