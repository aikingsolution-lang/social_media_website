import { Request, Response } from "express";
import prisma from "database/src/index";
import { publishInstagramPost } from "../services/instagram.service";

const getUserIdFromReq = (req: Request) => {
    return (req as any)?.user?.userId || (req as any)?.user?.id || null;
};

export const createInstagramPost = async (req: Request, res: Response) => {
    try {
        const userId = getUserIdFromReq(req);

        if (!userId) {
            return res.status(401).json({ error: "Not authenticated" });
        }

        const { accountId, caption, mediaUrls, mediaUrl } = req.body;

        if (!accountId) {
            return res.status(400).json({ error: "accountId is required" });
        }

        const normalizedMediaUrls: string[] = Array.isArray(mediaUrls)
            ? mediaUrls.filter(Boolean)
            : mediaUrl
                ? [mediaUrl]
                : [];

        if (normalizedMediaUrls.length === 0) {
            return res.status(400).json({ error: "mediaUrl or mediaUrls is required" });
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

        if (!account.accessToken) {
            return res.status(400).json({ error: "Instagram access token missing" });
        }

        if (!account.platformUserId) {
            return res.status(400).json({
                error: "Instagram professional account ID missing",
            });
        }
        console.log("Instagram account debug:", {
            accountId: account.id,
            platform: account.platform,
            platformUserId: account.platformUserId,
            hasAccessToken: !!account.accessToken,
            accessTokenPreview: account.accessToken
                ? `${account.accessToken.slice(0, 12)}...${account.accessToken.slice(-6)}`
                : null,
        });

        const result = await publishInstagramPost({
            igUserId: account.platformUserId,
            accessToken: account.accessToken,
            caption: caption || "",
            mediaUrls: normalizedMediaUrls,
        });

        return res.status(200).json({
            success: true,
            message: "Instagram post published successfully",
            data: result,
        });
    } catch (err: any) {
        console.error("Instagram publish error:", err?.response?.data || err?.message);

        return res.status(500).json({
            error: "Failed to publish to Instagram",
            detail: err?.response?.data || err?.message,
        });
    }
};