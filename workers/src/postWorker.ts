import { Worker, Job } from "bullmq";
import Redis from "ioredis";
import prisma from "database/src/index";

// Platform services
import { publishInstagramPost } from "../../apps/api/src/services/instagram.service";
import { publishThreadsPost } from "../../apps/api/src/services/threads.service";
import { publishLinkedInPost } from "../../apps/api/src/services/linkedin.service";
import { publishTwitterPost } from "../../apps/api/src/services/twitter.service";
import { publishFacebookPost } from "../../apps/api/src/services/facebook.service";
import {
  uploadYouTubeVideo,
  refreshYouTubeAccessToken,
} from "../../apps/api/src/services/youtube.service";

type PostJobData = {
  scheduledPostId: string;
};

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
  console.log("✅ Worker Redis connected");
});

connection.on("error", (err) => {
  console.error("❌ Worker Redis error:", err.message);
});

const getScheduledPostMediaUrl = (scheduledPost: any): string | null => {
  return scheduledPost?.mediaUrl || scheduledPost?.video?.filePath || null;
};

const getScheduledPostMediaUrls = (scheduledPost: any): string[] => {
  if (Array.isArray(scheduledPost?.mediaUrls) && scheduledPost.mediaUrls.length > 0) {
    return scheduledPost.mediaUrls.filter(Boolean);
  }

  if (scheduledPost?.mediaUrl) {
    return [scheduledPost.mediaUrl];
  }

  if (scheduledPost?.video?.filePath) {
    return [scheduledPost.video.filePath];
  }

  return [];
};

const extractErrorReason = (error: any): string => {
  if (error?.response?.data?.error?.message) {
    return error.response.data.error.message;
  }

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (typeof error?.response?.data === "string") {
    return error.response.data;
  }

  if (error?.response?.data) {
    try {
      return JSON.stringify(error.response.data);
    } catch {
      return "Unknown API error";
    }
  }

  return error?.message || "Unknown publishing error";
};

export const postWorker = new Worker(
  "post-publishing",
  async (job: Job<PostJobData>) => {
    const { scheduledPostId } = job.data;

    console.log(`🚀 Processing ScheduledPost: ${scheduledPostId}`);

    try {
      const scheduledPost = await prisma.scheduledPost.findUnique({
        where: { id: scheduledPostId },
        include: {
          account: true,
          video: true,
          campaign: true,
        },
      });

      if (!scheduledPost) {
        throw new Error(`ScheduledPost not found: ${scheduledPostId}`);
      }

      if (scheduledPost.isDeleted) {
        console.log(`⏭️ Skipping deleted post: ${scheduledPostId}`);
        return {
          success: true,
          skipped: true,
          reason: "Post deleted",
        };
      }

      if (scheduledPost.status === "PUBLISHED") {
        console.log(`⏭️ ScheduledPost already published: ${scheduledPostId}`);
        return {
          success: true,
          skipped: true,
          reason: "Already published",
        };
      }

      const account = scheduledPost.account;
      const caption = scheduledPost.caption || "";
      const mediaUrl = getScheduledPostMediaUrl(scheduledPost);
      const mediaUrls = getScheduledPostMediaUrls(scheduledPost);

      if (!account) {
        await prisma.scheduledPost.update({
          where: { id: scheduledPostId },
          data: {
            status: "FAILED",
            failedReason: "Account not found",
          },
        });

        throw new Error("Account not found");
      }

      const platform = String(account.platform || "").toLowerCase();

      await prisma.scheduledPost.update({
        where: { id: scheduledPostId },
        data: {
          status: "PUBLISHING",
          failedReason: null,
        },
      });

      await job.updateProgress(20);

      console.log(`📤 Publishing → ${platform}`);

      let result: any = null;

      switch (platform) {
        case "instagram": {
          if (!account.accessToken) {
            throw new Error("Missing Instagram access token");
          }

          if (!account.platformUserId) {
            throw new Error("Missing Instagram platformUserId");
          }

          if (mediaUrls.length === 0) {
            throw new Error("Instagram scheduled post media missing");
          }

          result = await publishInstagramPost({
            accessToken: account.accessToken,
            igUserId: account.platformUserId,
            caption,
            mediaUrls,
          });

          break;
        }

        case "threads": {
          if (!account.accessToken) {
            throw new Error("Missing Threads access token");
          }

          if (!account.platformUserId) {
            throw new Error("Missing Threads platformUserId");
          }

          if (!caption && mediaUrls.length === 0 && !mediaUrl) {
            throw new Error("Threads scheduled post caption or media missing");
          }

          result = await publishThreadsPost({
            userId: account.platformUserId,
            accessToken: account.accessToken,
            caption,
            mediaUrl,
            mediaUrls,
          });

          break;
        }

        case "linkedin": {
          if (!account.accessToken) {
            throw new Error("Missing LinkedIn access token");
          }

          if (!account.platformUserId) {
            throw new Error("Missing LinkedIn platformUserId");
          }

          const authorUrn = `urn:li:person:${account.platformUserId}`;

          result = await publishLinkedInPost({
            accessToken: account.accessToken,
            authorUrn,
            caption,
            mediaUrls,
          });

          break;
        }

        case "facebook": {
          if (!account.accessToken) {
            throw new Error("Missing Facebook access token");
          }

          if (!account.platformUserId) {
            throw new Error("Missing Facebook Page ID");
          }

          result = await publishFacebookPost({
            pageId: account.platformUserId,
            accessToken: account.accessToken,
            caption,
            mediaUrl,
          });

          break;
        }

        case "twitter": {
          if (!account.accessToken) {
            throw new Error("Missing Twitter/X access token");
          }

          result = await publishTwitterPost({
            accessToken: account.accessToken,
            caption,
            mediaUrl,
          });

          break;
        }

        case "youtube": {
          if (!account.accessToken && !account.refreshToken) {
            throw new Error("Missing YouTube access token and refresh token");
          }

          let accessToken = account.accessToken;

          const extraData = (scheduledPost as any).extraData || {};
          const title =
            extraData.youtubeTitle ||
            scheduledPost.caption?.slice(0, 100) ||
            "Scheduled YouTube Upload";

          const description =
            extraData.youtubeDescription || scheduledPost.caption || "";

          const privacyStatus = extraData.privacyStatus || "private";

          const mediaPath =
            scheduledPost.mediaUrl ||
            scheduledPost.video?.filePath ||
            null;

          if (!mediaPath) {
            throw new Error("Missing media path for YouTube");
          }

          const runYouTubeUpload = async (token: string) => {
            return uploadYouTubeVideo({
              accessToken: token,
              title,
              description,
              localFilePath: mediaPath,
              privacyStatus,
            });
          };

          try {
            if (!accessToken && account.refreshToken) {
              accessToken = await refreshYouTubeAccessToken(account.refreshToken);

              await prisma.socialAccount.update({
                where: { id: account.id },
                data: { accessToken },
              });
            }

            if (!accessToken) {
              throw new Error("Unable to get valid YouTube access token");
            }

            result = await runYouTubeUpload(accessToken);
          } catch (error: any) {
            const isAuthError =
              error?.response?.status === 401 ||
              error?.response?.data?.error?.code === 401 ||
              error?.message?.includes("401") ||
              error?.message?.toLowerCase?.().includes("invalid credentials");

            if (!isAuthError || !account.refreshToken) {
              throw error;
            }

            console.log("🔄 YouTube access token expired/invalid. Refreshing token...");

            accessToken = await refreshYouTubeAccessToken(account.refreshToken);

            await prisma.socialAccount.update({
              where: { id: account.id },
              data: { accessToken },
            });

            result = await runYouTubeUpload(accessToken);
          }

          break;
        }

        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }

      await job.updateProgress(80);

      await prisma.scheduledPost.update({
        where: { id: scheduledPostId },
        data: {
          status: "PUBLISHED",
          publishedAt: new Date(),
          platformPostId:
            result?.publish?.id
              ? String(result.publish.id)
              : result?.publish?.post_id
              ? String(result.publish.post_id)
              : result?.id
              ? String(result.id)
              : result?.post_id
              ? String(result.post_id)
              : null,
          failedReason: null,
        },
      });

      await job.updateProgress(100);

      console.log(`✅ Post published successfully: ${scheduledPostId}`);

      return {
        success: true,
        platform,
        result,
      };
    } catch (error: any) {
      console.error(`❌ Failed ScheduledPost ${scheduledPostId}:`, error.message);

      const reason = extractErrorReason(error);

      try {
        await prisma.scheduledPost.update({
          where: { id: scheduledPostId },
          data: {
            status: "FAILED",
            failedReason: reason,
          },
        });
      } catch (dbErr) {
        console.error("DB update failed:", dbErr);
      }

      throw error;
    }
  },
  {
    connection,
    concurrency: 5,
  }
);

// EVENTS
postWorker.on("active", (job) => {
  console.log(`🔄 Job started: ${job.id}`);
});

postWorker.on("progress", (job, progress) => {
  console.log(`📊 Job ${job.id} progress: ${progress}%`);
});

postWorker.on("completed", (job) => {
  console.log(`✅ Job completed: ${job.id}`);
});

postWorker.on("failed", (job, err) => {
  console.error(`❌ Job failed: ${job?.id}`, err.message);
});

postWorker.on("error", (err) => {
  console.error("Worker error:", err);
});