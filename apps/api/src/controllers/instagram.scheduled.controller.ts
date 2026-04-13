import { Request, Response } from "express";
import prisma from "database/src/index";

const getUserIdFromReq = (req: Request) => {
    return (req as any)?.user?.userId || (req as any)?.user?.id || null;
};

export const createInstagramScheduledPost = async (
    req: Request,
    res: Response
) => {
    try {
        const userId = getUserIdFromReq(req);

        if (!userId) {
            return res.status(401).json({ error: "Not authenticated" });
        }

        const {
            accountId,
            caption,
            scheduledTime,
            mediaUrl,
            mediaUrls,
            campaignId,
            videoId,
        } = req.body;

        if (!accountId || !scheduledTime) {
            return res.status(400).json({
                error: "accountId and scheduledTime are required",
            });
        }

        const normalizedMediaUrls: string[] = Array.isArray(mediaUrls)
            ? mediaUrls.filter(Boolean)
            : mediaUrl
                ? [mediaUrl]
                : [];

        if (normalizedMediaUrls.length === 0) {
            return res.status(400).json({
                error: "mediaUrl or mediaUrls is required for Instagram",
            });
        }

        const scheduleDate = new Date(scheduledTime);

        if (isNaN(scheduleDate.getTime())) {
            return res.status(400).json({ error: "Invalid scheduledTime" });
        }

        if (scheduleDate.getTime() <= Date.now()) {
            return res.status(400).json({
                error: "scheduledTime must be in the future",
            });
        }

        const account = await prisma.socialAccount.findUnique({
            where: { id: accountId },
        });

        if (!account) {
            return res.status(404).json({ error: "Instagram account not found" });
        }

        if (account.userId !== userId) {
            return res.status(403).json({ error: "Unauthorized account access" });
        }

        if (account.platform !== "instagram") {
            return res.status(400).json({ error: "Selected account is not Instagram" });
        }

        const scheduledPost = await prisma.scheduledPost.create({
            data: {
                userId,
                caption: caption || "",
                scheduledTime: scheduleDate,
                mediaUrl: normalizedMediaUrls[0] || null,
                mediaUrls: normalizedMediaUrls,
                status: "PENDING",
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

        return res.status(201).json({
            success: true,
            message: "Instagram post scheduled successfully",
            data: scheduledPost,
        });
    } catch (error: any) {
        console.error(
            "Create Instagram scheduled post error:",
            error?.message || error
        );

        return res.status(500).json({
            error: "Failed to create Instagram scheduled post",
            details: error?.message || "Unknown error",
        });
    }
};

export const getInstagramScheduledPosts = async (
    req: Request,
    res: Response
) => {
    try {
        const userId = getUserIdFromReq(req);

        if (!userId) {
            return res.status(401).json({ error: "Not authenticated" });
        }

        const posts = await prisma.scheduledPost.findMany({
            where: {
                userId,
                account: {
                    platform: "instagram",
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
        console.error(
            "Get Instagram scheduled posts error:",
            error?.message || error
        );

        return res.status(500).json({
            error: "Failed to fetch Instagram scheduled posts",
        });
    }
};