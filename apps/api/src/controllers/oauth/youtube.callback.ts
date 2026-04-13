import { Request, Response } from "express";
import axios from "axios";
import jwt from "jsonwebtoken";
import prisma from "database/src/index";
import { getFrontendAccountsUrl } from "../../utils/oauth.utils";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-me";
const YOUTUBE_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID || "";
const YOUTUBE_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET || "";
const YOUTUBE_REDIRECT_URI = process.env.YOUTUBE_REDIRECT_URI || "";
const GOOGLE_TOKEN_URL =
    process.env.GOOGLE_TOKEN_URL || "https://oauth2.googleapis.com/token";
const YOUTUBE_API_BASE_URL =
    process.env.YOUTUBE_API_BASE_URL || "https://www.googleapis.com/youtube/v3";

export const youtubeCallback = async (req: Request, res: Response) => {
    try {
        const { code, state, error } = req.query;

        if (error) {
            return res.redirect(getFrontendAccountsUrl("error=youtube_oauth_denied"));
        }

        if (!code || !state) {
            return res.redirect(getFrontendAccountsUrl("error=youtube_oauth_failed"));
        }

        let userId = "";

        try {
            const decoded = jwt.verify(state as string, JWT_SECRET) as {
                userId: string;
                platform: string;
            };

            if (!decoded.userId || decoded.platform !== "youtube") {
                return res.redirect(getFrontendAccountsUrl("error=youtube_invalid_state"));
            }

            userId = decoded.userId;
        } catch {
            return res.redirect(getFrontendAccountsUrl("error=youtube_invalid_state"));
        }

        const tokenRes = await axios.post(
            GOOGLE_TOKEN_URL,
            new URLSearchParams({
                code: code as string,
                client_id: YOUTUBE_CLIENT_ID,
                client_secret: YOUTUBE_CLIENT_SECRET,
                redirect_uri: YOUTUBE_REDIRECT_URI,
                grant_type: "authorization_code",
            }).toString(),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );

        const accessToken = tokenRes.data.access_token;
        const refreshToken = tokenRes.data.refresh_token || null;

        const channelRes = await axios.get(`${YOUTUBE_API_BASE_URL}/channels`, {
            params: {
                part: "snippet",
                mine: true,
            },
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const channel = channelRes.data?.items?.[0];

        if (!channel) {
            return res.redirect(getFrontendAccountsUrl("error=youtube_no_channel"));
        }

        const channelId = String(channel.id);
        const accountName = channel.snippet?.title || "YouTube Channel";

        await prisma.socialAccount.upsert({
            where: {
                userId_platform_platformUserId: {
                    userId,
                    platform: "youtube",
                    platformUserId: channelId,
                },
            },
            update: {
                accountName,
                accessToken,
                refreshToken,
                platformUserId: channelId,
                status: "active",
            },
            create: {
                userId,
                platform: "youtube",
                accountName,
                accessToken,
                refreshToken,
                platformUserId: channelId,
                status: "active",
            },
        });

        return res.redirect(getFrontendAccountsUrl("success=youtube_connected"));
    } catch (err: any) {
        console.error("[YouTube Callback] Error:", err?.response?.data || err.message);

        return res.redirect(
            getFrontendAccountsUrl("error=youtube_token_exchange_failed")
        );
    }
};