import { Router, type IRouter } from "express";
import { sql, eq, gte, and } from "drizzle-orm";
import { db, ticketsTable, usersTable, messagesTable, activityTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [counts] = await db.select({
    totalOpen: sql<number>`cast(sum(case when status = 'open' then 1 else 0 end) as int)`,
    totalInProgress: sql<number>`cast(sum(case when status = 'in_progress' then 1 else 0 end) as int)`,
    totalEscalated: sql<number>`cast(sum(case when status = 'escalated' then 1 else 0 end) as int)`,
    totalResolved: sql<number>`cast(sum(case when status = 'resolved' or status = 'closed' then 1 else 0 end) as int)`,
    emailTickets: sql<number>`cast(sum(case when channel = 'email' then 1 else 0 end) as int)`,
    whatsappTickets: sql<number>`cast(sum(case when channel = 'whatsapp' then 1 else 0 end) as int)`,
    manualTickets: sql<number>`cast(sum(case when channel = 'manual' then 1 else 0 end) as int)`,
    urgentOpen: sql<number>`cast(sum(case when priority = 'urgent' and status not in ('resolved','closed') then 1 else 0 end) as int)`,
    unassignedOpen: sql<number>`cast(sum(case when assigned_to_id is null and status not in ('resolved','closed') then 1 else 0 end) as int)`,
    slaBreachedCount: sql<number>`cast(sum(case when sla_breached = true then 1 else 0 end) as int)`,
    totalAll: sql<number>`cast(count(*) as int)`,
  }).from(ticketsTable);

  const [todayCount] = await db.select({
    count: sql<number>`cast(count(*) as int)`,
  }).from(ticketsTable).where(gte(ticketsTable.createdAt, today));

  // avg response time in minutes
  const [avgResp] = await db.select({
    avg: sql<number>`coalesce(avg(extract(epoch from (first_response_at - created_at)) / 60), 0)`,
  }).from(ticketsTable).where(sql`first_response_at is not null`);

  const total = counts.totalAll ?? 0;
  const breached = counts.slaBreachedCount ?? 0;
  const complianceRate = total > 0 ? Math.round(((total - breached) / total) * 100) : 100;

  res.json({
    totalOpen: counts.totalOpen ?? 0,
    totalInProgress: counts.totalInProgress ?? 0,
    totalEscalated: counts.totalEscalated ?? 0,
    totalResolved: counts.totalResolved ?? 0,
    totalToday: todayCount.count ?? 0,
    avgResponseTimeMinutes: Math.round((avgResp.avg ?? 0) * 10) / 10,
    slaComplianceRate: complianceRate,
    emailTickets: counts.emailTickets ?? 0,
    whatsappTickets: counts.whatsappTickets ?? 0,
    manualTickets: counts.manualTickets ?? 0,
    urgentOpen: counts.urgentOpen ?? 0,
    unassignedOpen: counts.unassignedOpen ?? 0,
  });
});

router.get("/dashboard/ticket-trends", async (_req, res): Promise<void> => {
  const days: { date: string; created: number; resolved: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);

    const [{ created }] = await db.select({
      created: sql<number>`cast(count(*) as int)`,
    }).from(ticketsTable).where(
      and(gte(ticketsTable.createdAt, d), sql`${ticketsTable.createdAt} < ${next}`)
    );

    const [{ resolved }] = await db.select({
      resolved: sql<number>`cast(count(*) as int)`,
    }).from(ticketsTable).where(
      and(
        sql`${ticketsTable.resolved_at} >= ${d}`,
        sql`${ticketsTable.resolved_at} < ${next}`
      )
    ).catch(() => [{ resolved: 0 }]);

    days.push({
      date: d.toISOString().slice(0, 10),
      created: created ?? 0,
      resolved: resolved ?? 0,
    });
  }
  res.json(days);
});

router.get("/dashboard/channel-breakdown", async (_req, res): Promise<void> => {
  const rows = await db.select({
    channel: ticketsTable.channel,
    count: sql<number>`cast(count(*) as int)`,
  }).from(ticketsTable).groupBy(ticketsTable.channel);

  const total = rows.reduce((s, r) => s + (r.count ?? 0), 0);
  const result = rows.map(r => ({
    channel: r.channel,
    count: r.count ?? 0,
    percentage: total > 0 ? Math.round(((r.count ?? 0) / total) * 100) : 0,
  }));
  res.json(result);
});

router.get("/dashboard/sla-summary", async (_req, res): Promise<void> => {
  const [counts] = await db.select({
    total: sql<number>`cast(count(*) as int)`,
    breached: sql<number>`cast(sum(case when sla_breached then 1 else 0 end) as int)`,
  }).from(ticketsTable).where(sql`status not in ('resolved','closed')`);

  const total = counts.total ?? 0;
  const breached = counts.breached ?? 0;
  // "at risk" = open tickets older than 2 hours without first response
  const [atRiskRes] = await db.select({
    count: sql<number>`cast(count(*) as int)`,
  }).from(ticketsTable).where(
    sql`status not in ('resolved','closed') and first_response_at is null and created_at < now() - interval '2 hours'`
  );

  const atRisk = atRiskRes.count ?? 0;
  const compliant = total - breached;
  const complianceRate = total > 0 ? Math.round((compliant / total) * 100) : 100;

  res.json({ compliant, breached, atRisk, complianceRate });
});

router.get("/dashboard/recent-activity", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: activityTable.id,
      ticketId: activityTable.ticketId,
      ticketNumber: ticketsTable.ticketNumber,
      action: activityTable.action,
      description: activityTable.description,
      agentName: activityTable.agentName,
      createdAt: activityTable.createdAt,
    })
    .from(activityTable)
    .leftJoin(ticketsTable, eq(ticketsTable.id, activityTable.ticketId))
    .orderBy(sql`${activityTable.createdAt} desc`)
    .limit(20);

  res.json(rows);
});

router.get("/dashboard/agent-stats", async (_req, res): Promise<void> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const users = await db.select().from(usersTable).orderBy(usersTable.name);

  const stats = await Promise.all(users.map(async (user) => {
    const [{ openTickets }] = await db.select({
      openTickets: sql<number>`cast(count(*) as int)`,
    }).from(ticketsTable).where(
      and(eq(ticketsTable.assignedToId, user.id), sql`${ticketsTable.status} not in ('resolved','closed')`)
    );

    const [{ resolvedToday }] = await db.select({
      resolvedToday: sql<number>`cast(count(*) as int)`,
    }).from(ticketsTable).where(
      and(
        eq(ticketsTable.assignedToId, user.id),
        sql`${ticketsTable.resolved_at} >= ${today}`
      )
    ).catch(() => [{ resolvedToday: 0 }]);

    const [avgResp] = await db.select({
      avg: sql<number>`coalesce(avg(extract(epoch from (first_response_at - created_at)) / 60), 0)`,
    }).from(ticketsTable).where(
      and(eq(ticketsTable.assignedToId, user.id), sql`first_response_at is not null`)
    );

    return {
      agentId: user.id,
      agentName: user.name,
      openTickets: openTickets ?? 0,
      resolvedToday: resolvedToday ?? 0,
      avgResponseMinutes: Math.round((avgResp.avg ?? 0) * 10) / 10,
    };
  }));

  res.json(stats);
});

export default router;
