import { Request, Response } from "express";
import axios from "axios";
import jwt from "jsonwebtoken";
import prisma from "database/src/index";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-me";
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || "";
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET || "";
const INSTAGRAM_REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI || "";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const FACEBOOK_GRAPH_VERSION = process.env.FACEBOOK_GRAPH_VERSION || "v25.0";

const buildFrontendRedirect = (query: string) =>
    `${FRONTEND_URL}/dashboard/accounts?${query}`;

type FacebookPage = {
    id: string;
    name?: string;
    access_token?: string;
};

export const instagramCallback = async (req: Request, res: Response) => {
    const { code, state, error, error_reason, error_description } = req.query;

    if (error) {
        return res.redirect(
            buildFrontendRedirect(
                `error=instagram_oauth_denied&detail=${encodeURIComponent(
                    String(error_description || error_reason || error)
                )}`
            )
        );
    }

    if (!code || !state) {
        return res.redirect(buildFrontendRedirect("error=instagram_oauth_failed"));
    }

    let userId = "";

    try {
        const decoded = jwt.verify(state as string, JWT_SECRET) as {
            userId: string;
            platform: string;
        };

        if (!decoded.userId || decoded.platform !== "instagram") {
            return res.redirect(buildFrontendRedirect("error=instagram_invalid_state"));
        }

        userId = decoded.userId;
    } catch {
        return res.redirect(buildFrontendRedirect("error=instagram_invalid_state"));
    }

    try {
        // STEP 1: Exchange code for short-lived user access token
        const tokenRes = await axios.get(
            `https://graph.facebook.com/${FACEBOOK_GRAPH_VERSION}/oauth/access_token`,
            {
                params: {
                    client_id: FACEBOOK_APP_ID,
                    client_secret: FACEBOOK_APP_SECRET,
                    redirect_uri: INSTAGRAM_REDIRECT_URI,
                    code: code as string,
                },
            }
        );

        const userAccessToken = tokenRes.data?.access_token;

        if (!userAccessToken) {
            throw new Error("Facebook user access token not returned");
        }

        // Optional: debug scopes
        try {
            const debugRes = await axios.get(
                `https://graph.facebook.com/debug_token`,
                {
                    params: {
                        input_token: userAccessToken,
                        access_token: `${FACEBOOK_APP_ID}|${FACEBOOK_APP_SECRET}`,
                    },
                }
            );
            console.log(
                "[Instagram Callback] ACTUAL Scopes on Token:",
                JSON.stringify(debugRes.data?.data?.scopes, null, 2)
            );
            console.log(
                "[Instagram Callback] Data Access Expires At:",
                debugRes.data?.data?.data_access_expires_at
            );
        } catch (e: any) {
            console.log("[Instagram Callback] Failed to debug token scopes:", e.message);
        }

        // STEP 2: Get the user's Facebook Pages
        const pagesRes = await axios.get(
            `https://graph.facebook.com/${FACEBOOK_GRAPH_VERSION}/me/accounts`,
            {
                params: {
                    access_token: userAccessToken,
                },
            }
        );

        console.log(
            "[Instagram Callback] /me/accounts response:",
            JSON.stringify(pagesRes.data, null, 2)
        );

        const pages = (pagesRes.data?.data || []) as FacebookPage[];

        if (!pages.length) {
            throw new Error("No Facebook pages found for this account");
        }

        let igUserId = "";
        let accountName = "Instagram Account";
        let pageAccessToken = "";
        let foundPageId = "";

        // STEP 3: Find a page with a linked Instagram account
        for (const page of pages) {
            if (!page.id || !page.access_token) continue;

            try {
                const pageDetailRes = await axios.get(
                    `https://graph.facebook.com/${FACEBOOK_GRAPH_VERSION}/${page.id}`,
                    {
                        params: {
                            fields:
                                "id,name,connected_instagram_account{id,username},instagram_business_account{id,username,name}",
                            access_token: page.access_token,
                        },
                    }
                );

                console.log(
                    "[Instagram Callback] Page detail:",
                    JSON.stringify(pageDetailRes.data, null, 2)
                );

                const ig =
                    pageDetailRes.data?.instagram_business_account ||
                    pageDetailRes.data?.connected_instagram_account;

                if (ig?.id) {
                    igUserId = String(ig.id);
                    accountName =
                        ig.username || ig.name || page.name || "Instagram Account";
                    pageAccessToken = page.access_token;
                    foundPageId = page.id;
                    break;
                }
            } catch (pageErr: any) {
                console.warn(
                    `[Instagram Callback] Failed to inspect page ${page.id}:`,
                    pageErr?.response?.data || pageErr?.message
                );
            }
        }

        if (!igUserId || !pageAccessToken) {
            throw new Error(
                "No Instagram business/creator account linked to any Facebook page"
            );
        }

        // STEP 4: Upsert into DB
        const existing = await prisma.socialAccount.findFirst({
            where: {
                userId,
                platform: "instagram",
                platformUserId: igUserId,
            },
        });

        if (existing) {
            await prisma.socialAccount.update({
                where: { id: existing.id },
                data: {
                    accountName,
                    accessToken: pageAccessToken,
                    platformUserId: igUserId,
                    status: "active",
                },
            });
        } else {
            await prisma.socialAccount.create({
                data: {
                    userId,
                    platform: "instagram",
                    accountName,
                    accessToken: pageAccessToken,
                    platformUserId: igUserId,
                    status: "active",
                },
            });
        }

        return res.redirect(buildFrontendRedirect("success=instagram_connected"));
    } catch (err: any) {
        console.error("[Instagram Callback] Error:", err?.response?.data || err);

        const detail =
            err?.response?.data?.error?.message ||
            err?.response?.data?.message ||
            err?.message ||
            "Instagram callback failed";

        return res.redirect(
            buildFrontendRedirect(
                `error=instagram_token_exchange_failed&detail=${encodeURIComponent(
                    detail
                )}`
            )
        );
    }
};