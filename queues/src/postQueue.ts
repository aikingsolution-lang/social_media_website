import { Queue } from "bullmq";
import { connection } from "./index";

export const postQueue = new Queue("post-publishing", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});