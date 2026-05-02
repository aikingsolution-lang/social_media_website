import { Request, Response } from "express";
import axios from "axios";
import jwt from "jsonwebtoken";
import { saveSocialAccount } from "../../services/accounts/saveSocialAccount";

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

    const pagesRes = await axios.get(
      `https://graph.facebook.com/${FACEBOOK_GRAPH_VERSION}/me/accounts`,
      {
        params: {
          access_token: userAccessToken,
          fields: "id,name,access_token",
        },
      }
    );

    const pages = (pagesRes.data?.data || []) as FacebookPage[];

    if (!pages.length) {
      throw new Error("No Facebook pages found for this account");
    }

    const savedAccounts = [];

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

        const ig =
          pageDetailRes.data?.instagram_business_account ||
          pageDetailRes.data?.connected_instagram_account;

        if (!ig?.id) continue;

        const igUserId = String(ig.id);

        const accountName =
          ig.username ||
          ig.name ||
          page.name ||
          "Instagram Account";

        const savedAccount = await saveSocialAccount({
          userId,
          platform: "instagram",
          accountName,
          accessToken: page.access_token,
          refreshToken: null,
          platformUserId: igUserId,
          pageId: String(page.id),
          instagramBusinessAccountId: igUserId,
          tokenExpiresAt: null,
        });

        savedAccounts.push(savedAccount);
      } catch (pageErr: any) {
        console.warn(
          `[Instagram Callback] Failed to inspect page ${page.id}:`,
          pageErr?.response?.data || pageErr?.message
        );
      }
    }

    if (!savedAccounts.length) {
      throw new Error(
        "No Instagram business/creator account linked to any Facebook page"
      );
    }

    return res.redirect(
      buildFrontendRedirect(
        `success=instagram_connected&count=${savedAccounts.length}`
      )
    );
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