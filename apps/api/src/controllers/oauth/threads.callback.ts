import { Request, Response } from "express";
import axios from "axios";
import prisma from "database/src/index";
import { getFrontendAccountsUrl } from "../../utils/oauth.utils";
import { normalizeAccessToken } from "../../utils/normalizeAccessToken";

const THREADS_API_BASE = "https://graph.threads.net/v1.0";

export const threadsCallback = async (req: Request, res: Response) => {
    try {
        const { code, state, error, error_reason, error_description } = req.query;

        if (error) {
            console.error("Threads OAuth denied:", {
                error,
                error_reason,
                error_description,
            });
            return res.redirect(getFrontendAccountsUrl("error=threads_oauth_failed"));
        }

        if (!code || typeof code !== "string") {
            return res.redirect(getFrontendAccountsUrl("error=threads_oauth_failed"));
        }

        if (!state || typeof state !== "string") {
            return res.redirect(getFrontendAccountsUrl("error=threads_invalid_state"));
        }

        let decodedState: any;

        try {
            decodedState = JSON.parse(
                Buffer.from(state, "base64url").toString("utf8")
            );
        } catch (decodeError) {
            console.error("Invalid Threads state:", decodeError);
            return res.redirect(getFrontendAccountsUrl("error=threads_invalid_state"));
        }

        const userId = decodedState?.userId;
        const platform = decodedState?.platform;

        if (!userId || platform !== "threads") {
            return res.redirect(getFrontendAccountsUrl("error=threads_invalid_state"));
        }

        if (
            !process.env.THREADS_APP_ID ||
            !process.env.THREADS_APP_SECRET ||
            !process.env.THREADS_REDIRECT_URI
        ) {
            console.error("Missing Threads environment variables");
            return res.redirect(
                getFrontendAccountsUrl("error=threads_token_exchange_failed")
            );
        }

        const shortLivedRes = await axios.post(
            "https://graph.threads.net/oauth/access_token",
            new URLSearchParams({
                client_id: process.env.THREADS_APP_ID,
                client_secret: process.env.THREADS_APP_SECRET,
                grant_type: "authorization_code",
                redirect_uri: process.env.THREADS_REDIRECT_URI,
                code,
            }).toString(),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );

        console.log("Threads short-lived token response:", shortLivedRes.data);

        const shortLivedToken = normalizeAccessToken(
            shortLivedRes.data?.access_token
        );

        if (!shortLivedToken) {
            return res.redirect(
                getFrontendAccountsUrl("error=threads_token_exchange_failed")
            );
        }

        const longLivedRes = await axios.get(`${THREADS_API_BASE}/access_token`, {
            params: {
                grant_type: "th_exchange_token",
                client_secret: process.env.THREADS_APP_SECRET,
                access_token: shortLivedToken,
            },
        });

        console.log("Threads long-lived token response:", longLivedRes.data);

        const longLivedToken = normalizeAccessToken(
            longLivedRes.data?.access_token || shortLivedToken
        );

        const expiresIn = longLivedRes.data?.expires_in ?? null;

        if (!longLivedToken) {
            return res.redirect(
                getFrontendAccountsUrl("error=threads_token_exchange_failed")
            );
        }

        const meRes = await axios.get(`${THREADS_API_BASE}/me`, {
            params: {
                fields: "id,username,name",
                access_token: longLivedToken,
            },
        });

        console.log("Threads /me response:", meRes.data);

        const threadsUser = meRes.data;

        if (!threadsUser?.id) {
            return res.redirect(
                getFrontendAccountsUrl("error=threads_profile_fetch_failed")
            );
        }

        await prisma.socialAccount.upsert({
            where: {
                userId_platform_platformUserId: {
                    userId,
                    platform: "threads",
                    platformUserId: String(threadsUser.id),
                },
            },
            update: {
                accessToken: longLivedToken,
                refreshToken: null,
                accountName:
                    threadsUser.username ||
                    threadsUser.name ||
                    `threads_${threadsUser.id}`,
                platformUserId: String(threadsUser.id),
                status: "active",
            },
            create: {
                userId,
                platform: "threads",
                accountName:
                    threadsUser.username ||
                    threadsUser.name ||
                    `threads_${threadsUser.id}`,
                accessToken: longLivedToken,
                refreshToken: null,
                platformUserId: String(threadsUser.id),
                status: "active",
            },
        });

        console.log("Threads account saved successfully", {
            platformUserId: String(threadsUser.id),
            expiresIn,
        });

        return res.redirect(getFrontendAccountsUrl("success=threads_connected"));
    } catch (error: any) {
        console.error(
            "Threads callback failed:",
            error?.response?.data || error?.message || error
        );

        return res.redirect(
            getFrontendAccountsUrl("error=threads_token_exchange_failed")
        );
    }
};