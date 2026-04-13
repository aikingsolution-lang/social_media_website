import { Request, Response } from "express";
import prisma from "database/src/index";

const normalizeDate = (value: string | Date) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        throw new Error("Invalid date");
    }
    return date;
};

export const getFacebookScheduledPosts = async (req: any, res: Response) => {
    try {
        const userId = req.user?.userId || req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "Not authenticated",
            });
        }

        const posts = await prisma.scheduledPost.findMany({
            where: {
                account: {
                    userId: String(userId),
                    platform: "facebook",
                },
            },
            include: {
                account: true,
                campaign: true,
                video: true,
            },
            orderBy: {
                scheduledTime: "asc",
            },
        });

        return res.status(200).json({
            success: true,
            data: posts,
        });
    } catch (error: any) {
        console.error("getFacebookScheduledPosts error:", error.message);

        return res.status(500).json({
            success: false,
            error: "Failed to fetch Facebook scheduled posts",
        });
    }
};

export const createFacebookScheduledPostsBulk = async (req: any, res: Response) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        const { accountIds, caption, mediaUrls, scheduledTime, campaignId, videoId } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "Not authenticated",
            });
        }

        if (!Array.isArray(accountIds) || accountIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: "accountIds is required",
            });
        }

        if (!caption && (!Array.isArray(mediaUrls) || mediaUrls.length === 0) && !videoId) {
            return res.status(400).json({
                success: false,
                error: "caption or mediaUrls or videoId is required",
            });
        }

        if (!scheduledTime) {
            return res.status(400).json({
                success: false,
                error: "scheduledTime is required",
            });
        }

        const scheduleDate = normalizeDate(scheduledTime);

        if (scheduleDate.getTime() <= Date.now()) {
            return res.status(400).json({
                success: false,
                error: "scheduledTime must be in the future",
            });
        }

        const accounts = await prisma.socialAccount.findMany({
            where: {
                id: { in: accountIds },
                userId: String(userId),
                platform: "facebook",
                status: "active",
            },
        });

        const validAccountIds = new Set(accounts.map((a) => a.id));
        const failedAccounts = accountIds.filter((id: string) => !validAccountIds.has(id));

        const createdPosts = [];

        for (const account of accounts) {
            const created = await prisma.scheduledPost.create({
                data: {
                    campaignId: campaignId || null,
                    videoId: videoId || null,
                    accountId: account.id,
                    scheduledTime: scheduleDate,
                    caption: caption || "",
                    mediaUrl:
                        Array.isArray(mediaUrls) && mediaUrls.length > 0 ? mediaUrls[0] : null,
                    status: "PENDING",
                },
                include: {
                    account: true,
                    campaign: true,
                    video: true,
                },
            });

            createdPosts.push(created);
        }

        return res.status(201).json({
            success: true,
            message: "Facebook scheduled posts created successfully",
            data: {
                successCount: createdPosts.length,
                failureCount: failedAccounts.length,
                failedAccountIds: failedAccounts,
                posts: createdPosts,
            },
        });
    } catch (error: any) {
        console.error("createFacebookScheduledPostsBulk error:", error.message);

        return res.status(500).json({
            success: false,
            error: "Failed to create Facebook scheduled posts",
        });
    }
};

export const rescheduleFacebookPost = async (req: any, res: Response) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        const { postId } = req.params;
        const { scheduledTime } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "Not authenticated",
            });
        }

        if (!scheduledTime) {
            return res.status(400).json({
                success: false,
                error: "scheduledTime is required",
            });
        }

        const scheduleDate = normalizeDate(scheduledTime);

        if (scheduleDate.getTime() <= Date.now()) {
            return res.status(400).json({
                success: false,
                error: "scheduledTime must be in the future",
            });
        }

        const existing = await prisma.scheduledPost.findFirst({
            where: {
                id: postId,
                account: {
                    userId: String(userId),
                    platform: "facebook",
                },
            },
            include: {
                account: true,
            },
        });

        if (!existing) {
            return res.status(404).json({
                success: false,
                error: "Scheduled Facebook post not found",
            });
        }

        if (existing.status === "PUBLISHED") {
            return res.status(400).json({
                success: false,
                error: "Published post cannot be rescheduled",
            });
        }

        const updated = await prisma.scheduledPost.update({
            where: { id: postId },
            data: {
                scheduledTime: scheduleDate,
                status: "PENDING",
                failedReason: null,
            },
            include: {
                account: true,
                campaign: true,
                video: true,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Facebook post rescheduled successfully",
            data: updated,
        });
    } catch (error: any) {
        console.error("rescheduleFacebookPost error:", error.message);

        return res.status(500).json({
            success: false,
            error: "Failed to reschedule Facebook post",
        });
    }
};