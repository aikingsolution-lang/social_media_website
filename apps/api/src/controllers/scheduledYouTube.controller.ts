import { Request, Response } from "express";
import prisma from "database/src/index";

type AuthRequest = Request & {
    user?: {
        userId?: string;
        id?: string;
    };
};

export const createScheduledYouTubePosts = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const userId = req.user?.userId || req.user?.id;

        const {
            accountIds,
            title,
            description,
            mediaUrl,
            privacyStatus,
            scheduledTime,
            isShort,
        } = req.body;

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

        if (!title?.trim()) {
            return res.status(400).json({
                success: false,
                error: "title is required",
            });
        }

        if (!mediaUrl?.trim()) {
            return res.status(400).json({
                success: false,
                error: "mediaUrl is required",
            });
        }

        if (!scheduledTime) {
            return res.status(400).json({
                success: false,
                error: "scheduledTime is required",
            });
        }

        const parsedScheduledTime = new Date(scheduledTime);

        if (Number.isNaN(parsedScheduledTime.getTime())) {
            return res.status(400).json({
                success: false,
                error: "Invalid scheduledTime",
            });
        }

        if (parsedScheduledTime.getTime() <= Date.now()) {
            return res.status(400).json({
                success: false,
                error: "scheduledTime must be in the future",
            });
        }

        const accounts = await prisma.socialAccount.findMany({
            where: {
                id: { in: accountIds },
                userId,
                platform: "youtube",
            },
        });

        if (!accounts.length) {
            return res.status(404).json({
                success: false,
                error: "No valid YouTube accounts found",
            });
        }

        const createdPosts: any[] = [];

        for (const account of accounts) {
            const scheduledPost = await prisma.scheduledPost.create({
                data: {
                    userId,
                    accountId: account.id,
                    caption: description || "",
                    mediaUrl: mediaUrl.trim(),
                    scheduledTime: parsedScheduledTime,
                    status: "PENDING",
                    platform: "youtube",
                    extraData: {
                        youtubeTitle: title.trim(),
                        youtubeDescription: description || "",
                        privacyStatus: privacyStatus || "private",
                        isShort: !!isShort,
                    },
                } as any,
            });

            createdPosts.push(scheduledPost);
        }

        return res.status(200).json({
            success: true,
            message: "YouTube posts scheduled successfully",
            data: {
                successCount: createdPosts.length,
                failureCount: 0,
                posts: createdPosts,
            },
        });
    } catch (error: any) {
        console.error("createScheduledYouTubePosts error:", error.message);

        return res.status(500).json({
            success: false,
            error: "Failed to schedule YouTube posts",
        });
    }
};

export const getScheduledYouTubePosts = async (
    req: AuthRequest,
    res: Response
) => {
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
                userId,
                platform: "youtube",
            } as any,
            include: {
                account: true,
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
        console.error("getScheduledYouTubePosts error:", error.message);

        return res.status(500).json({
            success: false,
            error: "Failed to fetch scheduled YouTube posts",
        });
    }
};

export const rescheduleScheduledYouTubePost = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        const { id } = req.params;
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

        const parsedScheduledTime = new Date(scheduledTime);

        if (Number.isNaN(parsedScheduledTime.getTime())) {
            return res.status(400).json({
                success: false,
                error: "Invalid scheduledTime",
            });
        }

        if (parsedScheduledTime.getTime() <= Date.now()) {
            return res.status(400).json({
                success: false,
                error: "scheduledTime must be in the future",
            });
        }

        const post = await prisma.scheduledPost.findFirst({
            where: {
                id,
                userId,
                platform: "youtube",
            } as any,
        });

        if (!post) {
            return res.status(404).json({
                success: false,
                error: "Scheduled YouTube post not found",
            });
        }

        const updated = await prisma.scheduledPost.update({
            where: { id },
            data: {
                scheduledTime: parsedScheduledTime,
                status: "PENDING",
                failedReason: null,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Scheduled YouTube post rescheduled successfully",
            data: updated,
        });
    } catch (error: any) {
        console.error("rescheduleScheduledYouTubePost error:", error.message);

        return res.status(500).json({
            success: false,
            error: "Failed to reschedule YouTube post",
        });
    }
};