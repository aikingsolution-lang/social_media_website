import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";

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

    const token =
      String(req.query.token || "") ||
      req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "JWT token is required in query param ?token=",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "JWT_SECRET missing in .env",
      });
    }

    if (!process.env.X_CLIENT_ID || !process.env.X_REDIRECT_URI) {
      return res.status(500).json({
        success: false,
        message: "X_CLIENT_ID or X_REDIRECT_URI missing in .env",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as {
      userId?: string;
      id?: string;
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

    console.log("[Twitter OAuth] Redirect URL:", authUrl);

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