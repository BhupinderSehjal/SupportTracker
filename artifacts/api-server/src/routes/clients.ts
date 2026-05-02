import { Router, type IRouter } from "express";
import { eq, ilike, sql } from "drizzle-orm";
import { db, clientsTable, sitesTable, ticketsTable } from "@workspace/db";
import { CreateClientBody, ListClientsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/clients", async (req, res): Promise<void> => {
  const parsed = ListClientsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { search } = parsed.data;

  const siteCountSq = db
    .select({ clientId: sitesTable.clientId, siteCount: sql<number>`cast(count(*) as int)`.as("site_count") })
    .from(sitesTable)
    .groupBy(sitesTable.clientId)
    .as("site_counts");

  const openTicketCountSq = db
    .select({ clientId: ticketsTable.clientId, openTicketCount: sql<number>`cast(count(*) as int)`.as("open_ticket_count") })
    .from(ticketsTable)
    .where(sql`${ticketsTable.status} NOT IN ('resolved', 'closed')`)
    .groupBy(ticketsTable.clientId)
    .as("open_ticket_counts");

  const rows = await db
    .select({
      id: clientsTable.id,
      name: clientsTable.name,
      email: clientsTable.email,
      phone: clientsTable.phone,
      address: clientsTable.address,
      industry: clientsTable.industry,
      status: clientsTable.status,
      createdAt: clientsTable.createdAt,
      siteCount: sql<number>`coalesce(${siteCountSq.siteCount}, 0)`,
      openTicketCount: sql<number>`coalesce(${openTicketCountSq.openTicketCount}, 0)`,
    })
    .from(clientsTable)
    .leftJoin(siteCountSq, eq(siteCountSq.clientId, clientsTable.id))
    .leftJoin(openTicketCountSq, eq(openTicketCountSq.clientId, clientsTable.id))
    .where(search ? ilike(clientsTable.name, `%${search}%`) : undefined)
    .orderBy(clientsTable.name);

  res.json(rows);
});

router.post("/clients", async (req, res): Promise<void> => {
  const parsed = CreateClientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [client] = await db.insert(clientsTable).values(parsed.data).returning();
  const result = { ...client, siteCount: 0, openTicketCount: 0 };
  res.status(201).json(result);
});

router.get("/clients/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const siteCountSq = db
    .select({ clientId: sitesTable.clientId, siteCount: sql<number>`cast(count(*) as int)`.as("site_count") })
    .from(sitesTable)
    .where(eq(sitesTable.clientId, id))
    .groupBy(sitesTable.clientId)
    .as("site_counts");

  const openTicketCountSq = db
    .select({ clientId: ticketsTable.clientId, openTicketCount: sql<number>`cast(count(*) as int)`.as("open_ticket_count") })
    .from(ticketsTable)
    .where(sql`${ticketsTable.clientId} = ${id} AND ${ticketsTable.status} NOT IN ('resolved', 'closed')`)
    .groupBy(ticketsTable.clientId)
    .as("open_ticket_counts");

  const [client] = await db
    .select({
      id: clientsTable.id,
      name: clientsTable.name,
      email: clientsTable.email,
      phone: clientsTable.phone,
      address: clientsTable.address,
      industry: clientsTable.industry,
      status: clientsTable.status,
      createdAt: clientsTable.createdAt,
      siteCount: sql<number>`coalesce(${siteCountSq.siteCount}, 0)`,
      openTicketCount: sql<number>`coalesce(${openTicketCountSq.openTicketCount}, 0)`,
    })
    .from(clientsTable)
    .leftJoin(siteCountSq, eq(siteCountSq.clientId, clientsTable.id))
    .leftJoin(openTicketCountSq, eq(openTicketCountSq.clientId, clientsTable.id))
    .where(eq(clientsTable.id, id));

  if (!client) { res.status(404).json({ error: "Client not found" }); return; }
  res.json(client);
});

export default router;
