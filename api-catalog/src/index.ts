import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";

import apiRouter from "./routes/index.js";
import { getDb } from "./lib/mongo.js";
import { ensureMoviesIndex } from "./services/elastic-index.service.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const port = Number(process.env.PORT || 5000);
const mongoUri = process.env.MONGO_URI || "mongodb://mongo:27017/filmly";
let client: MongoClient;

app.get("/health", async (_req, res) => {
  const health: any = { status: "ok", timestamp: new Date().toISOString() };

  // Check MongoDB
  try {
    if (!client) {
      client = new MongoClient(mongoUri);
      await client.connect();
    }
    await client.db().command({ ping: 1 });
    health.mongo = "ok";
  } catch (e: any) {
    health.status = "degraded";
    health.mongo = "fail";
    health.mongoError = String(e?.message || e);
  }

  // Check Elasticsearch
  try {
    const { elastic } = await import("./lib/elastic.js");
    await elastic.ping();
    health.elasticsearch = "ok";
  } catch (e: any) {
    health.status = "degraded";
    health.elasticsearch = "fail";
    health.esError = String(e?.message || e);
  }

  const statusCode = health.status === "ok" ? 200 : 503;
  return res.status(statusCode).json(health);
});

// monta API (esto hace que existan /search, /search-es, /reviews/*)
app.use("/", apiRouter);

async function bootstrap() {
  try {
    await ensureMoviesIndex();
    console.log("Elastic index ready");
  } catch (err: any) {
    console.warn("Elastic not ready at startup, continuing:", String(err?.message || err));
  }

  // fuerza conexión mongo lazy (si quieres)
  await getDb().catch(() => {});

  app.listen(port, () => console.log(`api-catalog listening on ${port}`));
}

bootstrap();
