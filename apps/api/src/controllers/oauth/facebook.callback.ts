import { Request, Response } from "express";
import axios from "axios";
import { saveSocialAccount } from "../../services/accounts/saveSocialAccount";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

export const facebookCallback = async (req: Request, res: Response) => {
  try {
    const { code, state, error, error_reason } = req.query as {
      code?: string;
      state?: string;
      error?: string;
      error_reason?: string;
    };

    if (error) {
      const mappedError =
        error_reason === "user_denied"
          ? "facebook_oauth_denied"
          : "facebook_oauth_failed";

      return res.redirect(
        `${FRONTEND_URL}/dashboard/accounts?error=${mappedError}`
      );
    }

    if (!code || !state) {
      return res.redirect(
        `${FRONTEND_URL}/dashboard/accounts?error=facebook_oauth_failed`
      );
    }

    let parsedState: any;

    try {
      parsedState = JSON.parse(
        Buffer.from(state, "base64url").toString("utf8")
      );
    } catch {
      return res.redirect(
        `${FRONTEND_URL}/dashboard/accounts?error=facebook_invalid_state`
      );
    }

    const userId = parsedState?.userId;
    const platform = parsedState?.platform;

    if (!userId || platform !== "facebook") {
      return res.redirect(
        `${FRONTEND_URL}/dashboard/accounts?error=facebook_invalid_state`
      );
    }

    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    const redirectUri = process.env.FACEBOOK_REDIRECT_URI;
    const graphVersion = process.env.FACEBOOK_GRAPH_VERSION || "v25.0";

    if (!appId || !appSecret || !redirectUri) {
      return res.status(500).json({
        success: false,
        message: "Facebook env variables are missing",
      });
    }

    const tokenRes = await axios.get(
      `https://graph.facebook.com/${graphVersion}/oauth/access_token`,
      {
        params: {
          client_id: appId,
          client_secret: appSecret,
          redirect_uri: redirectUri,
          code,
        },
      }
    );

    const userAccessToken = tokenRes.data?.access_token;

    if (!userAccessToken) {
      return res.redirect(
        `${FRONTEND_URL}/dashboard/accounts?error=facebook_token_exchange_failed`
      );
    }

    const pagesRes = await axios.get(
      `https://graph.facebook.com/${graphVersion}/me/accounts`,
      {
        params: {
          access_token: userAccessToken,
          fields: "id,name,access_token",
        },
      }
    );

    const pages = pagesRes.data?.data || [];

    if (!pages.length) {
      return res.redirect(
        `${FRONTEND_URL}/dashboard/accounts?error=no_facebook_pages`
      );
    }

    const savedAccounts = [];

    for (const page of pages) {
      const savedAccount = await saveSocialAccount({
        userId: String(userId),
        platform: "facebook",
        accountName: page.name || "Facebook Page",
        accessToken: page.access_token,
        refreshToken: null,
        platformUserId: String(page.id),
        pageId: String(page.id),
        instagramBusinessAccountId: null,
        tokenExpiresAt: null,
      });

      savedAccounts.push(savedAccount);
    }

    return res.redirect(
      `${FRONTEND_URL}/dashboard/accounts?success=facebook_connected&count=${savedAccounts.length}`
    );
  } catch (error: any) {
    console.error(
      "facebookCallback error:",
      error?.response?.data || error.message
    );

    return res.redirect(
      `${FRONTEND_URL}/dashboard/accounts?error=facebook_oauth_failed`
    );
  }
};