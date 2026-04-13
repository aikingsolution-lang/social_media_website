// import { Request, Response } from "express";
// import jwt from "jsonwebtoken";
// import crypto from "crypto";
// import prisma from "database/src/index";

// /**
//  * Dev-only in-memory store.
//  * In production, move this to Redis/database with expiry.
//  */
// type TwitterOauthSession = {
//     userId: string;
//     codeVerifier: string;
//     createdAt: number;
// };

// export const twitterOauthStore = new Map<string, TwitterOauthSession>();

// function base64UrlEncode(buffer: Buffer) {
//     return buffer
//         .toString("base64")
//         .replace(/\+/g, "-")
//         .replace(/\//g, "_")
//         .replace(/=+$/g, "");
// }

// function generateCodeVerifier() {
//     return base64UrlEncode(crypto.randomBytes(64));
// }

// function generateCodeChallenge(codeVerifier: string) {
//     const hash = crypto.createHash("sha256").update(codeVerifier).digest();
//     return base64UrlEncode(hash);
// }

// function getFrontendAccountsUrl(query: string) {
//     const frontendBase =
//         process.env.FRONTEND_URL ||
//         process.env.NEXT_PUBLIC_APP_URL ||
//         "http://localhost:3000";

//     return `${frontendBase}/dashboard/accounts?${query}`;
// }

// function cleanupExpiredOauthSessions() {
//     const now = Date.now();
//     const maxAgeMs = 10 * 60 * 1000; // 10 minutes

//     for (const [state, session] of twitterOauthStore.entries()) {
//         if (now - session.createdAt > maxAgeMs) {
//             twitterOauthStore.delete(state);
//         }
//     }
// }

// export const twitterAuth = async (req: Request, res: Response) => {
//     try {
//         cleanupExpiredOauthSessions();

//         const token = String(req.query.token || "");

//         if (!token) {
//             return res.status(400).json({
//                 success: false,
//                 message: "JWT token is required in query param ?token=",
//             });
//         }

//         const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
//             userId?: string;
//             id?: string;
//             email?: string;
//         };

//         const userId = decoded.userId || decoded.id;

//         if (!userId) {
//             return res.status(401).json({
//                 success: false,
//                 message: "Invalid JWT token",
//             });
//         }

//         if (!process.env.X_CLIENT_ID || !process.env.X_REDIRECT_URI) {
//             return res.status(500).json({
//                 success: false,
//                 message: "Missing X OAuth env configuration",
//             });
//         }

//         const state = crypto.randomBytes(24).toString("hex");
//         const codeVerifier = generateCodeVerifier();
//         const codeChallenge = generateCodeChallenge(codeVerifier);

//         twitterOauthStore.set(state, {
//             userId,
//             codeVerifier,
//             createdAt: Date.now(),
//         });

//         const scopes = [
//             "tweet.read",
//             "tweet.write",
//             "users.read",
//             "offline.access",
//         ].join(" ");

//         const params = new URLSearchParams({
//             response_type: "code",
//             client_id: process.env.X_CLIENT_ID,
//             redirect_uri: process.env.X_REDIRECT_URI,
//             scope: scopes,
//             state,
//             code_challenge: codeChallenge,
//             code_challenge_method: "S256",
//         });

//         const authUrl = `https://twitter.com/i/oauth2/authorize?${params.toString()}`;

//         return res.redirect(authUrl);
//     } catch (error: any) {
//         console.error("twitterAuth error:", error?.message || error);
//         return res.status(500).json({
//             success: false,
//             message: "Failed to start Twitter OAuth",
//             error: error?.message || "Unknown error",
//         });
//     }
// };

// export const twitterCallback = async (req: Request, res: Response) => {
//     try {
//         cleanupExpiredOauthSessions();

//         const code = String(req.query.code || "");
//         const state = String(req.query.state || "");
//         const error = String(req.query.error || "");
//         const errorDescription = String(req.query.error_description || "");

//         if (error) {
//             console.error("Twitter OAuth denied:", error, errorDescription);
//             return res.redirect(getFrontendAccountsUrl("error=oauth_denied"));
//         }

//         if (!code || !state) {
//             return res.redirect(getFrontendAccountsUrl("error=twitter_oauth_failed"));
//         }

//         const session = twitterOauthStore.get(state);

//         if (!session) {
//             return res.redirect(getFrontendAccountsUrl("error=invalid_state"));
//         }

//         twitterOauthStore.delete(state);

//         if (
//             !process.env.X_CLIENT_ID ||
//             !process.env.X_CLIENT_SECRET ||
//             !process.env.X_REDIRECT_URI
//         ) {
//             console.error("Missing X env vars");
//             return res.redirect(
//                 getFrontendAccountsUrl("error=twitter_token_exchange_failed")
//             );
//         }

//         const basicAuth = Buffer.from(
//             `${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`
//         ).toString("base64");

//         const tokenBody = new URLSearchParams({
//             code,
//             grant_type: "authorization_code",
//             client_id: process.env.X_CLIENT_ID,
//             redirect_uri: process.env.X_REDIRECT_URI,
//             code_verifier: session.codeVerifier,
//         });

//         const tokenResponse = await fetch("https://api.twitter.com/2/oauth2/token", {
//             method: "POST",
//             headers: {
//                 Authorization: `Basic ${basicAuth}`,
//                 "Content-Type": "application/x-www-form-urlencoded",
//             },
//             body: tokenBody.toString(),
//         });

//         const tokenData: any = await tokenResponse.json();

//         if (!tokenResponse.ok || !tokenData?.access_token) {
//             console.error("Twitter token exchange failed:", tokenData);
//             return res.redirect(
//                 getFrontendAccountsUrl("error=twitter_token_exchange_failed")
//             );
//         }

//         const accessToken = tokenData.access_token as string;
//         const refreshToken = (tokenData.refresh_token as string | undefined) || null;

//         const profileResponse = await fetch(
//             "https://api.twitter.com/2/users/me?user.fields=id,name,username,profile_image_url",
//             {
//                 method: "GET",
//                 headers: {
//                     Authorization: `Bearer ${accessToken}`,
//                 },
//             }
//         );

//         const profileData: any = await profileResponse.json();

//         if (!profileResponse.ok || !profileData?.data?.id) {
//             console.error("Twitter profile fetch failed:", profileData);
//             return res.redirect(getFrontendAccountsUrl("error=twitter_oauth_failed"));
//         }

//         const twitterUser = profileData.data;
//         const platformUserId = String(twitterUser.id);
//         const accountName = twitterUser.username || twitterUser.name || "twitter_user";

//         await prisma.socialAccount.upsert({
//             where: {
//                 userId_platform_platformUserId: {
//                     userId: session.userId,
//                     platform: "twitter",
//                     platformUserId,
//                 },
//             },
//             update: {
//                 accountName,
//                 accessToken,
//                 refreshToken,
//                 status: "active",
//             },
//             create: {
//                 userId: session.userId,
//                 platform: "twitter",
//                 accountName,
//                 accessToken,
//                 refreshToken,
//                 platformUserId,
//                 status: "active",
//             },
//         });

//         return res.redirect(getFrontendAccountsUrl("success=twitter_connected"));
//     } catch (error: any) {
//         console.error("twitterCallback error:", error?.message || error);
//         return res.redirect(getFrontendAccountsUrl("error=twitter_oauth_failed"));
//     }
// };

import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import prisma from "database/src/index";

/**
 * Dev-only in-memory store.
 * In production, move this to Redis/database with expiry.
 */
type TwitterOauthSession = {
    userId: string;
    codeVerifier: string;
    createdAt: number;
};

export const twitterOauthStore = new Map<string, TwitterOauthSession>();

function base64UrlEncode(buffer: Buffer) {
    return buffer
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
}

function generateCodeVerifier() {
    return base64UrlEncode(crypto.randomBytes(64));
}

function generateCodeChallenge(codeVerifier: string) {
    const hash = crypto.createHash("sha256").update(codeVerifier).digest();
    return base64UrlEncode(hash);
}

function getFrontendAccountsUrl(query: string) {
    const frontendBase =
        process.env.FRONTEND_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        "http://localhost:3000";

    return `${frontendBase}/dashboard/accounts?${query}`;
}

function cleanupExpiredOauthSessions() {
    const now = Date.now();
    const maxAgeMs = 10 * 60 * 1000;

    for (const [state, session] of twitterOauthStore.entries()) {
        if (now - session.createdAt > maxAgeMs) {
            twitterOauthStore.delete(state);
        }
    }
}

export const twitterAuth = async (req: Request, res: Response) => {
    try {
        cleanupExpiredOauthSessions();

        const token = String(req.query.token || "");

        if (!token) {
            return res.status(400).json({
                success: false,
                message: "JWT token is required in query param ?token=",
            });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                success: false,
                message: "JWT_SECRET is missing in .env",
            });
        }

        if (!process.env.X_CLIENT_ID || !process.env.X_REDIRECT_URI) {
            return res.status(500).json({
                success: false,
                message: "Missing X OAuth env configuration",
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET) as {
            userId?: string;
            id?: string;
            email?: string;
        };

        const userId = decoded.userId || decoded.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Invalid JWT token",
            });
        }

        const state = crypto.randomBytes(24).toString("hex");
        const codeVerifier = generateCodeVerifier();
        const codeChallenge = generateCodeChallenge(codeVerifier);

        twitterOauthStore.set(state, {
            userId,
            codeVerifier,
            createdAt: Date.now(),
        });

        const scopes = [
            "tweet.read",
            "tweet.write",
            "users.read",
            "offline.access",
        ].join(" ");

        const params = new URLSearchParams({
            response_type: "code",
            client_id: process.env.X_CLIENT_ID,
            redirect_uri: process.env.X_REDIRECT_URI,
            scope: scopes,
            state,
            code_challenge: codeChallenge,
            code_challenge_method: "S256",
        });

        const authUrl = `https://twitter.com/i/oauth2/authorize?${params.toString()}`;

        return res.redirect(authUrl);
    } catch (error: any) {
        console.error("twitterAuth error:", error?.message || error);
        return res.status(500).json({
            success: false,
            message: "Failed to start Twitter OAuth",
            error: error?.message || "Unknown error",
        });
    }
};

export const twitterCallback = async (req: Request, res: Response) => {
    try {
        cleanupExpiredOauthSessions();

        const code = String(req.query.code || "");
        const state = String(req.query.state || "");
        const error = String(req.query.error || "");
        const errorDescription = String(req.query.error_description || "");

        if (error) {
            console.error("Twitter OAuth denied:", error, errorDescription);
            return res.redirect(getFrontendAccountsUrl("error=oauth_denied"));
        }

        if (!code || !state) {
            return res.redirect(getFrontendAccountsUrl("error=twitter_oauth_failed"));
        }

        const session = twitterOauthStore.get(state);

        if (!session) {
            return res.redirect(getFrontendAccountsUrl("error=invalid_state"));
        }

        twitterOauthStore.delete(state);

        if (
            !process.env.X_CLIENT_ID ||
            !process.env.X_CLIENT_SECRET ||
            !process.env.X_REDIRECT_URI
        ) {
            console.error("Missing X env vars");
            return res.redirect(
                getFrontendAccountsUrl("error=twitter_token_exchange_failed")
            );
        }

        const basicAuth = Buffer.from(
            `${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`
        ).toString("base64");

        const tokenBody = new URLSearchParams({
            code,
            grant_type: "authorization_code",
            client_id: process.env.X_CLIENT_ID,
            redirect_uri: process.env.X_REDIRECT_URI,
            code_verifier: session.codeVerifier,
        });

        const tokenResponse = await fetch("https://api.twitter.com/2/oauth2/token", {
            method: "POST",
            headers: {
                Authorization: `Basic ${basicAuth}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: tokenBody.toString(),
        });

        const tokenData: any = await tokenResponse.json();

        if (!tokenResponse.ok || !tokenData?.access_token) {
            console.error("Twitter token exchange failed:", tokenData);
            return res.redirect(
                getFrontendAccountsUrl("error=twitter_token_exchange_failed")
            );
        }

        const accessToken = tokenData.access_token as string;
        const refreshToken = (tokenData.refresh_token as string | undefined) || null;

        const profileResponse = await fetch(
            "https://api.twitter.com/2/users/me?user.fields=id,name,username,profile_image_url",
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        const profileData: any = await profileResponse.json();

        if (!profileResponse.ok || !profileData?.data?.id) {
            console.error("Twitter profile fetch failed:", profileData);
            return res.redirect(getFrontendAccountsUrl("error=twitter_oauth_failed"));
        }

        const twitterUser = profileData.data;
        const platformUserId = String(twitterUser.id);
        const accountName = twitterUser.username || twitterUser.name || "twitter_user";

        await prisma.socialAccount.upsert({
            where: {
                userId_platform_platformUserId: {
                    userId: session.userId,
                    platform: "twitter",
                    platformUserId,
                },
            },
            update: {
                accountName,
                accessToken,
                refreshToken,
                status: "active",
            },
            create: {
                userId: session.userId,
                platform: "twitter",
                accountName,
                accessToken,
                refreshToken,
                platformUserId,
                status: "active",
            },
        });

        return res.redirect(getFrontendAccountsUrl("success=twitter_connected"));
    } catch (error: any) {
        console.error("twitterCallback error:", error?.message || error);
        return res.redirect(getFrontendAccountsUrl("error=twitter_oauth_failed"));
    }
};