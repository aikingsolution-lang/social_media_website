import dotenv from "dotenv";
import path from "path";

// Load .env from project root first
dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

console.log("REDIS_URL exists:", !!process.env.REDIS_URL);

// Load only after env is ready
require("./postWorker");
const { startScheduler } = require("./scheduler");

console.log("Starting Social Automation Background Services (local only)...");
startScheduler();