import { Request, Response } from "express";
import prisma from "database/src/index";
import { publishFacebookPost } from "../services/publish/facebook.publish";

type AuthRequest = Request & {
    user?: {
        userId?: string;
        id?: string;
    };
};

export const publishFacebookDirect = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        const { accountId, caption, mediaUrl } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Not authenticated" });
        }

        const account = await prisma.socialAccount.findFirst({
            where: { id: accountId, userId, platform: "facebook" },
        });

        if (!account || !account.platformUserId) {
            return res.status(404).json({ success: false, message: "Facebook account not found" });
        }

        const result = await publishFacebookPost({
            pageId: account.platformUserId,
            accessToken: account.accessToken,
            caption,
            mediaUrl: mediaUrl || null,
        });

        return res.status(200).json({
            success: true,
            message: "Facebook post published successfully",
            data: result,
        });
    } catch (error: any) {
        console.error("publishFacebookDirect error:", error?.response?.data || error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to publish Facebook post",
            error: error?.response?.data || error.message,
        });
    }
};