import { Request, Response } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-me";
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || "";
const INSTAGRAM_REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI || "";
const FACEBOOK_GRAPH_VERSION = process.env.FACEBOOK_GRAPH_VERSION || "v25.0";
const FACEBOOK_LOGIN_FOR_BUSINESS_CONFIG_ID =
    process.env.FACEBOOK_LOGIN_FOR_BUSINESS_CONFIG_ID || "";

export const instagramAuth = async (req: Request, res: Response) => {
    try {
        if (
            !FACEBOOK_APP_ID ||
            !INSTAGRAM_REDIRECT_URI ||
            !FACEBOOK_LOGIN_FOR_BUSINESS_CONFIG_ID
        ) {
            return res.status(500).json({
                success: false,
                message:
                    "Missing FACEBOOK_APP_ID, INSTAGRAM_REDIRECT_URI, or FACEBOOK_LOGIN_FOR_BUSINESS_CONFIG_ID",
            });
        }

        const rawToken =
            (req.query.token as string) ||
            req.headers.authorization?.split(" ")[1];

        if (!rawToken) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
        }

        let userId = "";

        try {
            const decoded = jwt.verify(rawToken, JWT_SECRET) as {
                userId?: string;
                id?: string;
            };

            userId = decoded.userId || decoded.id || "";
        } catch {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired token",
            });
        }

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Invalid token payload",
            });
        }

        const state = jwt.sign(
            { userId, platform: "instagram" },
            JWT_SECRET,
            { expiresIn: "15m" }
        );

        const params = new URLSearchParams({
            client_id: FACEBOOK_APP_ID,
            redirect_uri: INSTAGRAM_REDIRECT_URI,
            response_type: "code",
            state,
            // Using explicit scope instead of config_id to force permissions
            scope: "instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement,business_management,pages_manage_posts",
            // config_id: FACEBOOK_LOGIN_FOR_BUSINESS_CONFIG_ID,
            auth_type: "rerequest",
        });

        const authUrl = `https://www.facebook.com/${FACEBOOK_GRAPH_VERSION}/dialog/oauth?${params.toString()}`;

        console.log("[Instagram OAuth] Facebook Login for Business URL:", authUrl);

        return res.redirect(authUrl);
    } catch (error: any) {
        console.error("[Instagram OAuth] Error:", error?.message || error);

        return res.status(500).json({
            success: false,
            message: "Failed to start Instagram OAuth",
        });
    }
};