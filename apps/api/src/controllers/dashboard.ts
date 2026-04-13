import { Request, Response } from "express";
import prisma from "database/src/index";

export const getDashboardStats = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }

    const [
      totalVideos,
      totalAccounts,
      totalCampaigns,
      totalScheduledPosts,
      pendingPosts,
      queuedPosts,
      publishingPosts,
      publishedPosts,
      failedPosts,
      recentVideos,
      recentCampaigns,
      recentPosts,
    ] = await Promise.all([
      prisma.video.count({ where: { userId } }),
      prisma.socialAccount.count({ where: { userId } }),
      prisma.campaign.count({ where: { userId } }),
      prisma.scheduledPost.count({
        where: {
          user: { id: userId },
        },
      }),
      prisma.scheduledPost.count({
        where: {
          user: { id: userId },
          status: "PENDING",
        },
      }),
      prisma.scheduledPost.count({
        where: {
          user: { id: userId },
          status: "QUEUED",
        },
      }),
      prisma.scheduledPost.count({
        where: {
          user: { id: userId },
          status: "PUBLISHING",
        },
      }),
      prisma.scheduledPost.count({
        where: {
          user: { id: userId },
          status: "PUBLISHED",
        },
      }),
      prisma.scheduledPost.count({
        where: {
          user: { id: userId },
          status: "FAILED",
        },
      }),
      prisma.video.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.campaign.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.scheduledPost.findMany({
        where: {
          user: { id: userId },
        },
        include: {
          account: true,
          campaign: true,
          video: true,
        },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalVideos,
        totalAccounts,
        totalCampaigns,
        totalScheduledPosts,
        pendingPosts,
        queuedPosts,
        publishingPosts,
        publishedPosts,
        failedPosts,
      },
      recentVideos,
      recentCampaigns,
      recentPosts,
    });
  } catch (error: any) {
    console.error("getDashboardStats error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to load dashboard stats",
      details: error.message,
    });
  }
};