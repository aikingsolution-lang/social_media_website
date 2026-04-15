import { Queue } from "bullmq";
import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL;
const redisHost = process.env.REDIS_HOST || "localhost";
const redisPort = parseInt(process.env.REDIS_PORT || "6379", 10);
const redisPassword = process.env.REDIS_PASSWORD || undefined;

const connection = redisUrl
  ? new Redis(redisUrl, {
      maxRetriesPerRequest: null,
    })
  : new Redis({
      host: redisHost,
      port: redisPort,
      password: redisPassword,
      maxRetriesPerRequest: null,
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