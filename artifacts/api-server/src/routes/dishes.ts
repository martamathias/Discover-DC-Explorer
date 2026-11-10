import { Router } from "express";
import pg from "pg";
import { z } from "zod";
import { inspectDish } from "../agents/dishInspector";

const router = Router();
let pool: pg.Pool | undefined;
let initialized: Promise<unknown> | undefined;
async function database() {
  if (!process.env.DATABASE_URL) throw new Error("GALLERY_NOT_CONFIGURED");
  pool ??= new pg.Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
  initialized ??= pool.query(`CREATE TABLE IF NOT EXISTS dish_photos (
    id SERIAL PRIMARY KEY, title TEXT NOT NULL, caption TEXT NOT NULL,
    mime_type TEXT NOT NULL, image_base64 TEXT NOT NULL,
    inspector_note TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`).catch((error) => { initialized = undefined; throw error; });
  await initialized;
  return pool;
}
const uploadSchema = z.object({
  title: z.string().trim().min(1).max(120),
  caption: z.string().trim().max(500).default(""),
  image: z.string().max(4.2 * 1024 * 1024),
});
function serviceError(error: unknown) {
  return error instanceof Error && error.message === "GALLERY_NOT_CONFIGURED"
    ? "The photo gallery needs its database connection configured."
    : error instanceof Error && error.message === "INSPECTOR_NOT_CONFIGURED"
      ? "Photo inspection is not configured yet. Please try again later."
      : "The gallery could not complete this request. Please try again.";
}

router.get("/dishes", async (req, res) => {
  try {
    const db = await database();
    const { rows } = await db.query("SELECT id,title,caption,inspector_note,created_at FROM dish_photos ORDER BY created_at DESC,id DESC LIMIT 100");
    res.json(rows.map((row) => ({ ...row, imageUrl: `/api/dishes/${row.id}/image` })));
  } catch (error) {
    req.log.error({ err: error }, "Dish gallery list failed");
    res.status(503).json({ error: serviceError(error) });
  }
});
router.get("/dishes/:id/image", async (req, res) => {
  if (!/^\d+$/.test(String(req.params.id))) { res.status(404).json({ error: "Photo not found." }); return; }
  try {
    const db = await database();
    const { rows } = await db.query("SELECT mime_type,image_base64 FROM dish_photos WHERE id=$1", [req.params.id]);
    if (!rows.length) { res.status(404).json({ error: "Photo not found." }); return; }
    res.setHeader("Content-Type", rows[0].mime_type);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.send(Buffer.from(rows[0].image_base64, "base64"));
  } catch (error) { req.log.error({ err: error }, "Dish image failed"); res.status(503).json({ error: serviceError(error) }); }
});
router.post("/dishes", async (req, res) => {
  const parsed = uploadSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Add a title (up to 120 characters), a caption (up to 500), and a JPEG, PNG, or WebP photo under 3 MB." }); return; }
  const { title, caption, image } = parsed.data;
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(image);
  if (!match) { res.status(400).json({ error: "Choose a JPEG, PNG, or WebP photo. GIF files are not supported." }); return; }
  const bytes = Buffer.from(match[2], "base64");
  if (!bytes.length || bytes.length > 3 * 1024 * 1024) { res.status(413).json({ error: "Choose a photo under 3 MB." }); return; }
  const mime = match[1];
  const valid = mime === "image/jpeg" ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
    : mime === "image/png" ? bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
      : bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
  if (!valid || bytes.toString("base64") !== match[2]) { res.status(400).json({ error: "The photo data does not match its image format. Choose another photo." }); return; }
  try {
    const db = await database();
    const inspection = await inspectDish(image, title, caption);
    if (!inspection.isMatch || inspection.confidence < 0.7) {
      res.status(422).json({ error: "The inspector could not confidently approve this dish photo.", inspection }); return;
    }
    const { rows } = await db.query("INSERT INTO dish_photos(title,caption,mime_type,image_base64,inspector_note) VALUES($1,$2,$3,$4,$5) RETURNING id,title,caption,inspector_note,created_at", [title, caption, mime, match[2], inspection.whatISee]);
    res.status(201).json({ ...rows[0], imageUrl: `/api/dishes/${rows[0].id}/image` });
  } catch (error) {
    req.log.error({ err: error }, "Dish upload failed");
    res.status(503).json({ error: serviceError(error) });
  }
});
export default router;
