import { Request, Response } from "express";
import axios from "axios";
import { twitterOauthStore } from "./twitter.oauth";
import { getFrontendAccountsUrl } from "../../utils/oauth.utils";
import { saveSocialAccount } from "../../services/accounts/saveSocialAccount";

export const twitterCallback = async (req: Request, res: Response) => {
  try {
    const code = String(req.query.code || "");
    const state = String(req.query.state || "");

    if (!code || !state) {
      return res.redirect(getFrontendAccountsUrl("error=twitter_oauth_failed"));
    }

    const session = twitterOauthStore.get(state);

    if (!session) {
      return res.redirect(getFrontendAccountsUrl("error=twitter_invalid_state"));
    }

    if (
      !process.env.X_CLIENT_ID ||
      !process.env.X_CLIENT_SECRET ||
      !process.env.X_REDIRECT_URI
    ) {
      return res.redirect(getFrontendAccountsUrl("error=twitter_env_missing"));
    }

    const basicAuth = Buffer.from(
      `${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`
    ).toString("base64");

    const tokenParams = new URLSearchParams({
      code,
      grant_type: "authorization_code",
      redirect_uri: process.env.X_REDIRECT_URI,
      code_verifier: session.codeVerifier,
      client_id: process.env.X_CLIENT_ID,
    });

    console.log("[Twitter Callback] Exchanging token...");
    console.log("[Twitter Callback] redirect_uri:", process.env.X_REDIRECT_URI);

    const tokenResponse = await axios.post(
      "https://api.twitter.com/2/oauth2/token",
      tokenParams.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${basicAuth}`,
        },
      }
    );

    const accessToken = tokenResponse.data?.access_token;
    const refreshToken = tokenResponse.data?.refresh_token || null;
    const expiresIn = tokenResponse.data?.expires_in || null;

    if (!accessToken) {
      return res.redirect(
        getFrontendAccountsUrl("error=twitter_token_exchange_failed")
      );
    }

    const meResponse = await axios.get("https://api.twitter.com/2/users/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        "user.fields": "id,name,username",
      },
    });

    const profile = meResponse.data?.data;

    if (!profile?.id) {
      return res.redirect(
        getFrontendAccountsUrl("error=twitter_profile_fetch_failed")
      );
    }

    const savedAccount = await saveSocialAccount({
      userId: session.userId,
      platform: "twitter",
      accountName: profile.username || profile.name || "twitter_user",
      accessToken,
      refreshToken,
      platformUserId: String(profile.id),
      pageId: null,
      instagramBusinessAccountId: null,
      tokenExpiresAt: expiresIn
        ? new Date(Date.now() + Number(expiresIn) * 1000)
        : null,
    });

    console.log("Twitter account saved:", savedAccount.id);

    twitterOauthStore.delete(state);

    return res.redirect(getFrontendAccountsUrl("success=twitter_connected"));
  } catch (error: any) {
    console.error(
      "twitterCallback error:",
      error?.response?.data || error?.message || error
    );

    return res.redirect(getFrontendAccountsUrl("error=twitter_oauth_failed"));
  }
};