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

export const postQueue = new Queue("post-publishing", {
  connection,
});

let schedulerStarted = false;
let healthServerStarted = false;

function startHealthServer() {
  if (healthServerStarted) return;

  const app = express();
  const port = Number(process.env.PORT || 10000);
  //const port = Number(process.env.WORKER_PORT || 10001);
  app.get("/", (_req, res) => {
    res.send("Scheduler service is running");
  });

  app.get("/health", (_req, res) => {
    res.json({
      ok: true,
      service: "scheduler",
      time: new Date().toISOString(),
    });
  });

  app.listen(port, "0.0.0.0", () => {
    console.log(`[scheduler]: Health server running on port ${port}`);
  });

  healthServerStarted = true;
}

export const startScheduler = () => {
  if (schedulerStarted) {
    console.log("⚠️ Scheduler already started. Skipping duplicate start.");
    return;
  }

  schedulerStarted = true;

  console.log("🕒 Scheduler started (runs every minute)");
  console.log("REDIS_URL exists:", !!redisUrl);

  startHealthServer();

  cron.schedule("* * * * *", async () => {
    const now = new Date();

    try {
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
          campaign: true,
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

          if (!current) {
            console.log(`[Scheduler] Skip ${post.id} → post no longer exists`);
            continue;
          }

          if (current.isDeleted) {
            console.log(`[Scheduler] Skip ${post.id} → post is deleted`);
            continue;
          }

          if (current.status !== "PENDING") {
            console.log(
              `[Scheduler] Skip ${post.id} → current status is ${current.status}`
            );
            continue;
          }

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

          await prisma.scheduledPost.update({
            where: { id: post.id },
            data: {
              status: "QUEUED",
              failedReason: null,
            },
          });

          console.log(
            `📤 Queued scheduled post ${post.id} → ${post.account.platform}`
          );
        } catch (postError: any) {
          console.error(`❌ Queue error for ${post.id}:`, postError.message);

          try {
            await prisma.scheduledPost.update({
              where: { id: post.id },
              data: {
                status: "FAILED",
                failedReason: postError.message || "Queue failed",
              },
            });
          } catch (dbError: any) {
            console.error(
              `❌ Failed to update DB for ${post.id}:`,
              dbError.message
            );
          }
        }
      }
    } catch (error: any) {
      console.error("❌ Scheduler global error:", error.message || error);
    }
  });
};