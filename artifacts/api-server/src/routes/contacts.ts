import { Router, type IRouter } from "express";
import { eq, ilike, sql, and } from "drizzle-orm";
import { db, contactsTable, clientsTable } from "@workspace/db";
import { CreateContactBody, ListContactsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/contacts", async (req, res): Promise<void> => {
  const parsed = ListContactsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { clientId, search } = parsed.data;
  const conditions = [];
  if (clientId) conditions.push(eq(contactsTable.clientId, clientId));
  if (search) conditions.push(ilike(contactsTable.name, `%${search}%`));

  const rows = await db
    .select({
      id: contactsTable.id,
      name: contactsTable.name,
      email: contactsTable.email,
      phone: contactsTable.phone,
      clientId: contactsTable.clientId,
      clientName: clientsTable.name,
      createdAt: contactsTable.createdAt,
    })
    .from(contactsTable)
    .leftJoin(clientsTable, eq(clientsTable.id, contactsTable.clientId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(contactsTable.name);

  res.json(rows);
});

router.post("/contacts", async (req, res): Promise<void> => {
  const parsed = CreateContactBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [contact] = await db.insert(contactsTable).values(parsed.data).returning();
  const clientName = contact.clientId
    ? (await db.select().from(clientsTable).where(eq(clientsTable.id, contact.clientId)))[0]?.name
    : null;
  res.status(201).json({ ...contact, clientName: clientName ?? null });
});

export default router;
