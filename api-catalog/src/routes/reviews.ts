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

    // api-users suele emitir sub como userId
    const userId = String(payload.sub || payload.userId || "");
    const email = payload.email ? String(payload.email) : undefined;

    if (!userId) return null;
    return { userId, email };
  } catch {
    return null;
  }
}

/**
 * POST /reviews
 * body: { imdbID, rating, text }
 * Crea o actualiza (upsert) la review del usuario para esa película.
 */
router.post("/", async (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized", details: "Missing or invalid token" });

  const imdbID = String(req.body?.imdbID || "").trim();
  const text = String(req.body?.text || "").trim();
  const rating = Number(req.body?.rating);

  // Validaciones
  if (!imdbID) return res.status(400).json({ error: "imdbID required", details: "imdbID cannot be empty" });
  
  if (!Number.isFinite(rating) || rating < 1 || rating > 10) {
    return res.status(400).json({ error: "Invalid rating", details: "rating must be between 1 and 10" });
  }

  if (text.length > 1000) {
    return res.status(400).json({ error: "Text too long", details: "text must be 1000 characters or less" });
  }

  const db = await getDb();
  const col = db.collection("reviews");

  const now = new Date();

  await col.updateOne(
    { imdbID, userId: user.userId },
    {
      $set: {
        imdbID,
        userId: user.userId,
        userEmail: user.email ?? null,
        rating,
        text,
        updatedAt: now,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true }
  );

  const saved = await col.findOne({ imdbID, userId: user.userId });
  return res.json({ ok: true, review: saved });
});

/**
 * GET /reviews?imdbID=tt...
 * Lista reviews de una película
 */
router.get("/", async (req, res) => {
  const imdbID = String(req.query.imdbID || "").trim();
  if (!imdbID) return res.status(400).json({ error: "imdbID query param required", details: "Provide imdbID to query reviews" });

  const db = await getDb();
  const col = db.collection("reviews");

  const reviews = await col
    .find({ imdbID })
    .sort({ updatedAt: -1, createdAt: -1 })
    .limit(200)
    .toArray();

  return res.json({ imdbID, count: reviews.length, reviews });
});

/**
 * GET /reviews/me
 * Lista reviews del usuario autenticado
 */
router.get("/me", async (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized", details: "Missing or invalid token" });

  const db = await getDb();
  const col = db.collection("reviews");

  const reviews = await col
    .find({ userId: user.userId })
    .sort({ updatedAt: -1, createdAt: -1 })
    .limit(200)
    .toArray();

  return res.json({ userId: user.userId, count: reviews.length, reviews });
});

/**
 * GET /reviews/me/movies
 * Devuelve películas (imdbID + datos cache si existen) sobre las que el usuario tiene reviews.
 */
router.get("/me/movies", async (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized", details: "Missing or invalid token" });

  const db = await getDb();
  const reviewsCol = db.collection("reviews");
  const cacheCol = db.collection("movies_cache");

  const myReviews = await reviewsCol
    .find({ userId: user.userId })
    .project({ imdbID: 1, rating: 1, updatedAt: 1 })
    .sort({ updatedAt: -1 })
    .toArray();

  const imdbIDs = [...new Set(myReviews.map((r: any) => r.imdbID))];

  // Buscar datos en cache por imdbID (si están cacheadas)
  const cachedMovies = await cacheCol
    .find({ imdbID: { $in: imdbIDs } })
    .project({ Title: 1, Year: 1, Poster: 1, imdbID: 1, Type: 1 })
    .toArray();

  const byId = new Map(cachedMovies.map((m: any) => [m.imdbID, m]));

  const movies = imdbIDs.map((id) => ({
    imdbID: id,
    movie: byId.get(id) ?? null,
    myRating: myReviews.find((r: any) => r.imdbID === id)?.rating ?? null,
  }));

  return res.json({ userId: user.userId, count: movies.length, movies });
});

export default router;
