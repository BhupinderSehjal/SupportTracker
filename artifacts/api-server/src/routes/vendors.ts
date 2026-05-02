import { Router, type IRouter } from "express";
import { ilike } from "drizzle-orm";
import { db, vendorsTable } from "@workspace/db";
import { CreateVendorBody, ListVendorsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/vendors", async (req, res): Promise<void> => {
  const parsed = ListVendorsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { search } = parsed.data;
  const rows = await db
    .select()
    .from(vendorsTable)
    .where(search ? ilike(vendorsTable.name, `%${search}%`) : undefined)
    .orderBy(vendorsTable.name);
  res.json(rows);
});

router.post("/vendors", async (req, res): Promise<void> => {
  const parsed = CreateVendorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [vendor] = await db.insert(vendorsTable).values(parsed.data).returning();
  res.status(201).json(vendor);
});

export default router;
