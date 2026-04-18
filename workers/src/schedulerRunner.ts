import dotenv from "dotenv";
import path from "path";

// Load .env first
dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

console.log("REDIS_URL exists:", !!process.env.REDIS_URL);

const { startScheduler } = require("./scheduler");

console.log("Starting Scheduler Service...");
startScheduler();