import { Worker } from "bullmq";
import Redis from "ioredis";
import prisma from "database/src/index";

// Import your publish logic
import { publishThreadsPost } from "../../apps/api/src/services/threads.service";
import { publishInstagramPost } from "../../apps/api/src/services/publish/instagram.publish";
import { publishFacebookPost } from "../../apps/api/src/services/publish/facebook.publish";
import { publishTwitterPost } from "../../apps/api/src/services/publish/twitter.publish";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL is missing");
}

const connection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

console.log("🚀 Worker started...");

const worker = new Worker(
  "post-publishing",
  async (job) => {
    const { scheduledPostId } = job.data;

    console.log("🔥 Processing job:", scheduledPostId);

    const post = await prisma.scheduledPost.findUnique({
      where: { id: scheduledPostId },
      include: {
        account: true,
        video: true,
      },
    });

    if (!post || !post.account) {
      throw new Error("Post or account not found");
    }

    try {
      // mark publishing
      await prisma.scheduledPost.update({
        where: { id: post.id },
        data: { status: "PUBLISHING" },
      });

      const account = post.account;

      if (!account.accessToken) {
        throw new Error("Missing access token");
      }

      let result: any = null;

      switch (account.platform) {
        case "threads":
          result = await publishThreadsPost({
            userId: account.platformUserId!,
            accessToken: account.accessToken,
            caption: post.caption || "",
            mediaUrl: post.mediaUrl,
            mediaUrls: post.mediaUrls || [],
          });
          break;

        case "instagram":
          result = await publishInstagramPost({
            igUserId: account.platformUserId!,
            accessToken: account.accessToken,
            caption: post.caption || "",
            mediaUrls: post.mediaUrls || [],
          });
          break;

        case "facebook":
          result = await publishFacebookPost({
            pageId: account.platformUserId!,
            accessToken: account.accessToken,
            caption: post.caption || "",
            mediaUrls: post.mediaUrls || [],
          });
          break;

        case "twitter":
          result = await publishTwitterPost({
            accessToken: account.accessToken,
            caption: post.caption || "",
          });
          break;

        default:
          throw new Error(`Unsupported platform: ${account.platform}`);
      }

      await prisma.scheduledPost.update({
        where: { id: post.id },
        data: {
          status: "PUBLISHED",
          publishedAt: new Date(),
        },
      });

      console.log("✅ Published:", post.id);

      return result;
    } catch (error: any) {
      console.error("❌ Publish failed:", error.message);

      await prisma.scheduledPost.update({
        where: { id: post.id },
        data: {
          status: "FAILED",
          failedReason: error.message,
        },
      });

      throw error;
    }
  },
  { connection }
);

worker.on("completed", (job) => {
  console.log("🎉 Job completed:", job.id);
});

worker.on("failed", (job, err) => {
  console.error("❌ Job failed:", job?.id, err.message);
});