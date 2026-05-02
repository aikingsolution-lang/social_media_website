import { Request, Response } from "express";
import prisma from "database/src/index";
import { postQueue } from "../../../../queues/src/postQueue";

type AuthRequest = Request & {
  user?: {
    id?: string;
    userId?: string;
  };
};

const getUserId = (req: AuthRequest) => req.user?.id || req.user?.userId;

export const createMultiAccountPost = async (req: AuthRequest, res: Response) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const {
      accountIds,
      caption,
      mediaUrl,
      mediaUrls = [],
      scheduledTime,
    } = req.body;

    if (!Array.isArray(accountIds) || accountIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one account",
      });
    }

    if (!caption && !mediaUrl && mediaUrls.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Caption or media is required",
      });
    }

    const accounts = await prisma.socialAccount.findMany({
      where: {
        id: { in: accountIds },
        userId,
        status: "active",
      },
    });

    if (accounts.length !== accountIds.length) {
      return res.status(400).json({
        success: false,
        message: "Some selected accounts are invalid or inactive",
      });
    }

    const finalMediaUrls = mediaUrls.length
      ? mediaUrls
      : mediaUrl
      ? [mediaUrl]
      : [];

    const createdPosts = [];

    for (const account of accounts) {
      const post = await prisma.scheduledPost.create({
        data: {
          userId,
          accountId: account.id,
          caption,
          mediaUrl: finalMediaUrls[0] || null,
          mediaUrls: finalMediaUrls,
          scheduledTime: scheduledTime ? new Date(scheduledTime) : null,
          status: scheduledTime ? "PENDING" : "QUEUED",
        },
      });

      createdPosts.push(post);

      if (!scheduledTime) {
        await postQueue.add(
          "publish-post",
          {
            scheduledPostId: post.id,
          },
          {
            jobId: `publish-${post.id}`,
            delay: createdPosts.length * 7000,
            attempts: 3,
            backoff: {
              type: "exponential",
              delay: 5000,
            },
          }
        );
      }
    }

    return res.status(201).json({
      success: true,
      message: scheduledTime
        ? `Post scheduled for ${createdPosts.length} accounts`
        : `Post queued for ${createdPosts.length} accounts`,
      count: createdPosts.length,
      posts: createdPosts,
    });
  } catch (error: any) {
    console.error("createMultiAccountPost error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create multi-account post",
      error: error.message,
    });
  }
};