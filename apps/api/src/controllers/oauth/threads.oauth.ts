import { Request, Response } from "express";
import jwt from "jsonwebtoken";

export const threadsAuth = async (req: Request, res: Response) => {
    try {
        const token = req.query.token as string;

        if (!token) {
            return res.status(400).json({ error: "Token missing" });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ error: "JWT_SECRET is missing" });
        }

        if (!process.env.THREADS_APP_ID || !process.env.THREADS_REDIRECT_URI) {
            return res.status(500).json({
                error: "THREADS_APP_ID or THREADS_REDIRECT_URI is missing",
            });
        }

        const decoded: any = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId || decoded.id;

        if (!userId) {
            return res.status(401).json({ error: "Invalid token payload" });
        }

        const state = Buffer.from(
            JSON.stringify({ userId, platform: "threads" }),
            "utf8"
        ).toString("base64url");

        const authUrl =
            `https://threads.net/oauth/authorize` +
            `?client_id=${encodeURIComponent(process.env.THREADS_APP_ID)}` +
            `&redirect_uri=${encodeURIComponent(process.env.THREADS_REDIRECT_URI)}` +
            `&scope=${encodeURIComponent("threads_basic,threads_content_publish")}` +
            `&response_type=code` +
            `&state=${encodeURIComponent(state)}`;

        console.log("THREADS AUTH URL:", authUrl);

        return res.redirect(authUrl);
    } catch (error) {
        console.error("Threads OAuth start error:", error);
        return res.status(500).json({ error: "Failed to start Threads OAuth" });
    }
};