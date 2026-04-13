import { Response } from "express";
import prisma from "database/src";
import { publishThreadsPost } from "../services/threads.service";
import { normalizeAccessToken } from "../utils/normalizeAccessToken";

export const createThreadsPost = async (req: any, res: Response) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        const { accountId, caption, mediaUrl, mediaUrls } = req.body;

        if (!userId) {
            return res.status(401).json({ error: "Not authenticated" });
        }

        if (!accountId) {
            return res.status(400).json({ error: "accountId is required" });
        }

        const normalizedCaption =
            typeof caption === "string" ? caption.trim() : "";

        const normalizedMediaUrl =
            typeof mediaUrl === "string" && mediaUrl.trim() ? mediaUrl.trim() : null;

        const normalizedMediaUrls = Array.isArray(mediaUrls)
            ? mediaUrls.map((url: string) => (typeof url === "string" ? url.trim() : "")).filter(Boolean)
            : [];

        if (!normalizedCaption && !normalizedMediaUrl && normalizedMediaUrls.length === 0) {
            return res.status(400).json({
                error: "Caption or media is required",
            });
        }

        const account = await prisma.socialAccount.findFirst({
            where: {
                id: accountId,
                userId,
            },
        });

        if (!account) {
            return res.status(404).json({ error: "Account not found" });
        }

        if (String(account.platform).toLowerCase() !== "threads") {
            return res.status(400).json({ error: "Invalid Threads account" });
        }

        const cleanedToken = normalizeAccessToken(account.accessToken);

        if (!cleanedToken) {
            return res.status(400).json({ error: "Missing Threads access token" });
        }

        if (!account.platformUserId) {
            return res.status(400).json({ error: "Missing Threads platformUserId" });
        }

        const result = await publishThreadsPost({
            accessToken: cleanedToken,
            userId: account.platformUserId,
            caption: normalizedCaption,
            mediaUrl: normalizedMediaUrl,
            mediaUrls: normalizedMediaUrls,
        });

        return res.status(200).json({
            success: true,
            message: "Threads post published successfully",
            data: result,
        });
    } catch (error: any) {
        console.error(
            "createThreadsPost error:",
            error?.response?.data || error?.message || error
        );

        return res.status(500).json({
            error: "Failed to publish Threads post",
            detail: error?.response?.data || error?.message || "Unknown error",
        });
    }
};