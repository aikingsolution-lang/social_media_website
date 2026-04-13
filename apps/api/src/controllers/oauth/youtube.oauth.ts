import { Request, Response } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-me";
const YOUTUBE_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID || "";
const YOUTUBE_REDIRECT_URI = process.env.YOUTUBE_REDIRECT_URI || "";
const GOOGLE_OAUTH_URL =
    process.env.GOOGLE_OAUTH_URL || "https://accounts.google.com/o/oauth2/v2/auth";

export const youtubeAuth = async (req: Request, res: Response) => {
    try {
        const rawToken =
            (req.query.token as string) ||
            req.headers.authorization?.split(" ")[1];

        if (!rawToken) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated",
                hint: "Pass JWT as ?token=<your_jwt>",
            });
        }

        let userId = "";

        try {
            const decoded = jwt.verify(rawToken, JWT_SECRET) as {
                userId?: string;
                id?: string;
            };

            userId = decoded.userId || decoded.id || "";

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid token payload",
                });
            }
        } catch {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired token",
            });
        }

        const state = jwt.sign(
            { userId, platform: "youtube" },
            JWT_SECRET,
            { expiresIn: "15m" }
        );

        const params = new URLSearchParams({
            client_id: YOUTUBE_CLIENT_ID,
            redirect_uri: YOUTUBE_REDIRECT_URI,
            response_type: "code",
            access_type: "offline",
            prompt: "consent",
            include_granted_scopes: "true",
            scope: [
                "https://www.googleapis.com/auth/youtube.upload",
                "https://www.googleapis.com/auth/youtube.readonly",
            ].join(" "),
            state,
        });

        return res.redirect(`${GOOGLE_OAUTH_URL}?${params.toString()}`);
    } catch (error: any) {
        console.error("[YouTube OAuth] Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to start YouTube OAuth",
            error: error.message,
        });
    }
};