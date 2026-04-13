import { Request, Response } from "express";
import prisma from "database/src/index";

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const userId =
            (req as any)?.user?.userId || (req as any)?.user?.id;

        if (!userId) {
            return res.status(401).json({
                error: "Unauthorized",
            });
        }

        // Parallel queries (fast)
        const [
            totalAccounts,
            totalCampaigns,
            totalVideos,
            totalScheduledPosts,
            publishedPosts,
            failedPosts,
            pendingPosts,
            recentPosts,
        ] = await Promise.all([
            prisma.socialAccount.count({
                where: { userId },
            }),

            prisma.campaign.count({
                where: { userId },
            }),

            prisma.video.count({
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
                    status: "PUBLISHED",
                },
            }),

            prisma.scheduledPost.count({
                where: {
                    account: { userId },
                    status: "FAILED",
                },
            }),

            prisma.scheduledPost.count({
                where: {
                    account: { userId },
                    status: "PENDING",
                },
            }),

            prisma.scheduledPost.findMany({
                where: {
                    account: { userId },
                },
                orderBy: { createdAt: "desc" },
                take: 5,
                include: {
                    account: true,
                },
            }),
        ]);

        return res.json({
            success: true,
            data: {
                stats: {
                    totalAccounts,
                    totalCampaigns,
                    totalVideos,
                    totalScheduledPosts,
                    publishedPosts,
                    failedPosts,
                    pendingPosts,
                },
                recentPosts,
            },
        });
    } catch (error: any) {
        console.error("Dashboard error:", error.message);

        return res.status(500).json({
            error: "Failed to load dashboard data",
        });
    }
};