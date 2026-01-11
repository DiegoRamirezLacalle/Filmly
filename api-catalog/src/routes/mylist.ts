import { Router } from "express";
import jwt from "jsonwebtoken";
import { getDb } from "../lib/mongo.js";

const router = Router();

type AuthUser = { userId: string; email?: string };

function getAuthUser(req: any): AuthUser | null {
  const header = String(req.headers.authorization || "");
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;

  const secret = process.env.JWT_SECRET || "";
  if (!secret) return null;

  try {
    const payload: any = jwt.verify(token, secret);
    const userId = String(payload.sub || payload.userId || "");
    const email = payload.email ? String(payload.email) : undefined;

    if (!userId) return null;
    return { userId, email };
  } catch {
    return null;
  }
}

/**
 * POST /mylist
 * body: { imdbID, title?, poster?, year?, type? }
 * Agrega una película/serie a mi lista
 */
router.post("/", async (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized", details: "Missing or invalid token" });

  const imdbID = String(req.body?.imdbID || "").trim();
  if (!imdbID) return res.status(400).json({ error: "imdbID required", details: "imdbID cannot be empty" });

  // Datos opcionales para cachear info básica
  const title = String(req.body?.title || "").trim();
  const poster = String(req.body?.poster || "").trim();
  const year = String(req.body?.year || "").trim();
  const type = String(req.body?.type || "").trim();

  const db = await getDb();
  const col = db.collection("mylist");

  // Verificar si ya existe
  const existing = await col.findOne({ userId: user.userId, imdbID });
  if (existing) {
    return res.status(409).json({ error: "Item already in your list", details: "This movie is already saved" });
  }

  const doc = {
    userId: user.userId,
    userEmail: user.email ?? null,
    imdbID,
    title: title || null,
    poster: poster || null,
    year: year || null,
    type: type || null,
    addedAt: new Date(),
  };

  const result = await col.insertOne(doc);
  return res.json({ ok: true, item: { _id: result.insertedId, ...doc } });
});

/**
 * DELETE /mylist/:imdbID
 * Elimina una película/serie de mi lista
 */
router.delete("/:imdbID", async (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized", details: "Missing or invalid token" });

  const imdbID = String(req.params.imdbID || "").trim();
  if (!imdbID) return res.status(400).json({ error: "imdbID required", details: "imdbID cannot be empty" });

  const db = await getDb();
  const col = db.collection("mylist");

  const result = await col.deleteOne({ userId: user.userId, imdbID });

  if (result.deletedCount === 0) {
    return res.status(404).json({ error: "Item not found in your list", details: "This movie is not in your list" });
  }

  return res.json({ ok: true, message: "Item removed from list" });
});

/**
 * GET /mylist/me
 * Obtiene mi lista completa
 */
router.get("/me", async (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized", details: "Missing or invalid token" });

  const db = await getDb();
  const col = db.collection("mylist");

  const items = await col
    .find({ userId: user.userId })
    .sort({ addedAt: -1 })
    .limit(500)
    .toArray();

  return res.json({ userId: user.userId, count: items.length, items });
});

/**
 * GET /mylist/check/:imdbID
 * Verifica si una película está en mi lista
 */
router.get("/check/:imdbID", async (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized", details: "Missing or invalid token" });

  const imdbID = String(req.params.imdbID || "").trim();
  if (!imdbID) return res.status(400).json({ error: "imdbID required", details: "imdbID cannot be empty" });

  const db = await getDb();
  const col = db.collection("mylist");

  const exists = await col.findOne({ userId: user.userId, imdbID });

  return res.json({ inList: !!exists });
});

export default router;
