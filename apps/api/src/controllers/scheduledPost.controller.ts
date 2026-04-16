import { Request, Response } from "express";
import prisma from "database/src/index";
import { logPostAction } from "../utils/postLogger";
import { Queue } from "bullmq";
import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL is not set in environment");
}

console.log("REDIS_URL exists:", !!redisUrl);
console.log("REDIS_URL value:", redisUrl);

const queueConnection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

queueConnection.on("connect", () => {
  console.log("✅ Controller Redis connected");
});

queueConnection.on("error", (err) => {
  console.error("❌ Controller Redis error:", err.message);
});

const postQueue = new Queue("post-publishing", {
  connection: queueConnection,
});

const getUserIdFromReq = (req: Request) => {
  return (req as any)?.user?.userId || (req as any)?.user?.id || null;
};

const normalizeString = (value: unknown) => {
  return typeof value === "string" ? value.trim() : "";
};

const isValidFutureDate = (value: unknown) => {
  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return {
      valid: false,
      date: null as Date | null,
      error: "Invalid scheduledTime",
    };
  }

  if (date.getTime() <= Date.now()) {
    return {
      valid: false,
      date: null as Date | null,
      error: "scheduledTime must be in the future",
    };
  }

  return { valid: true, date, error: "" };
};

export const createScheduledPost = async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromReq(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const {
      campaignId,
      accountId,
      caption,
      scheduledTime,
      videoId,
      mediaUrl,
      mediaUrls,
    } = req.body;

    const cleanCaption = normalizeString(caption);

    const normalizedMediaUrl =
      normalizeString(mediaUrl) ||
      (Array.isArray(mediaUrls) && mediaUrls.length > 0
        ? normalizeString(mediaUrls[0])
        : "");

    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: "accountId is required",
      });
    }

    if (!cleanCaption && !videoId && !normalizedMediaUrl) {
      return res.status(400).json({
        success: false,
        message: "caption or media is required",
      });
    }

    let finalScheduledDate: Date | null = null;
    let finalStatus: "PENDING" | "PUBLISHING" = "PUBLISHING";

    if (scheduledTime) {
      const checked = isValidFutureDate(scheduledTime);

      if (!checked.valid) {
        return res.status(400).json({
          success: false,
          message: checked.error,
        });
      }

      finalScheduledDate = checked.date!;
      finalStatus = "PENDING";
    }

    const account = await prisma.socialAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Social account not found",
      });
    }

    if (account.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized account access",
      });
    }

    if (campaignId) {
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
      });

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: "Campaign not found",
        });
      }

      if (campaign.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized campaign access",
        });
      }
    }

    const scheduledPost = await prisma.scheduledPost.create({
      data: {
        caption: cleanCaption,
        scheduledTime: finalScheduledDate,
        mediaUrl: normalizedMediaUrl || null,
        mediaUrls: Array.isArray(mediaUrls)
          ? mediaUrls.filter((item) => typeof item === "string" && item.trim())
          : normalizedMediaUrl
          ? [normalizedMediaUrl]
          : [],
        status: finalStatus,
        isDeleted: false,
        deletedAt: null,
        user: {
          connect: { id: userId },
        },
        account: {
          connect: { id: accountId },
        },
        ...(campaignId
          ? {
              campaign: {
                connect: { id: campaignId },
              },
            }
          : {}),
        ...(videoId
          ? {
              video: {
                connect: { id: videoId },
              },
            }
          : {}),
      },
      include: {
        account: true,
        campaign: true,
        video: true,
      },
    });

    if (!scheduledTime) {
      try {
        await postQueue.add(
          "publish-post",
          {
            scheduledPostId: scheduledPost.id,
          },
          {
            jobId: `post-${scheduledPost.id}`,
            removeOnComplete: true,
            removeOnFail: false,
            attempts: 3,
            backoff: {
              type: "exponential",
              delay: 5000,
            },
          }
        );
      } catch (queueError: any) {
        await prisma.scheduledPost.update({
          where: { id: scheduledPost.id },
          data: {
            status: "FAILED",
            failedReason:
              queueError?.message || "Failed to queue immediate post",
          },
        });

        return res.status(500).json({
          success: false,
          message: "Failed to queue immediate post",
          details: queueError?.message || "Unknown queue error",
        });
      }
    }

    await logPostAction(
      scheduledPost.id,
      "CREATED",
      scheduledTime
        ? "Scheduled post created successfully"
        : "Immediate post created and queued successfully"
    );

    return res.status(201).json({
      success: true,
      message: scheduledTime
        ? "Scheduled post created successfully"
        : "Post queued for immediate publishing",
      data: scheduledPost,
      scheduledPost,
    });
  } catch (error: any) {
    console.error("Create scheduled post error:", error?.message || error);

    return res.status(500).json({
      success: false,
      message: "Failed to create scheduled post",
      details: error?.message || "Unknown error",
    });
  }
};

export const getScheduledPosts = async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromReq(req);
    const platform = normalizeString(req.query.platform).toLowerCase();
    const includeDeleted =
      String(req.query.includeDeleted || "").toLowerCase() === "true";

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const posts = await prisma.scheduledPost.findMany({
      where: {
        user: {
          id: userId,
        },
        ...(includeDeleted ? {} : { isDeleted: false }),
        ...(platform
          ? {
              account: {
                platform,
              },
            }
          : {}),
      },
      include: {
        account: true,
        campaign: true,
        video: true,
      },
      orderBy: [{ scheduledTime: "asc" }, { createdAt: "desc" }],
    });

    return res.status(200).json({
      success: true,
      data: posts,
      posts,
      scheduledPosts: posts,
    });
  } catch (error: any) {
    console.error("Get scheduled posts error:", error?.message || error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch scheduled posts",
    });
  }
};

export const updateScheduledPost = async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromReq(req);
    const { postId } = req.params;
    const { caption, scheduledTime, mediaUrl, mediaUrls } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const existingPost = await prisma.scheduledPost.findUnique({
      where: { id: postId },
      include: {
        user: true,
        account: true,
      },
    });

    if (!existingPost || existingPost.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Scheduled post not found",
      });
    }

    if (existingPost.user?.id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized scheduled post access",
      });
    }

    const normalizedMediaUrl =
      normalizeString(mediaUrl) ||
      (Array.isArray(mediaUrls) && mediaUrls.length > 0
        ? normalizeString(mediaUrls[0])
        : existingPost.mediaUrl || "");

    let finalScheduledDate = existingPost.scheduledTime;
    let nextStatus = existingPost.status;

    if (scheduledTime) {
      const checked = isValidFutureDate(scheduledTime);

      if (!checked.valid) {
        return res.status(400).json({
          success: false,
          message: checked.error,
        });
      }

      finalScheduledDate = checked.date!;
      if (existingPost.status === "FAILED") {
        nextStatus = "PENDING";
      }
    }

    const updatedPost = await prisma.scheduledPost.update({
      where: { id: postId },
      data: {
        caption:
          typeof caption === "string"
            ? normalizeString(caption)
            : existingPost.caption,
        scheduledTime: finalScheduledDate,
        mediaUrl: normalizedMediaUrl || null,
        mediaUrls: Array.isArray(mediaUrls)
          ? mediaUrls.filter((item) => typeof item === "string" && item.trim())
          : normalizedMediaUrl
          ? [normalizedMediaUrl]
          : [],
        status: nextStatus,
        failedReason: null,
      },
      include: {
        account: true,
        campaign: true,
        video: true,
      },
    });

    await logPostAction(
      updatedPost.id,
      "UPDATED",
      "Scheduled post updated successfully"
    );

    return res.status(200).json({
      success: true,
      message: "Scheduled post updated successfully",
      post: updatedPost,
    });
  } catch (error: any) {
    console.error("Update scheduled post error:", error?.message || error);

    return res.status(500).json({
      success: false,
      message: "Failed to update scheduled post",
    });
  }
};

export const deleteScheduledPost = async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromReq(req);
    const { postId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const post = await prisma.scheduledPost.findUnique({
      where: { id: postId },
      include: {
        account: true,
        user: true,
      },
    });

    if (!post || post.user?.id !== userId || post.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Scheduled post not found",
      });
    }

    await prisma.scheduledPost.update({
      where: { id: postId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        status: "DELETED",
      },
    });

    await logPostAction(postId, "DELETED", "User deleted post");

    return res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (err: any) {
    console.error("Delete scheduled post error:", err?.message || err);

    return res.status(500).json({
      success: false,
      message: "Failed to delete post",
    });
  }
};

export const createBulkScheduledPosts = async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromReq(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const { posts } = req.body;

    if (!Array.isArray(posts) || posts.length === 0) {
      return res.status(400).json({
        success: false,
        message: "posts array is required",
      });
    }

    const createdPosts = [];

    for (const post of posts) {
      const {
        campaignId,
        accountId,
        caption,
        scheduledTime,
        videoId,
        mediaUrl,
        mediaUrls,
      } = post;

      const cleanCaption = normalizeString(caption);

      const normalizedMediaUrl =
        normalizeString(mediaUrl) ||
        (Array.isArray(mediaUrls) && mediaUrls.length > 0
          ? normalizeString(mediaUrls[0])
          : "");

      if (!accountId) {
        continue;
      }

      let finalScheduledDate: Date | null = null;
      let finalStatus: "PENDING" | "PUBLISHING" = "PUBLISHING";

      if (scheduledTime) {
        const checked = isValidFutureDate(scheduledTime);

        if (!checked.valid) {
          continue;
        }

        finalScheduledDate = checked.date!;
        finalStatus = "PENDING";
      }

      const created = await prisma.scheduledPost.create({
        data: {
          caption: cleanCaption,
          scheduledTime: finalScheduledDate,
          mediaUrl: normalizedMediaUrl || null,
          mediaUrls: Array.isArray(mediaUrls)
            ? mediaUrls.filter((item) => typeof item === "string" && item.trim())
            : normalizedMediaUrl
            ? [normalizedMediaUrl]
            : [],
          status: finalStatus,
          isDeleted: false,
          deletedAt: null,
          user: { connect: { id: userId } },
          account: { connect: { id: accountId } },
          ...(campaignId ? { campaign: { connect: { id: campaignId } } } : {}),
          ...(videoId ? { video: { connect: { id: videoId } } } : {}),
        },
        include: {
          account: true,
          campaign: true,
          video: true,
        },
      });

      if (!scheduledTime) {
        try {
          await postQueue.add(
            "publish-post",
            {
              scheduledPostId: created.id,
            },
            {
              jobId: `post-${created.id}`,
              removeOnComplete: true,
              removeOnFail: false,
              attempts: 3,
              backoff: {
                type: "exponential",
                delay: 5000,
              },
            }
          );
        } catch (queueError: any) {
          await prisma.scheduledPost.update({
            where: { id: created.id },
            data: {
              status: "FAILED",
              failedReason:
                queueError?.message || "Failed to queue immediate post",
            },
          });
          continue;
        }
      }

      createdPosts.push(created);
      await logPostAction(created.id, "CREATED", "Bulk post created successfully");
    }

    return res.status(201).json({
      success: true,
      message: "Bulk scheduled posts created successfully",
      posts: createdPosts,
    });
  } catch (error: any) {
    console.error("Bulk create scheduled posts error:", error?.message || error);

    return res.status(500).json({
      success: false,
      message: "Failed to create bulk scheduled posts",
      details: error?.message || "Unknown error",
    });
  }
};

export const rescheduleScheduledPost = async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromReq(req);
    const { postId } = req.params;
    const { scheduledTime } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    if (!scheduledTime) {
      return res.status(400).json({
        success: false,
        message: "scheduledTime is required",
      });
    }

    const dateCheck = isValidFutureDate(scheduledTime);

    if (!dateCheck.valid) {
      return res.status(400).json({
        success: false,
        message: dateCheck.error,
      });
    }

    const existingPost = await prisma.scheduledPost.findUnique({
      where: { id: postId },
      include: {
        account: true,
        user: true,
      },
    });

    if (!existingPost || existingPost.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Scheduled post not found",
      });
    }

    if (existingPost.user?.id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized scheduled post access",
      });
    }

    if (existingPost.status === "PUBLISHED") {
      return res.status(400).json({
        success: false,
        message: "Published post cannot be rescheduled",
      });
    }

    if (existingPost.status === "PUBLISHING") {
      return res.status(400).json({
        success: false,
        message: "Post is currently publishing and cannot be rescheduled",
      });
    }

    const updatedPost = await prisma.scheduledPost.update({
      where: { id: postId },
      data: {
        scheduledTime: dateCheck.date!,
        status: "PENDING",
        failedReason: null,
      },
      include: {
        account: true,
        campaign: true,
        video: true,
      },
    });

    await logPostAction(
      updatedPost.id,
      "RESCHEDULED",
      "Scheduled post rescheduled successfully"
    );

    return res.status(200).json({
      success: true,
      message: "Scheduled post rescheduled successfully",
      post: updatedPost,
    });
  } catch (error: any) {
    console.error("Reschedule scheduled post error:", error?.message || error);

    return res.status(500).json({
      success: false,
      message: "Failed to reschedule post",
    });
  }
};

export const restoreScheduledPost = async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromReq(req);
    const { postId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const existingPost = await prisma.scheduledPost.findUnique({
      where: { id: postId },
      include: {
        user: true,
      },
    });

    if (!existingPost) {
      return res.status(404).json({
        success: false,
        message: "Scheduled post not found",
      });
    }

    if (existingPost.user?.id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized scheduled post access",
      });
    }

    const restoredPost = await prisma.scheduledPost.update({
      where: { id: postId },
      data: {
        isDeleted: false,
        deletedAt: null,
        status: existingPost.scheduledTime ? "PENDING" : "PUBLISHING",
      },
      include: {
        account: true,
        campaign: true,
        video: true,
      },
    });

    if (!existingPost.scheduledTime) {
      try {
        await postQueue.add(
          "publish-post",
          {
            scheduledPostId: restoredPost.id,
          },
          {
            jobId: `post-${restoredPost.id}`,
            removeOnComplete: true,
            removeOnFail: false,
            attempts: 3,
            backoff: {
              type: "exponential",
              delay: 5000,
            },
          }
        );
      } catch (queueError: any) {
        await prisma.scheduledPost.update({
          where: { id: restoredPost.id },
          data: {
            status: "FAILED",
            failedReason: queueError?.message || "Failed to queue restored post",
          },
        });

        return res.status(500).json({
          success: false,
          message: "Failed to queue restored immediate post",
        });
      }
    }

    await logPostAction(postId, "RESTORED", "Post restored");

    return res.status(200).json({
      success: true,
      message: "Post restored",
      post: restoredPost,
    });
  } catch (err: any) {
    console.error("Restore scheduled post error:", err?.message || err);

    return res.status(500).json({
      success: false,
      message: "Failed to restore post",
    });
  }
};

export const bulkDeletePosts = async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromReq(req);
    const { postIds } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    if (!Array.isArray(postIds) || postIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "postIds array is required",
      });
    }

    const posts = await prisma.scheduledPost.findMany({
      where: {
        id: { in: postIds },
        user: { id: userId },
        isDeleted: false,
      },
      select: {
        id: true,
      },
    });

    const validPostIds = posts.map((post) => post.id);

    await prisma.scheduledPost.updateMany({
      where: {
        id: { in: validPostIds },
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        status: "DELETED",
      },
    });

    await Promise.all(
      validPostIds.map((id) =>
        logPostAction(id, "DELETED", "User bulk deleted post")
      )
    );

    return res.status(200).json({
      success: true,
      message: "Posts deleted successfully",
      deletedCount: validPostIds.length,
    });
  } catch (err: any) {
    console.error("Bulk delete posts error:", err?.message || err);

    return res.status(500).json({
      success: false,
      message: "Failed to bulk delete posts",
    });
  }
};