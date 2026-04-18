import dotenv from "dotenv";
import path from "path";

// Load .env from project root
dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

import { startScheduler } from "./scheduler";

console.log("Starting Scheduler Service...");
startScheduler();