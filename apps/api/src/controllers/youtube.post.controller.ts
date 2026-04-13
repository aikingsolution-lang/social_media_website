import { Response } from "express";
import prisma from "database/src/index";
import {
    uploadYouTubeVideo,
    refreshYouTubeAccessToken,
} from "../services/youtube.service";

export const createYouTubePost = async (req: any, res: Response) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        const { accountId, title, description, mediaUrl, privacyStatus } = req.body;

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

        if (!title?.trim()) {
            return res.status(400).json({
                success: false,
                message: "title is required",
            });
        }

        if (!mediaUrl?.trim()) {
            return res.status(400).json({
                success: false,
                message: "mediaUrl is required for YouTube upload",
            });
        }

        const account = await prisma.socialAccount.findFirst({
            where: {
                id: accountId,
                userId,
                platform: "youtube",
            },
        });

        if (!account) {
            return res.status(404).json({
                success: false,
                message: "YouTube account not found",
            });
        }

        let accessToken = account.accessToken;

        const tryUpload = async (token: string) => {
            return uploadYouTubeVideo({
                accessToken: token,
                title: title.trim(),
                description: description || "",
                localFilePath: mediaUrl.trim(),
                privacyStatus: privacyStatus || "private",
            });
        };

        // First attempt with current token
        try {
            if (!accessToken) {
                throw new Error("Missing access token");
            }

            const result = await tryUpload(accessToken);

            return res.status(200).json({
                success: true,
                message: "YouTube video uploaded successfully",
                data: result,
            });
        } catch (err: any) {
            const isAuthError =
                err?.response?.status === 401 ||
                err?.response?.data?.error?.status === "UNAUTHENTICATED" ||
                err?.response?.data?.error?.errors?.some(
                    (e: any) => e?.reason === "authError"
                );

            if (!isAuthError) {
                throw err;
            }

            if (!account.refreshToken) {
                return res.status(401).json({
                    success: false,
                    message: "YouTube token expired and no refresh token is available. Reconnect your YouTube account.",
                    error: err?.response?.data || err.message,
                });
            }

            // Refresh and retry once
            const newAccessToken = await refreshYouTubeAccessToken(account.refreshToken);

            await prisma.socialAccount.update({
                where: { id: account.id },
                data: { accessToken: newAccessToken },
            });

            const retryResult = await tryUpload(newAccessToken);

            return res.status(200).json({
                success: true,
                message: "YouTube video uploaded successfully",
                data: retryResult,
            });
        }
    } catch (err: any) {
        console.error("YouTube upload error:", err?.response?.data || err.message);

        return res.status(500).json({
            success: false,
            message: "Failed to upload video to YouTube",
            error: err?.response?.data || err.message,
        });
    }
};