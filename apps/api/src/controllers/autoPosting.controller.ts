import { Request, Response } from "express";
import prisma from "database/src/index";

function addDays(date: Date, days: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

function setTimeOnDate(baseDate: Date, time: string) {
    const [hours, minutes] = time.split(":").map(Number);
    const d = new Date(baseDate);
    d.setHours(hours || 0, minutes || 0, 0, 0);
    return d;
}

function inferMediaType(url: string): "IMAGE" | "VIDEO" | "UNKNOWN" {
    const clean = url.split("?")[0].toLowerCase();
    if (
        clean.endsWith(".jpg") ||
        clean.endsWith(".jpeg") ||
        clean.endsWith(".png") ||
        clean.endsWith(".webp")
    ) {
        return "IMAGE";
    }
    if (clean.endsWith(".mp4")) {
        return "VIDEO";
    }
    return "UNKNOWN";
}

function validateMediaUrls(mediaUrls: string[]) {
    const imageCount = mediaUrls.filter((u) => inferMediaType(u) === "IMAGE").length;
    const videoCount = mediaUrls.filter((u) => inferMediaType(u) === "VIDEO").length;
    const unknownCount = mediaUrls.filter((u) => inferMediaType(u) === "UNKNOWN").length;

    if (unknownCount > 0) {
        return { valid: false, error: "One or more media URLs have unsupported format." };
    }

    if (imageCount > 0 && videoCount > 0) {
        return { valid: false, error: "Do not mix images and video in the same LinkedIn post." };
    }

    if (videoCount > 1) {
        return { valid: false, error: "Only one video is allowed per LinkedIn post." };
    }

    return { valid: true, error: "" };
}

function generateFallbackCaption(topic: string, tone: string, dayNumber: number) {
    const safeTopic = topic?.trim() || "our latest update";

    if (tone === "friendly") {
        return `Day ${dayNumber}: Sharing a quick update about ${safeTopic}.\n\nWe’re excited about the progress and would love to hear your thoughts.`;
    }

    if (tone === "promotional") {
        return `Day ${dayNumber}: Here’s an update on ${safeTopic}.\n\nWe’re building with focus and momentum. Reach out if you'd like to learn more.`;
    }

    if (tone === "thought-leadership") {
        return `Day ${dayNumber}: One thing we’re learning from ${safeTopic} is that consistency and clarity matter more than complexity.\n\nCurious how others are approaching this.`;
    }

    return `Day ${dayNumber}: A professional update on ${safeTopic}.\n\nWe’re continuing to improve the workflow and share practical progress along the way.`;
}

export const createAutoAIPostingPlan = async (req: Request, res: Response) => {
    try {
        const {
            accountIds = [],
            topic = "",
            tone = "professional",
            mediaUrls = [],
            startDate,
            timeOfDay = "10:00",
            totalDays = 7,
        } = req.body;

        if (!Array.isArray(accountIds) || accountIds.length === 0) {
            return res.status(400).json({
                error: "accountIds must be a non-empty array",
            });
        }

        if (!startDate) {
            return res.status(400).json({
                error: "startDate is required",
            });
        }

        if (!Array.isArray(mediaUrls)) {
            return res.status(400).json({
                error: "mediaUrls must be an array",
            });
        }

        if (!topic.trim()) {
            return res.status(400).json({
                error: "topic is required",
            });
        }

        const parsedStartDate = new Date(startDate);

        if (Number.isNaN(parsedStartDate.getTime())) {
            return res.status(400).json({
                error: "Invalid startDate",
            });
        }

        if (!Number.isInteger(totalDays) || totalDays <= 0 || totalDays > 30) {
            return res.status(400).json({
                error: "totalDays must be an integer between 1 and 30",
            });
        }

        const mediaValidation = validateMediaUrls(mediaUrls);
        if (!mediaValidation.valid) {
            return res.status(400).json({
                error: mediaValidation.error,
            });
        }

        const validAccounts = [];
        for (const accountId of accountIds) {
            const account = await prisma.socialAccount.findUnique({
                where: { id: accountId },
            });

            if (!account) continue;
            if (String(account.platform || "").toLowerCase() !== "linkedin") continue;

            validAccounts.push(account);
        }

        if (validAccounts.length === 0) {
            return res.status(400).json({
                error: "No valid LinkedIn accounts found",
            });
        }

        const createdPosts: any[] = [];
        const failedPosts: any[] = [];

        for (let dayIndex = 0; dayIndex < totalDays; dayIndex++) {
            const baseDate = addDays(parsedStartDate, dayIndex);
            const scheduledTime = setTimeOnDate(baseDate, timeOfDay);

            if (scheduledTime.getTime() <= Date.now()) {
                continue;
            }

            const caption = generateFallbackCaption(topic, tone, dayIndex + 1);

            for (const account of validAccounts) {
                try {
                    const post = await prisma.scheduledPost.create({
                        data: {
                            accountId: account.id,
                            caption,
                            scheduledTime,
                            status: "PENDING",
                            mediaUrls,
                        },
                    });

                    createdPosts.push(post);
                } catch (error: any) {
                    failedPosts.push({
                        accountId: account.id,
                        day: dayIndex + 1,
                        error: error?.message || "Failed to create scheduled post",
                    });
                }
            }
        }

        return res.status(200).json({
            success: true,
            message: "✅ Auto AI posting plan created",
            data: {
                successCount: createdPosts.length,
                failureCount: failedPosts.length,
                createdPosts,
                failedPosts,
            },
        });
    } catch (error: any) {
        console.error("createAutoAIPostingPlan error:", error);

        return res.status(500).json({
            error: error?.message || "Failed to create auto AI posting plan",
        });
    }
};