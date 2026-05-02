import { Router, type IRouter } from "express";
import { eq, ilike, sql, and } from "drizzle-orm";
import { db, sitesTable, clientsTable, ticketsTable } from "@workspace/db";
import { CreateSiteBody, ListSitesQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/sites", async (req, res): Promise<void> => {
  const parsed = ListSitesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { clientId, search } = parsed.data;

  const openTicketCountSq = db
    .select({ siteId: ticketsTable.siteId, openTicketCount: sql<number>`cast(count(*) as int)`.as("open_ticket_count") })
    .from(ticketsTable)
    .where(sql`${ticketsTable.status} NOT IN ('resolved', 'closed')`)
    .groupBy(ticketsTable.siteId)
    .as("open_ticket_counts");

  const conditions = [];
  if (clientId) conditions.push(eq(sitesTable.clientId, clientId));
  if (search) conditions.push(ilike(sitesTable.name, `%${search}%`));

  const rows = await db
    .select({
      id: sitesTable.id,
      name: sitesTable.name,
      address: sitesTable.address,
      clientId: sitesTable.clientId,
      clientName: clientsTable.name,
      status: sitesTable.status,
      createdAt: sitesTable.createdAt,
      openTicketCount: sql<number>`coalesce(${openTicketCountSq.openTicketCount}, 0)`,
    })
    .from(sitesTable)
    .leftJoin(clientsTable, eq(clientsTable.id, sitesTable.clientId))
    .leftJoin(openTicketCountSq, eq(openTicketCountSq.siteId, sitesTable.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(sitesTable.name);

  res.json(rows);
});

router.post("/sites", async (req, res): Promise<void> => {
  const parsed = CreateSiteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [site] = await db.insert(sitesTable).values(parsed.data).returning();
  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, site.clientId));
  res.status(201).json({ ...site, clientName: client?.name ?? "", openTicketCount: 0 });
});

export default router;
