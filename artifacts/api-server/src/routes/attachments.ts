import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, attachmentsTable, ticketsTable } from "@workspace/db";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "image/jpeg", "image/png", "image/gif", "image/webp",
      "application/pdf", "text/plain", "text/csv",
      "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "video/mp4", "audio/mpeg", "audio/ogg",
    ];
    cb(null, allowed.includes(file.mimetype));
  },
});

const router: IRouter = Router();

router.get("/tickets/:id/attachments", async (req, res): Promise<void> => {
  const id = parseInt(req.params["id"] as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const rows = await db
    .select()
    .from(attachmentsTable)
    .where(eq(attachmentsTable.ticketId, id))
    .orderBy(desc(attachmentsTable.createdAt));
  res.json(rows);
});

router.post("/tickets/:id/attachments", upload.single("file"), async (req, res): Promise<void> => {
  const id = parseInt(req.params["id"] as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  if (!req.file) { res.status(400).json({ error: "No file uploaded" }); return; }

  const [ticket] = await db.select().from(ticketsTable).where(eq(ticketsTable.id, id));
  if (!ticket) { res.status(404).json({ error: "Ticket not found" }); return; }

  const [attachment] = await db.insert(attachmentsTable).values({
    ticketId: id,
    fileName: req.file.filename,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    fileSize: req.file.size,
    storagePath: `/api/attachments/file/${req.file.filename}`,
    uploadedBy: (req.body as any)?.uploadedBy ?? "Agent",
  }).returning();

  res.status(201).json(attachment);
});

router.get("/attachments/file/:filename", (req, res): void => {
  const filename = req.params["filename"] as string;
  const safeName = path.basename(filename);
  const filePath = path.join(uploadsDir, safeName);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "File not found" });
    return;
  }
  res.sendFile(filePath);
});

router.delete("/attachments/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params["id"] as string, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [row] = await db.select().from(attachmentsTable).where(eq(attachmentsTable.id, id));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  const filePath = path.join(uploadsDir, row.fileName);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  await db.delete(attachmentsTable).where(eq(attachmentsTable.id, id));
  res.json({ success: true });
});

export default router;
