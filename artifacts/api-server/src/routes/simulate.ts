import { Router, type IRouter } from "express";
import { db, ticketsTable, messagesTable, activityTable, clientsTable, contactsTable } from "@workspace/db";
import { ilike, eq } from "drizzle-orm";
import { runAutomations } from "./automation.js";
import { fireWebhook } from "./webhooks.js";
import { createNotification } from "./notifications.js";

const router: IRouter = Router();

function generateTicketNumber() {
  return `TKT-${Date.now().toString(36).toUpperCase()}`;
}

function computeSlaDeadline(priority: string): Date {
  const now = new Date();
  const hours: Record<string, number> = { urgent: 2, high: 4, medium: 8, low: 24 };
  const h = hours[priority] ?? 8;
  return new Date(now.getTime() + h * 60 * 60 * 1000);
}

// Simulate an inbound email
router.post("/simulate/email", async (req, res): Promise<void> => {
  const { fromEmail, fromName, subject, body, priority = "medium" } = req.body;
  if (!fromEmail || !subject) {
    res.status(400).json({ error: "fromEmail and subject are required" });
    return;
  }

  // Auto-link: try to match email domain to a client
  const domain = fromEmail.split("@")[1] ?? "";
  const matchingClients = domain
    ? await db.select().from(clientsTable).where(ilike(clientsTable.email, `%${domain}%`))
    : [];
  const clientId = matchingClients[0]?.id ?? null;

  // Auto-link: try to find contact by email
  const matchingContacts = await db.select().from(contactsTable).where(eq(contactsTable.email, fromEmail));
  const contactId = matchingContacts[0]?.id ?? null;

  const [ticket] = await db.insert(ticketsTable).values({
    ticketNumber: generateTicketNumber(),
    subject,
    description: body ?? "",
    channel: "email",
    status: "open",
    priority: priority as any,
    clientId,
    contactId,
    slaDeadlineAt: computeSlaDeadline(priority),
  }).returning();

  await db.insert(messagesTable).values({
    ticketId: ticket.id,
    body: body ?? subject,
    type: "inbound",
    channel: "email",
    senderName: fromName ? `${fromName} <${fromEmail}>` : fromEmail,
    senderType: "contact",
  });

  await db.insert(activityTable).values({
    ticketId: ticket.id,
    action: "created",
    description: `Ticket created from inbound email from ${fromEmail}`,
    agentName: "System",
  });

  await runAutomations("ticket_created", ticket);
  await fireWebhook("ticket.created", { ticketId: ticket.id, channel: "email", subject });
  await createNotification({ type: "ticket_created", title: "New Email Ticket", body: `"${subject}" from ${fromName ?? fromEmail}`, ticketId: ticket.id });

  res.status(201).json({ ticket, autoLinkedClient: clientId, autoLinkedContact: contactId });
});

// Simulate an inbound WhatsApp message
router.post("/simulate/whatsapp", async (req, res): Promise<void> => {
  const { fromPhone, fromName, message, priority = "medium" } = req.body;
  if (!fromPhone || !message) {
    res.status(400).json({ error: "fromPhone and message are required" });
    return;
  }

  // Auto-link: try to find contact by phone
  const matchingContacts = await db.select().from(contactsTable).where(eq(contactsTable.phone, fromPhone));
  const contactId = matchingContacts[0]?.id ?? null;

  const subject = message.length > 60 ? message.slice(0, 57) + "..." : message;

  const [ticket] = await db.insert(ticketsTable).values({
    ticketNumber: generateTicketNumber(),
    subject,
    description: message,
    channel: "whatsapp",
    status: "open",
    priority: priority as any,
    contactId,
    slaDeadlineAt: computeSlaDeadline(priority),
  }).returning();

  await db.insert(messagesTable).values({
    ticketId: ticket.id,
    body: message,
    type: "inbound",
    channel: "whatsapp",
    senderName: fromName ? `${fromName} (${fromPhone})` : fromPhone,
    senderType: "contact",
  });

  await db.insert(activityTable).values({
    ticketId: ticket.id,
    action: "created",
    description: `Ticket created from WhatsApp message from ${fromPhone}`,
    agentName: "System",
  });

  await runAutomations("ticket_created", ticket);
  await fireWebhook("ticket.created", { ticketId: ticket.id, channel: "whatsapp", subject });
  await createNotification({ type: "ticket_created", title: "New WhatsApp Ticket", body: `"${subject}" from ${fromName ?? fromPhone}`, ticketId: ticket.id });

  res.status(201).json({ ticket, autoLinkedContact: contactId });
});

export default router;
