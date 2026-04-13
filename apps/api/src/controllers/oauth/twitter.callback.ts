import { Request, Response } from "express";
import axios from "axios";
import prisma from "database/src/index";
import { twitterOauthStore } from "./twitter.oauth";
import { getFrontendAccountsUrl } from "../../utils/oauth.utils";

export const twitterCallback = async (req: Request, res: Response) => {
    try {
        const code = String(req.query.code || "");
        const state = String(req.query.state || "");
        const error = String(req.query.error || "");
        const errorDescription = String(req.query.error_description || "");

        if (error) {
            console.error("Twitter OAuth denied:", error, errorDescription);
            return res.redirect(getFrontendAccountsUrl("error=twitter_oauth_denied"));
        }

        if (!code || !state) {
            return res.redirect(getFrontendAccountsUrl("error=twitter_oauth_failed"));
        }

        const session = twitterOauthStore.get(state);

        if (!session) {
            return res.redirect(getFrontendAccountsUrl("error=twitter_invalid_state"));
        }

        if (Date.now() - session.createdAt > 10 * 60 * 1000) {
            twitterOauthStore.delete(state);
            return res.redirect(getFrontendAccountsUrl("error=twitter_session_expired"));
        }

        const basicAuth = Buffer.from(
            `${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`
        ).toString("base64");

        const tokenParams = new URLSearchParams({
            code,
            grant_type: "authorization_code",
            client_id: process.env.X_CLIENT_ID as string,
            redirect_uri: process.env.X_REDIRECT_URI as string,
            code_verifier: session.codeVerifier,
        });

        const tokenResponse = await axios.post(
            "https://api.twitter.com/2/oauth2/token",
            tokenParams.toString(),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Authorization: `Basic ${basicAuth}`,
                },
            }
        );

        const accessToken = tokenResponse.data?.access_token as string;
        const refreshToken = tokenResponse.data?.refresh_token || null;

        if (!accessToken) {
            return res.redirect(getFrontendAccountsUrl("error=twitter_token_exchange_failed"));
        }

        const meResponse = await axios.get("https://api.twitter.com/2/users/me", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            params: {
                "user.fields": "id,name,username",
            },
        });

        const profile = meResponse.data?.data;

        if (!profile?.id) {
            return res.redirect(getFrontendAccountsUrl("error=twitter_profile_fetch_failed"));
        }

        await prisma.socialAccount.upsert({
            where: {
                userId_platform_platformUserId: {
                    userId: session.userId,
                    platform: "twitter",
                    platformUserId: String(profile.id),
                },
            },
            update: {
                accountName: profile.username || profile.name || "twitter_user",
                accessToken,
                refreshToken,
                status: "active",
            },
            create: {
                userId: session.userId,
                platform: "twitter",
                accountName: profile.username || profile.name || "twitter_user",
                accessToken,
                refreshToken,
                platformUserId: String(profile.id),
                status: "active",
            },
        });

        twitterOauthStore.delete(state);

        return res.redirect(getFrontendAccountsUrl("success=twitter_connected"));
    } catch (error: any) {
        console.error("twitterCallback error:", error?.response?.data || error?.message || error);
        return res.redirect(getFrontendAccountsUrl("error=twitter_oauth_failed"));
    }
};