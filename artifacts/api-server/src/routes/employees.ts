import { Router, type IRouter } from "express";
import { ilike } from "drizzle-orm";
import { db, employeesTable } from "@workspace/db";
import { CreateEmployeeBody, ListEmployeesQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/employees", async (req, res): Promise<void> => {
  const parsed = ListEmployeesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { search } = parsed.data;
  const rows = await db
    .select()
    .from(employeesTable)
    .where(search ? ilike(employeesTable.name, `%${search}%`) : undefined)
    .orderBy(employeesTable.name);
  res.json(rows);
});

router.post("/employees", async (req, res): Promise<void> => {
  const parsed = CreateEmployeeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [employee] = await db.insert(employeesTable).values(parsed.data).returning();
  res.status(201).json(employee);
});

export default router;
