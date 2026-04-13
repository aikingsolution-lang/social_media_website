import { Request, Response } from "express";
import prisma from "database/src/index";

export const getDashboardStats = async (req: any, res: Response) => {
    try {
        const userId = req.user?.userId || req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: "Not authenticated" });
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
            prisma.video.count({
                where: { userId },
            }),

            prisma.socialAccount.count({
                where: { userId },
            }),

            prisma.campaign.count({
                where: { userId },
            }),

            prisma.scheduledPost.count({
                where: {
                    account: { userId },
                },
            }),

            prisma.scheduledPost.count({
                where: {
                    account: { userId },
                    status: "PENDING",
                },
            }),

            prisma.scheduledPost.count({
                where: {
                    account: { userId },
                    status: "QUEUED",
                },
            }),

            prisma.scheduledPost.count({
                where: {
                    account: { userId },
                    status: "PUBLISHING",
                },
            }),

            prisma.scheduledPost.count({
                where: {
                    account: { userId },
                    status: "PUBLISHED",
                },
            }),

            prisma.scheduledPost.count({
                where: {
                    account: { userId },
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
                    account: { userId },
                },
                orderBy: { scheduledTime: "desc" },
                take: 10,
                include: {
                    campaign: {
                        select: { name: true },
                    },
                    account: {
                        select: {
                            platform: true,
                            accountName: true,
                        },
                    },
                    video: {
                        select: {
                            title: true,
                        },
                    },
                },
            }),
        ]);

        const enhancedPosts = recentPosts.map((post) => ({
            id: post.id,
            caption: post.caption,
            status: post.status,
            scheduledTime: post.scheduledTime,
            publishedAt: post.publishedAt,
            platformPostId: post.platformPostId,
            failedReason: post.failedReason,
            campaignName: post.campaign?.name || "No Campaign",
            platform: post.account?.platform || "Unknown",
            accountName: post.account?.accountName || "Unknown",
            videoTitle: post.video?.title || "No Video",
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            mediaUrl: post.mediaUrl || null,
        }));

        return res.json({
            success: true,
            data: {
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
                recentActivity: {
                    videos: recentVideos,
                    campaigns: recentCampaigns,
                    posts: enhancedPosts,
                },
            },
        });
    } catch (error) {
        console.error("Get dashboard stats error:", error);
        return res.status(500).json({
            error: "Failed to load dashboard data",
        });
    }
};