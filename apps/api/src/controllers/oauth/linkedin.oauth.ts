// // api/src/controllers/oauth/linkedin.oauth.ts
// // HOW IT WORKS:
// //   Frontend calls: GET /api/oauth/linkedin/connect?token=<JWT>
// //   This handler verifies the JWT, extracts userId,
// //   creates a signed state param, then redirects to LinkedIn.

// import { Request, Response } from "express";
// import jwt from "jsonwebtoken";

// const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-me";
// const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID || "";
// const LINKEDIN_REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI || "";

// export const linkedinAuth = async (req: Request, res: Response) => {
//   try {
//     // Step 1: Get the user JWT from ?token= query param OR Authorization header
//     // OAuth redirects can't carry headers, so frontend passes token in the URL
//     const rawToken =
//       (req.query.token as string) ||
//       req.headers.authorization?.split(" ")[1];

//     if (!rawToken) {
//       return res.status(401).json({
//         error: "User not authenticated",
//         hint: "Pass your JWT as ?token=<your_jwt> in the URL",
//       });
//     }

//     // Step 2: Verify and decode
//     let userId: string;
//     try {
//       const decoded = jwt.verify(rawToken, JWT_SECRET) as { userId: string };
//       userId = decoded.userId;
//     } catch {
//       return res.status(401).json({ error: "Invalid or expired token" });
//     }

//     // Step 3: Sign a short-lived state JWT with userId
//     // LinkedIn sends this back at callback so we know which user to save to
//     const state = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "15m" });

//     // Step 4: Redirect to LinkedIn
//     const scope = "openid profile email w_member_social";

//     const params = new URLSearchParams({
//       response_type: "code",
//       client_id: LINKEDIN_CLIENT_ID,
//       redirect_uri: LINKEDIN_REDIRECT_URI,
//       state,
//       scope,
//     });

//     const authUrl = `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
//     console.log("LINKEDIN_REDIRECT_URI =", LINKEDIN_REDIRECT_URI);
//     console.log("LinkedIn Auth URL =", authUrl);

//     console.log(`[LinkedIn OAuth] Redirecting userId=${userId} to LinkedIn`);
//     return res.redirect(authUrl);
//   } catch (error: any) {
//     console.error("[LinkedIn OAuth] Error:", error.message);
//     return res.status(500).json({ error: "Failed to start LinkedIn OAuth" });
//   }
// };

import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { getBearerTokenFromQuery } from "../../utils/oauth.utils";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-me";
const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID || "";
const LINKEDIN_REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI || "";

export const linkedinAuth = async (req: Request, res: Response) => {
  try {
    const rawToken = getBearerTokenFromQuery(req);

    if (!rawToken) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
        hint: "Pass JWT as ?token=<your_jwt>",
      });
    }

    const decoded = jwt.verify(rawToken, JWT_SECRET) as { userId?: string; id?: string };
    const userId = decoded.userId || decoded.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    const state = jwt.sign(
      { userId, platform: "linkedin" },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    const params = new URLSearchParams({
      response_type: "code",
      client_id: LINKEDIN_CLIENT_ID,
      redirect_uri: LINKEDIN_REDIRECT_URI,
      state,
      scope: "openid profile email w_member_social",
    });

    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
    return res.redirect(authUrl);
  } catch (error: any) {
    console.error("[LinkedIn OAuth] Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to start LinkedIn OAuth",
    });
  }
};