import dotenv from "dotenv";
import path from "path";
import express from "express";

// Load .env from project root
dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

// Start BullMQ worker
import "./postWorker";

const app = express();
const port = Number(process.env.PORT || 10000);

app.get("/", (_req, res) => {
  res.send("Post publisher worker is running");
});

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "post-worker",
    time: new Date().toISOString(),
  });
});

app.listen(port, () => {
  console.log(`[worker]: Health server running on port ${port}`);
});

console.log("Starting Post Publisher Worker...");