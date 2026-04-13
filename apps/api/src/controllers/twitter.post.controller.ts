import { Response } from "express";
import prisma from "database/src/index";
import { publishTwitterPost } from "../services/twitter.service";

export const createTwitterPost = async (req: any, res: Response) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        const { accountId, caption, mediaUrl, mediaUrls } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        if (!accountId) {
            return res.status(400).json({
                success: false,
                message: "accountId is required",
            });
        }

        const normalizedCaption = typeof caption === "string" ? caption : "";
        const normalizedMediaUrl =
            typeof mediaUrl === "string" && mediaUrl.trim() ? mediaUrl.trim() : null;
        const normalizedMediaUrls = Array.isArray(mediaUrls)
            ? mediaUrls
                .filter((item) => typeof item === "string")
                .map((item) => item.trim())
                .filter(Boolean)
            : [];

        if (!normalizedCaption.trim() && !normalizedMediaUrl && normalizedMediaUrls.length === 0) {
            return res.status(400).json({
                success: false,
                message: "caption or mediaUrl/mediaUrls is required",
            });
        }

        const account = await prisma.socialAccount.findFirst({
            where: {
                id: accountId,
                userId,
            },
        });

        if (!account) {
            return res.status(404).json({
                success: false,
                message: "Twitter account not found",
            });
        }

        if (String(account.platform).toLowerCase() !== "twitter") {
            return res.status(400).json({
                success: false,
                message: "Selected account is not a Twitter/X account",
            });
        }

        if (!account.accessToken) {
            return res.status(400).json({
                success: false,
                message: "Missing Twitter access token",
            });
        }

        const result = await publishTwitterPost({
            accessToken: account.accessToken,
            caption: normalizedCaption,
            mediaUrl: normalizedMediaUrl,
            mediaUrls: normalizedMediaUrls,
        });

        return res.status(200).json({
            success: true,
            message: "Twitter/X post published successfully",
            data: {
                ...result,
                id: result?.data?.id || null,
                postId: result?.data?.id || null,
            },
        });
    } catch (error: any) {
        console.error(
            "createTwitterPost error:",
            error?.response?.data || error?.message || error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to publish Twitter/X post",
            error: error?.response?.data || error?.message || "Unknown error",
        });
    }
};