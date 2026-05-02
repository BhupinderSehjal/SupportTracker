import { Router, type IRouter } from "express";
import { eq, ilike, sql, and, desc } from "drizzle-orm";
import {
  db, ticketsTable, clientsTable, sitesTable, employeesTable,
  jobsTable, contactsTable, usersTable, messagesTable, activityTable
} from "@workspace/db";
import {
  CreateTicketBody, UpdateTicketBody, ListTicketsQueryParams,
  CreateMessageBody, GetTicketParams, UpdateTicketParams, GetTicketMessagesParams, CreateMessageParams
} from "@workspace/api-zod";

const router: IRouter = Router();

function generateTicketNumber() {
  return `TKT-${Date.now().toString(36).toUpperCase()}`;
}

async function enrichTicket(ticket: typeof ticketsTable.$inferSelect) {
  const [client] = ticket.clientId
    ? await db.select().from(clientsTable).where(eq(clientsTable.id, ticket.clientId))
    : [null];
  const [site] = ticket.siteId
    ? await db.select().from(sitesTable).where(eq(sitesTable.id, ticket.siteId))
    : [null];
  const [employee] = ticket.employeeId
    ? await db.select().from(employeesTable).where(eq(employeesTable.id, ticket.employeeId))
    : [null];
  const [job] = ticket.jobId
    ? await db.select().from(jobsTable).where(eq(jobsTable.id, ticket.jobId))
    : [null];
  const [contact] = ticket.contactId
    ? await db.select().from(contactsTable).where(eq(contactsTable.id, ticket.contactId))
    : [null];
  const [assignee] = ticket.assignedToId
    ? await db.select().from(usersTable).where(eq(usersTable.id, ticket.assignedToId))
    : [null];
  const msgCount = await db.select({ count: sql<number>`cast(count(*) as int)` })
    .from(messagesTable).where(eq(messagesTable.ticketId, ticket.id));

  return {
    ...ticket,
    clientName: client?.name ?? null,
    siteName: site?.name ?? null,
    employeeName: employee?.name ?? null,
    jobTitle: job?.title ?? null,
    contactName: contact?.name ?? null,
    assignedToName: assignee?.name ?? null,
    messageCount: msgCount[0]?.count ?? 0,
  };
}

router.get("/tickets", async (req, res): Promise<void> => {
  const parsed = ListTicketsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { status, priority, channel, assignedTo, clientId, siteId, jobId, search, page = 1, limit = 25 } = parsed.data;
  const conditions: ReturnType<typeof eq>[] = [];
  if (status) conditions.push(eq(ticketsTable.status, status as any));
  if (priority) conditions.push(eq(ticketsTable.priority, priority as any));
  if (channel) conditions.push(eq(ticketsTable.channel, channel as any));
  if (assignedTo) conditions.push(eq(ticketsTable.assignedToId, assignedTo));
  if (clientId) conditions.push(eq(ticketsTable.clientId, clientId));
  if (siteId) conditions.push(eq(ticketsTable.siteId, siteId));
  if (jobId) conditions.push(eq(ticketsTable.jobId, jobId));
  if (search) conditions.push(ilike(ticketsTable.subject, `%${search}%`));

  const whereClause = conditions.length ? and(...conditions) : undefined;

  const [{ total }] = await db
    .select({ total: sql<number>`cast(count(*) as int)` })
    .from(ticketsTable)
    .where(whereClause);

  const msgCountSq = db
    .select({ ticketId: messagesTable.ticketId, count: sql<number>`cast(count(*) as int)`.as("count") })
    .from(messagesTable)
    .groupBy(messagesTable.ticketId)
    .as("msg_counts");

  const offset = ((page ?? 1) - 1) * (limit ?? 25);
  const rows = await db
    .select({
      id: ticketsTable.id,
      ticketNumber: ticketsTable.ticketNumber,
      subject: ticketsTable.subject,
      description: ticketsTable.description,
      channel: ticketsTable.channel,
      status: ticketsTable.status,
      priority: ticketsTable.priority,
      clientId: ticketsTable.clientId,
      clientName: clientsTable.name,
      siteId: ticketsTable.siteId,
      siteName: sitesTable.name,
      employeeId: ticketsTable.employeeId,
      employeeName: employeesTable.name,
      jobId: ticketsTable.jobId,
      jobTitle: jobsTable.title,
      contactId: ticketsTable.contactId,
      contactName: contactsTable.name,
      assignedToId: ticketsTable.assignedToId,
      assignedToName: usersTable.name,
      tags: ticketsTable.tags,
      slaBreached: ticketsTable.slaBreached,
      firstResponseAt: ticketsTable.firstResponseAt,
      resolvedAt: ticketsTable.resolvedAt,
      createdAt: ticketsTable.createdAt,
      updatedAt: ticketsTable.updatedAt,
      messageCount: sql<number>`coalesce(${msgCountSq.count}, 0)`,
    })
    .from(ticketsTable)
    .leftJoin(clientsTable, eq(clientsTable.id, ticketsTable.clientId))
    .leftJoin(sitesTable, eq(sitesTable.id, ticketsTable.siteId))
    .leftJoin(employeesTable, eq(employeesTable.id, ticketsTable.employeeId))
    .leftJoin(jobsTable, eq(jobsTable.id, ticketsTable.jobId))
    .leftJoin(contactsTable, eq(contactsTable.id, ticketsTable.contactId))
    .leftJoin(usersTable, eq(usersTable.id, ticketsTable.assignedToId))
    .leftJoin(msgCountSq, eq(msgCountSq.ticketId, ticketsTable.id))
    .where(whereClause)
    .orderBy(desc(ticketsTable.updatedAt))
    .limit(limit ?? 25)
    .offset(offset);

  res.json({ tickets: rows, total, page: page ?? 1, limit: limit ?? 25 });
});

router.post("/tickets", async (req, res): Promise<void> => {
  const parsed = CreateTicketBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [ticket] = await db.insert(ticketsTable)
    .values({ ...parsed.data, ticketNumber: generateTicketNumber() })
    .returning();

  await db.insert(activityTable).values({
    ticketId: ticket.id,
    action: "created",
    description: `Ticket created via ${ticket.channel}`,
    agentName: "System",
  });

  const enriched = await enrichTicket(ticket);
  res.status(201).json(enriched);
});

router.get("/tickets/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [ticket] = await db.select().from(ticketsTable).where(eq(ticketsTable.id, id));
  if (!ticket) { res.status(404).json({ error: "Ticket not found" }); return; }

  const enriched = await enrichTicket(ticket);
  const messages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.ticketId, id))
    .orderBy(messagesTable.createdAt);

  res.json({ ...enriched, messages });
});

router.patch("/tickets/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = UpdateTicketBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
  if (parsed.data.status === "resolved" && !updateData.resolvedAt) {
    updateData.resolvedAt = new Date();
  }

  const [ticket] = await db.update(ticketsTable)
    .set(updateData as any)
    .where(eq(ticketsTable.id, id))
    .returning();

  if (!ticket) { res.status(404).json({ error: "Ticket not found" }); return; }

  if (parsed.data.status) {
    await db.insert(activityTable).values({
      ticketId: id,
      action: "status_changed",
      description: `Status changed to ${parsed.data.status}`,
      agentName: "Agent",
    });
  }
  if (parsed.data.assignedToId) {
    const [assignee] = await db.select().from(usersTable).where(eq(usersTable.id, parsed.data.assignedToId));
    await db.insert(activityTable).values({
      ticketId: id,
      action: "assigned",
      description: `Assigned to ${assignee?.name ?? "agent"}`,
      agentName: "Agent",
    });
  }

  const enriched = await enrichTicket(ticket);
  res.json(enriched);
});

router.get("/tickets/:id/messages", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const messages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.ticketId, id))
    .orderBy(messagesTable.createdAt);

  res.json(messages);
});

router.post("/tickets/:id/messages", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const ticketId = parseInt(raw, 10);
  if (isNaN(ticketId)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = CreateMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [ticket] = await db.select().from(ticketsTable).where(eq(ticketsTable.id, ticketId));
  if (!ticket) { res.status(404).json({ error: "Ticket not found" }); return; }

  const isInternal = parsed.data.type === "internal_note";
  const [message] = await db.insert(messagesTable).values({
    ticketId,
    body: parsed.data.body,
    type: parsed.data.type,
    channel: isInternal ? "internal" : ticket.channel === "whatsapp" ? "whatsapp" : "email",
    senderName: "Support Agent",
    senderType: "agent",
  }).returning();

  // Set first response time if not set
  if (!ticket.firstResponseAt && !isInternal) {
    await db.update(ticketsTable)
      .set({ firstResponseAt: new Date(), updatedAt: new Date() })
      .where(eq(ticketsTable.id, ticketId));
  } else {
    await db.update(ticketsTable).set({ updatedAt: new Date() }).where(eq(ticketsTable.id, ticketId));
  }

  await db.insert(activityTable).values({
    ticketId,
    action: isInternal ? "internal_note" : "replied",
    description: isInternal ? "Added internal note" : "Replied to customer",
    agentName: "Support Agent",
  });

  res.status(201).json(message);
});

export default router;
