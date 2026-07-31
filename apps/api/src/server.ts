import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { prisma } from "./lib/prisma";
import { authRouter } from "./auth-routes";
import { organizationRouter } from "./organization-routes";
import { websiteRouter } from "./website-routes";
import { collectorRouter } from "./collector-routes";

dotenv.config();
dotenv.config({ path: "../../.env" });

const app = express();
const port = Number(process.env.API_PORT ?? 4000);

app.use(cors());
app.use(express.json({ limit: "32kb" }));
app.use("/api/v1/collect", collectorRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/organizations", organizationRouter);
app.use("/api/v1/organizations/:organizationId/websites", websiteRouter);

app.get("/health", (_request, response) => {
  response.json({ service: "api", status: "ok", timestamp: new Date().toISOString() });
});

app.get("/health/db", async (_request, response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    response.json({ service: "database", status: "ok", timestamp: new Date().toISOString() });
  } catch (error) {
    console.error("Database health check failed", error);
    response.status(503).json({ service: "database", status: "error", message: "Database unavailable" });
  }
});

app.get("/api/v1", (_request, response) => {
  response.json({ name: "AI Growth API", version: "v1", status: "ready" });
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
