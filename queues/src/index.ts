import { Queue } from "bullmq";
import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL is not set in environment");
}

console.log("REDIS_URL exists:", !!redisUrl);
console.log("REDIS_URL value:", redisUrl);

const connection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

connection.on("connect", () => {
  console.log("✅ Redis connected");
});

connection.on("error", (err) => {
  console.error("❌ Redis connection error:", err.message);
});

const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: "exponential" as const,
    delay: 5000,
  },
  removeOnComplete: true,
  removeOnFail: false,
};

export const videoQueue = new Queue("video-processing", {
  connection,
  defaultJobOptions,
});

export const campaignQueue = new Queue("campaign-publishing", {
  connection,
  defaultJobOptions,
});

export { postQueue } from "./postQueue";
export { connection };