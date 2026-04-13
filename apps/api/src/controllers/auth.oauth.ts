import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import prisma from "database/src/index";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-me";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

const signUserToken = (user: { id: string; email: string }) => {
  return jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
};

export const googleAuth = (req: Request, res: Response) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || "http://localhost:4000/api/auth/google/callback";
    
    if (!clientId) {
        // Fallback for missing credentials
        return res.redirect(`${FRONTEND_URL}/auth/login?error=Missing+Google+Client+ID`);
    }

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=email profile&access_type=offline&prompt=consent`;
    return res.redirect(authUrl);
};

export const googleCallback = async (req: Request, res: Response) => {
    try {
        const code = req.query.code as string;
        if (!code) {
            return res.redirect(`${FRONTEND_URL}/auth/login?error=Missing+Auth+Code`);
        }

        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const redirectUri = process.env.GOOGLE_REDIRECT_URI || "http://localhost:4000/api/auth/google/callback";

        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: clientId!,
                client_secret: clientSecret!,
                code,
                grant_type: "authorization_code",
                redirect_uri: redirectUri,
            }),
        });
        
        const tokenData = await tokenRes.json();
        
        if (!tokenRes.ok) {
            console.error("Google token error:", tokenData);
            return res.redirect(`${FRONTEND_URL}/auth/login?error=Google+Token+Error`);
        }

        const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });

        const userData = await userRes.json();

        if (!userRes.ok || !userData.email) {
            console.error("Google user error:", userData);
            return res.redirect(`${FRONTEND_URL}/auth/login?error=Google+Profile+Error`);
        }

        let user = await prisma.user.findUnique({ where: { email: userData.email.toLowerCase() } });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    email: userData.email.toLowerCase(),
                    name: userData.name,
                    googleId: userData.id,
                    authProvider: "google"
                }
            });
        } else if (!user.googleId) {
            user = await prisma.user.update({
                where: { id: user.id },
                data: {
                    googleId: userData.id,
                    authProvider: user.authProvider === "local" ? "google" : user.authProvider,
                }
            });
        }

        const token = signUserToken(user);
        return res.redirect(`${FRONTEND_URL}/auth/success?token=${token}`);
    } catch (error: any) {
        console.error("Google Callback Error", error);
        return res.redirect(`${FRONTEND_URL}/auth/login?error=Internal+Server+Error`);
    }
};

export const githubAuth = (req: Request, res: Response) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const redirectUri = process.env.GITHUB_REDIRECT_URI || "http://localhost:4000/api/auth/github/callback";
    
    if (!clientId) {
        return res.redirect(`${FRONTEND_URL}/auth/login?error=Missing+GitHub+Client+ID`);
    }

    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email`;
    return res.redirect(authUrl);
};

export const githubCallback = async (req: Request, res: Response) => {
    try {
        const code = req.query.code as string;
        if (!code) {
            return res.redirect(`${FRONTEND_URL}/auth/login?error=Missing+Auth+Code`);
        }

        const clientId = process.env.GITHUB_CLIENT_ID;
        const clientSecret = process.env.GITHUB_CLIENT_SECRET;
        const redirectUri = process.env.GITHUB_REDIRECT_URI || "http://localhost:4000/api/auth/github/callback";

        const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                code,
                redirect_uri: redirectUri,
            }),
        });
        
        const tokenData = await tokenRes.json();
        
        if (!tokenRes.ok || tokenData.error) {
            console.error("GitHub token error:", tokenData);
            return res.redirect(`${FRONTEND_URL}/auth/login?error=GitHub+Token+Error`);
        }

        const userRes = await fetch("https://api.github.com/user", {
            headers: { 
                Authorization: `Bearer ${tokenData.access_token}`,
                Accept: "application/json"
            },
        });

        const userData = await userRes.json();

        if (!userRes.ok || !userData.id) {
            console.error("GitHub user error:", userData);
            return res.redirect(`${FRONTEND_URL}/auth/login?error=GitHub+Profile+Error`);
        }

        let email = userData.email;

        if (!email) {
            const emailRes = await fetch("https://api.github.com/user/emails", {
                headers: { 
                    Authorization: `Bearer ${tokenData.access_token}`,
                    Accept: "application/json"
                },
            });
            const emailsData = await emailRes.json();
            const primaryEmail = emailsData.find((e: any) => e.primary);
            if (primaryEmail) {
                email = primaryEmail.email;
            } else if (emailsData.length > 0) {
                email = emailsData[0].email;
            }
        }

        if (!email) {
            return res.redirect(`${FRONTEND_URL}/auth/login?error=Missing+GitHub+Email`);
        }

        let user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    email: email.toLowerCase(),
                    name: userData.name || userData.login,
                    githubId: userData.id.toString(),
                    authProvider: "github"
                }
            });
        } else if (!user.githubId) {
            user = await prisma.user.update({
                where: { id: user.id },
                data: {
                    githubId: userData.id.toString(),
                    authProvider: user.authProvider === "local" ? "github" : user.authProvider,
                }
            });
        }

        const token = signUserToken(user);
        return res.redirect(`${FRONTEND_URL}/auth/success?token=${token}`);
    } catch (error: any) {
        console.error("GitHub Callback Error", error);
        return res.redirect(`${FRONTEND_URL}/auth/login?error=Internal+Server+Error`);
    }
};
