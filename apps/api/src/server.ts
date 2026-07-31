import "dotenv/config";
import cors from "cors";
import express from "express";

const app = express();
const port = Number(process.env.API_PORT ?? 4000);

app.use(cors());
app.use(express.json());

app.get("/health", (_request, response) => {
  response.json({ service: "api", status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/v1", (_request, response) => {
  response.json({ name: "AI Growth API", version: "v1", status: "ready" });
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
