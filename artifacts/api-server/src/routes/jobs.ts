import { Router, type IRouter } from "express";
import { eq, ilike, sql, and } from "drizzle-orm";
import { db, jobsTable, clientsTable, sitesTable, ticketsTable } from "@workspace/db";
import { CreateJobBody, ListJobsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

function generateJobNumber() {
  return `JOB-${Date.now().toString(36).toUpperCase()}`;
}

router.get("/jobs", async (req, res): Promise<void> => {
  const parsed = ListJobsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { clientId, siteId, search, status } = parsed.data;

  const openTicketCountSq = db
    .select({ jobId: ticketsTable.jobId, openTicketCount: sql<number>`cast(count(*) as int)`.as("open_ticket_count") })
    .from(ticketsTable)
    .where(sql`${ticketsTable.status} NOT IN ('resolved', 'closed')`)
    .groupBy(ticketsTable.jobId)
    .as("open_ticket_counts");

  const conditions = [];
  if (clientId) conditions.push(eq(jobsTable.clientId, clientId));
  if (siteId) conditions.push(eq(jobsTable.siteId, siteId));
  if (search) conditions.push(ilike(jobsTable.title, `%${search}%`));
  if (status) conditions.push(eq(jobsTable.status, status as any));

  const rows = await db
    .select({
      id: jobsTable.id,
      title: jobsTable.title,
      jobNumber: jobsTable.jobNumber,
      type: jobsTable.type,
      status: jobsTable.status,
      clientId: jobsTable.clientId,
      clientName: clientsTable.name,
      siteId: jobsTable.siteId,
      siteName: sitesTable.name,
      description: jobsTable.description,
      scheduledAt: jobsTable.scheduledAt,
      createdAt: jobsTable.createdAt,
      openTicketCount: sql<number>`coalesce(${openTicketCountSq.openTicketCount}, 0)`,
    })
    .from(jobsTable)
    .leftJoin(clientsTable, eq(clientsTable.id, jobsTable.clientId))
    .leftJoin(sitesTable, eq(sitesTable.id, jobsTable.siteId))
    .leftJoin(openTicketCountSq, eq(openTicketCountSq.jobId, jobsTable.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(jobsTable.createdAt);

  res.json(rows);
});

router.post("/jobs", async (req, res): Promise<void> => {
  const parsed = CreateJobBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [job] = await db.insert(jobsTable).values({ ...parsed.data, jobNumber: generateJobNumber() }).returning();
  const clientName = job.clientId
    ? (await db.select().from(clientsTable).where(eq(clientsTable.id, job.clientId)))[0]?.name
    : null;
  const siteName = job.siteId
    ? (await db.select().from(sitesTable).where(eq(sitesTable.id, job.siteId)))[0]?.name
    : null;
  res.status(201).json({ ...job, clientName: clientName ?? null, siteName: siteName ?? null, openTicketCount: 0 });
});

export default router;
