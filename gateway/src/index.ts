import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createProxyMiddleware } from "http-proxy-middleware";
import axios from "axios";

dotenv.config();

const app = express();
app.use(cors());

const port = Number(process.env.PORT || 8080);

const usersTarget = process.env.API_USERS_URL || "http://api-users:5001";
const catalogTarget = process.env.API_CATALOG_URL || "http://api-catalog:5000";

app.get("/health", async (_req, res) => {
  const health: any = {
    status: "ok",
    timestamp: new Date().toISOString(),
    gateway: "ok",
  };

  // Check api-users
  try {
    await axios.get(`${usersTarget}/health`, { timeout: 3000 });
    health.apiUsers = "ok";
  } catch (e: any) {
    health.status = "degraded";
    health.apiUsers = "fail";
    health.apiUsersError = String(e?.message || e);
  }

  // Check api-catalog
  try {
    await axios.get(`${catalogTarget}/health`, { timeout: 3000 });
    health.apiCatalog = "ok";
  } catch (e: any) {
    health.status = "degraded";
    health.apiCatalog = "fail";
    health.apiCatalogError = String(e?.message || e);
  }

  const statusCode = health.status === "ok" ? 200 : 503;
  return res.status(statusCode).json(health);
});

// Users
app.use(
  "/api/users",
  createProxyMiddleware({
    target: usersTarget,
    changeOrigin: true,
    pathRewrite: { "^/api/users": "" },
  })
);

// Movies (catalog) - search endpoints
app.use(
  "/api/movies",
  createProxyMiddleware({
    target: catalogTarget,
    changeOrigin: true,
    pathRewrite: { "^/api/movies": "" },
  })
);

// Reviews (catalog)
app.use(
  "/api/reviews",
  createProxyMiddleware({
    target: `${catalogTarget}/reviews`,
    changeOrigin: true,
    pathRewrite: (path) => path.replace(/^\/api\/reviews/, ""),
  })
);

// My List (catalog)
app.use(
  "/api/mylist",
  createProxyMiddleware({
    target: `${catalogTarget}/mylist`,
    changeOrigin: true,
    pathRewrite: (path) => path.replace(/^\/api\/mylist/, ""),
  })
);

app.listen(port, () => {
  console.log(`gateway on ${port} -> users=${usersTarget} catalog=${catalogTarget}`);
});
