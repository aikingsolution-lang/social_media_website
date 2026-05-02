import { Request, Response } from "express";
import axios from "axios";
import prisma from "database/src/index";
import jwt from "jsonwebtoken";
import { saveSocialAccount } from "../../services/accounts/saveSocialAccount";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-me";
const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID!;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET!;
const LINKEDIN_REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI!;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

export const linkedinCallback = async (req: Request, res: Response) => {
  const { code, state, error: oauthError } = req.query;

  if (oauthError) {
    console.error("[LinkedIn Callback] OAuth error:", oauthError);
    return res.redirect(
      `${FRONTEND_URL}/dashboard/accounts?error=linkedin_oauth_denied`
    );
  }

  if (!code || !state) {
    return res.redirect(
      `${FRONTEND_URL}/dashboard/accounts?error=linkedin_oauth_failed`
    );
  }

  let userId = "";

  try {
    const decoded = jwt.verify(state as string, JWT_SECRET) as {
      userId: string;
      platform?: string;
    };

    userId = decoded.userId;

    if (!userId) {
      return res.redirect(
        `${FRONTEND_URL}/dashboard/accounts?error=linkedin_invalid_state`
      );
    }

    console.log("[LinkedIn Callback] decoded userId:", userId);
  } catch (error) {
    console.error("[LinkedIn Callback] Invalid state JWT:", error);
    return res.redirect(
      `${FRONTEND_URL}/dashboard/accounts?error=linkedin_invalid_state`
    );
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!existingUser) {
      return res.redirect(
        `${FRONTEND_URL}/login?error=user_not_found_please_login_again`
      );
    }

    const tokenRes = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",
      new URLSearchParams({
        grant_type: "authorization_code",
        code: code as string,
        redirect_uri: LINKEDIN_REDIRECT_URI,
        client_id: LINKEDIN_CLIENT_ID,
        client_secret: LINKEDIN_CLIENT_SECRET,
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const accessToken = tokenRes.data.access_token as string;
    const refreshToken = tokenRes.data.refresh_token || null;
    const expiresIn = tokenRes.data.expires_in;

    const profileRes = await axios.get("https://api.linkedin.com/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const profile = profileRes.data;

    console.log("[LinkedIn Callback] LinkedIn profile:", profile);

    const platformUserId = String(profile.sub || "");

    const accountName =
      profile.name ||
      `${profile.given_name || ""} ${profile.family_name || ""}`.trim() ||
      profile.email ||
      "LinkedIn Account";

    if (!platformUserId) {
      return res.redirect(
        `${FRONTEND_URL}/dashboard/accounts?error=linkedin_profile_failed`
      );
    }

    const savedAccount = await saveSocialAccount({
      userId,
      platform: "linkedin",
      accountName,
      accessToken,
      refreshToken,
      platformUserId,
      tokenExpiresAt: expiresIn
        ? new Date(Date.now() + Number(expiresIn) * 1000)
        : null,
    });

    console.log("[LinkedIn Callback] Saved LinkedIn account:", savedAccount.id);

    return res.redirect(
      `${FRONTEND_URL}/dashboard/accounts?success=linkedin_connected`
    );
  } catch (err: any) {
    console.error(
      "[LinkedIn Callback] Error:",
      err?.response?.data || err?.message || err
    );

    return res.redirect(
      `${FRONTEND_URL}/dashboard/accounts?error=linkedin_token_exchange_failed`
    );
  }
};