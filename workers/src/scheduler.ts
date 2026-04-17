import cron from "node-cron";
import prisma from "database/src/index";
import { Queue } from "bullmq";
import Redis from "ioredis";
import express from "express";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL is not set in environment");
}

const connection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

connection.on("connect", () => {
  console.log("✅ Scheduler Redis connected");
});

connection.on("error", (err) => {
  console.error("❌ Scheduler Redis error:", err.message);
});

const postQueue = new Queue("post-publishing", { connection });

export const startScheduler = () => {
  console.log("🕒 Scheduler started (runs every minute)");
  console.log("REDIS_URL exists:", !!redisUrl);

  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();

      console.log(`[Scheduler] Checking scheduled posts at ${now.toISOString()}`);

      const duePosts = await prisma.scheduledPost.findMany({
        where: {
          status: "PENDING",
          isDeleted: false,
          scheduledTime: {
            lte: now,
          },
        },
        include: {
          account: true,
          video: true,
        },
        orderBy: {
          scheduledTime: "asc",
        },
      });

      if (!duePosts.length) {
        console.log("[Scheduler] No scheduled posts due");
        return;
      }

      console.log(`[Scheduler] Found ${duePosts.length} scheduled post(s)`);

      for (const post of duePosts) {
        try {
          if (!post.account) {
            console.error(`❌ Missing account → ${post.id}`);

            await prisma.scheduledPost.update({
              where: { id: post.id },
              data: {
                status: "FAILED",
                failedReason: "Account not found",
              },
            });

            continue;
          }

          const current = await prisma.scheduledPost.findUnique({
            where: { id: post.id },
            select: {
              status: true,
              isDeleted: true,
            },
          });

          if (!current || current.status !== "PENDING" || current.isDeleted) {
            console.log(
              `[Scheduler] Skip ${post.id} → status = ${current?.status}`
            );
            continue;
          }

          await prisma.scheduledPost.update({
            where: { id: post.id },
            data: {
              status: "QUEUED",
              failedReason: null,
            },
          });

          await postQueue.add(
            "publish-post",
            { scheduledPostId: post.id },
            {
              jobId: `post-${post.id}`,
              removeOnComplete: true,
              removeOnFail: false,
              attempts: 3,
              backoff: {
                type: "exponential",
                delay: 5000,
              },
            }
          );

          console.log(
            `📤 Queued scheduled post ${post.id} → ${post.account.platform}`
          );
        } catch (postError: any) {
          console.error(`❌ Queue error for ${post.id}:`, postError.message);

          await prisma.scheduledPost.update({
            where: { id: post.id },
            data: {
              status: "FAILED",
              failedReason: postError.message || "Queue failed",
            },
          });
        }
      }
    } catch (error) {
      console.error("❌ Scheduler global error:", error);
    }
  });
};

const app = express();
const port = Number(process.env.PORT || 10000);

app.get("/", (_req, res) => {
  res.send("Worker is running");
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "worker" });
});

app.listen(port, () => {
  console.log(`[worker]: Health server running on port ${port}`);
});

startScheduler();