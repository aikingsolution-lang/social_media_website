import { Response } from "express";
import prisma from "database/src/index";
import { publishFacebookPost } from "../services/facebook.service";

export const createFacebookPost = async (req: any, res: Response) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        const { accountId, caption, mediaUrls } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Not authenticated",
            });
        }

        if (!accountId) {
            return res.status(400).json({
                success: false,
                message: "accountId is required",
            });
        }

        if (!caption && (!Array.isArray(mediaUrls) || mediaUrls.length === 0)) {
            return res.status(400).json({
                success: false,
                message: "caption or mediaUrls is required",
            });
        }

        const account = await prisma.socialAccount.findFirst({
            where: {
                id: accountId,
                userId: String(userId),
                platform: "facebook",
            },
        });

        if (!account) {
            return res.status(404).json({
                success: false,
                message: "Facebook account not found",
            });
        }

        if (!account.accessToken) {
            return res.status(400).json({
                success: false,
                message: "Facebook Page access token is missing",
            });
        }

        if (!account.platformUserId) {
            return res.status(400).json({
                success: false,
                message: "Facebook Page ID is missing",
            });
        }

        const mediaUrl =
            Array.isArray(mediaUrls) && mediaUrls.length > 0 ? mediaUrls[0] : null;

        const result = await publishFacebookPost({
            pageId: account.platformUserId,
            accessToken: account.accessToken,
            caption: caption || "",
            mediaUrl,
        });

        return res.status(200).json({
            success: true,
            message: "✅ Facebook post published successfully",
            data: result,
        });
    } catch (error: any) {
        console.error("createFacebookPost error:", error?.response?.data || error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to publish Facebook post",
            error: error?.response?.data || error.message,
        });
    }
};