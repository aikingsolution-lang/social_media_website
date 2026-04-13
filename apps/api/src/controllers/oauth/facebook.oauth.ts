import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";

export const facebookAuth = async (req: Request, res: Response) => {
    try {
        const appToken = req.query.token as string;

        if (!appToken) {
            return res.status(400).json({
                success: false,
                message: "Missing app token in query",
            });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                success: false,
                message: "JWT_SECRET is missing in .env",
            });
        }

        const decoded = jwt.verify(appToken, process.env.JWT_SECRET) as {
            userId?: string;
            id?: string;
        };

        const userId = decoded.userId || decoded.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Invalid user token payload",
            });
        }

        const appId = process.env.FACEBOOK_APP_ID;
        const redirectUri = process.env.FACEBOOK_REDIRECT_URI;
        const graphVersion = process.env.FACEBOOK_GRAPH_VERSION || "v25.0";

        if (!appId || !redirectUri) {
            return res.status(500).json({
                success: false,
                message: "Facebook OAuth env variables are missing",
            });
        }

        const statePayload = {
            userId,
            platform: "facebook",
            nonce: crypto.randomBytes(16).toString("hex"),
            ts: Date.now(),
        };

        const state = Buffer.from(JSON.stringify(statePayload)).toString("base64url");

        const scopes = [
            "pages_show_list",
            "pages_read_engagement",
            "pages_manage_posts",
        ].join(",");

        const authUrl =
            `https://www.facebook.com/${graphVersion}/dialog/oauth` +
            `?client_id=${encodeURIComponent(appId)}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&state=${encodeURIComponent(state)}` +
            `&scope=${encodeURIComponent(scopes)}`;

        return res.redirect(authUrl);
    } catch (error: any) {
        console.error("facebookAuth error:", error?.response?.data || error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to start Facebook OAuth",
            error: error.message,
        });
    }
};