import { Request, Response } from "express";
import prisma from "database/src/index";

type LinkedInMediaType = "IMAGE" | "VIDEO" | "UNKNOWN";

const getMediaTypeFromUrl = (url: string): LinkedInMediaType => {
    const cleanUrl = url.split("?")[0].toLowerCase();

    if (
        cleanUrl.endsWith(".jpg") ||
        cleanUrl.endsWith(".jpeg") ||
        cleanUrl.endsWith(".png") ||
        cleanUrl.endsWith(".webp")
    ) {
        return "IMAGE";
    }

    if (cleanUrl.endsWith(".mp4")) {
        return "VIDEO";
    }

    return "UNKNOWN";
};

const validateLinkedInMediaUrls = (mediaUrls: string[]) => {
    const imageCount = mediaUrls.filter(
        (url) => getMediaTypeFromUrl(url) === "IMAGE"
    ).length;

    const videoCount = mediaUrls.filter(
        (url) => getMediaTypeFromUrl(url) === "VIDEO"
    ).length;

    const unknownCount = mediaUrls.filter(
        (url) => getMediaTypeFromUrl(url) === "UNKNOWN"
    ).length;

    if (unknownCount > 0) {
        return {
            valid: false,
            error: "One or more media files have an unsupported type.",
        };
    }

    if (imageCount > 0 && videoCount > 0) {
        return {
            valid: false,
            error: "LinkedIn does not allow mixing images and video in the same post.",
        };
    }

    if (videoCount > 1) {
        return {
            valid: false,
            error: "LinkedIn allows only one video per post.",
        };
    }

    return { valid: true, error: "" };
};

export const createScheduledLinkedInPost = async (
    req: Request,
    res: Response
) => {
    try {
        const { accountId, caption = "", mediaUrls = [], scheduledTime } = req.body;

        if (!accountId) {
            return res.status(400).json({
                error: "accountId is required",
            });
        }

        if (!scheduledTime) {
            return res.status(400).json({
                error: "scheduledTime is required",
            });
        }

        if (!Array.isArray(mediaUrls)) {
            return res.status(400).json({
                error: "mediaUrls must be an array",
            });
        }

        if (!caption.trim() && mediaUrls.length === 0) {
            return res.status(400).json({
                error: "Please provide a caption or at least one media file.",
            });
        }

        const scheduledDate = new Date(scheduledTime);

        if (Number.isNaN(scheduledDate.getTime())) {
            return res.status(400).json({
                error: "Invalid scheduledTime value",
            });
        }

        if (scheduledDate.getTime() <= Date.now()) {
            return res.status(400).json({
                error: "scheduledTime must be in the future",
            });
        }

        const account = await prisma.socialAccount.findUnique({
            where: { id: accountId },
        });

        if (!account) {
            return res.status(404).json({
                error: "LinkedIn account not found",
            });
        }

        if (account.platform?.toLowerCase() !== "linkedin") {
            return res.status(400).json({
                error: "Only LinkedIn accounts can be used here",
            });
        }

        const mediaValidation = validateLinkedInMediaUrls(mediaUrls);

        if (!mediaValidation.valid) {
            return res.status(400).json({
                error: mediaValidation.error,
            });
        }

        const scheduledPost = await prisma.scheduledPost.create({
            data: {
                accountId,
                caption: caption.trim(),
                scheduledTime: scheduledDate,
                status: "PENDING",
                mediaUrls,
            },
        });

        return res.status(201).json({
            success: true,
            message: "✅ LinkedIn post scheduled successfully",
            scheduledPost,
        });
    } catch (error: any) {
        console.error("createScheduledLinkedInPost error:", error);

        return res.status(500).json({
            error: error?.message || "Failed to schedule LinkedIn post",
        });
    }
};

export const createBulkScheduledLinkedInPost = async (
    req: Request,
    res: Response
) => {
    try {
        const {
            accountIds = [],
            caption = "",
            mediaUrls = [],
            scheduledTime,
        } = req.body;

        if (!Array.isArray(accountIds) || accountIds.length === 0) {
            return res.status(400).json({
                error: "accountIds must be a non-empty array",
            });
        }

        if (!scheduledTime) {
            return res.status(400).json({
                error: "scheduledTime is required",
            });
        }

        if (!Array.isArray(mediaUrls)) {
            return res.status(400).json({
                error: "mediaUrls must be an array",
            });
        }

        if (!caption.trim() && mediaUrls.length === 0) {
            return res.status(400).json({
                error: "Please provide a caption or at least one media file.",
            });
        }

        const scheduledDate = new Date(scheduledTime);

        if (Number.isNaN(scheduledDate.getTime())) {
            return res.status(400).json({
                error: "Invalid scheduledTime value",
            });
        }

        if (scheduledDate.getTime() <= Date.now()) {
            return res.status(400).json({
                error: "scheduledTime must be in the future",
            });
        }

        const mediaValidation = validateLinkedInMediaUrls(mediaUrls);

        if (!mediaValidation.valid) {
            return res.status(400).json({
                error: mediaValidation.error,
            });
        }

        const createdPosts: any[] = [];
        const failedPosts: any[] = [];

        for (const accountId of accountIds) {
            try {
                const account = await prisma.socialAccount.findUnique({
                    where: { id: accountId },
                });

                if (!account) {
                    failedPosts.push({
                        accountId,
                        error: "LinkedIn account not found",
                    });
                    continue;
                }

                if (account.platform?.toLowerCase() !== "linkedin") {
                    failedPosts.push({
                        accountId,
                        error: "Only LinkedIn accounts can be used here",
                    });
                    continue;
                }

                const scheduledPost = await prisma.scheduledPost.create({
                    data: {
                        accountId,
                        caption: caption.trim(),
                        scheduledTime: scheduledDate,
                        status: "PENDING",
                        mediaUrls,
                    },
                });

                createdPosts.push(scheduledPost);
            } catch (error: any) {
                failedPosts.push({
                    accountId,
                    error: error?.message || "Failed to schedule post",
                });
            }
        }

        return res.status(200).json({
            success: true,
            message: `Bulk scheduling completed. Success: ${createdPosts.length}, Failed: ${failedPosts.length}`,
            data: {
                successCount: createdPosts.length,
                failureCount: failedPosts.length,
                createdPosts,
                failedPosts,
            },
        });
    } catch (error: any) {
        console.error("createBulkScheduledLinkedInPost error:", error);

        return res.status(500).json({
            error: error?.message || "Failed to bulk schedule LinkedIn posts",
        });
    }
};

export const getScheduledLinkedInPosts = async (
    req: Request,
    res: Response
) => {
    try {
        const posts = await prisma.scheduledPost.findMany({
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
        console.error("getScheduledLinkedInPosts error:", error);

        return res.status(500).json({
            error: error?.message || "Failed to fetch scheduled LinkedIn posts",
        });
    }
};

export const rescheduleLinkedInPost = async (
    req: Request,
    res: Response
) => {
    try {
        const { postId } = req.params;
        const { scheduledTime } = req.body;

        if (!postId) {
            return res.status(400).json({
                error: "postId is required",
            });
        }

        if (!scheduledTime) {
            return res.status(400).json({
                error: "scheduledTime is required",
            });
        }

        const scheduledDate = new Date(scheduledTime);

        if (Number.isNaN(scheduledDate.getTime())) {
            return res.status(400).json({
                error: "Invalid scheduledTime value",
            });
        }

        if (scheduledDate.getTime() <= Date.now()) {
            return res.status(400).json({
                error: "scheduledTime must be in the future",
            });
        }

        const existingPost = await prisma.scheduledPost.findUnique({
            where: { id: postId },
        });

        if (!existingPost) {
            return res.status(404).json({
                error: "Scheduled post not found",
            });
        }

        const updatedPost = await prisma.scheduledPost.update({
            where: { id: postId },
            data: {
                scheduledTime: scheduledDate,
                status: existingPost.status === "FAILED" ? "PENDING" : existingPost.status,
            },
            include: {
                account: true,
            },
        });

        return res.status(200).json({
            success: true,
            message: "✅ Scheduled post updated successfully",
            data: updatedPost,
        });
    } catch (error: any) {
        console.error("rescheduleLinkedInPost error:", error);

        return res.status(500).json({
            error: error?.message || "Failed to reschedule LinkedIn post",
        });
    }
};