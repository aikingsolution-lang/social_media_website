import { Request, Response } from "express";
import prisma from "database/src/index";

type AuthRequest = Request & {
    user?: {
        userId?: string;
        id?: string;
        email?: string;
    };
};

const allowedPlatforms = [
    "linkedin",
    "instagram",
    "facebook",
    "twitter",
    "threads",
    "youtube",
];

export const getAccounts = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId || req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Not authenticated",
            });
        }

        const accounts = await prisma.socialAccount.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                platform: true,
                accountName: true,
                platformUserId: true,
                status: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return res.status(200).json({
            success: true,
            accounts: accounts.map((account) => ({
                ...account,
                status: (account.status || "active").toLowerCase(),
                followers: "0",
            })),
        });
    } catch (error: any) {
        console.error("getAccounts error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch accounts",
            error: error.message,
        });
    }
};

export const connectAccount = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId || req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User not authenticated",
            });
        }

        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
            },
        });

        if (!existingUser) {
            return res.status(400).json({
                success: false,
                message: "User does not exist in database",
            });
        }

        const { platform, accountName } = req.body;

        if (!platform || typeof platform !== "string") {
            return res.status(400).json({
                success: false,
                message: "Platform is required",
            });
        }

        const normalizedPlatform = platform.toLowerCase().trim();

        if (!allowedPlatforms.includes(normalizedPlatform)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid platform. Allowed values: linkedin, instagram, facebook, twitter, threads, youtube",
            });
        }

        const finalAccountName =
            typeof accountName === "string" && accountName.trim()
                ? accountName.trim()
                : normalizedPlatform;

        const existingAccount = await prisma.socialAccount.findFirst({
            where: {
                userId,
                platform: normalizedPlatform,
                accountName: finalAccountName,
            },
        });

        if (existingAccount) {
            return res.status(409).json({
                success: false,
                message: "Account already connected",
            });
        }

        const newAccount = await prisma.socialAccount.create({
            data: {
                userId,
                platform: normalizedPlatform,
                accountName: finalAccountName,
                accessToken: `mock-token-${normalizedPlatform}-${Date.now()}`,
                refreshToken: null,
                platformUserId: null,
                status: "active",
            },
            select: {
                id: true,
                userId: true,
                platform: true,
                accountName: true,
                status: true,
                createdAt: true,
            },
        });

        return res.status(201).json({
            success: true,
            message: "Account connected successfully",
            account: {
                ...newAccount,
                followers: "0",
            },
        });
    } catch (error: any) {
        console.error("connectAccount error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to connect account",
            error: error.message,
        });
    }
};

export const deleteAccount = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Not authenticated",
            });
        }

        const existingAccount = await prisma.socialAccount.findFirst({
            where: {
                id,
                userId,
            },
        });

        if (!existingAccount) {
            return res.status(404).json({
                success: false,
                message: "Account not found",
            });
        }

        await prisma.socialAccount.delete({
            where: { id },
        });

        return res.status(200).json({
            success: true,
            message: "Account removed successfully",
        });
    } catch (error: any) {
        console.error("deleteAccount error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete account",
            error: error.message,
        });
    }
};