import { Request, Response } from "express";
import prisma from "database/src/index";
import {
  ALLOWED_PLATFORMS,
  MAX_ACCOUNTS_PER_PLATFORM,
  isAllowedPlatform,
  normalizePlatform,
} from "../utils/accountLimits";
import { saveSocialAccount } from "../services/accounts/saveSocialAccount";

type AuthRequest = Request & {
  user?: {
    userId?: string;
    id?: string;
    email?: string;
  };
};

function getUserId(req: AuthRequest) {
  return req.user?.userId || req.user?.id || null;
}

export const getAccounts = async (req: AuthRequest, res: Response) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const accounts = await prisma.socialAccount.findMany({
      where: { userId },
      orderBy: [{ platform: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        platform: true,
        accountName: true,
        platformUserId: true,
        pageId: true,
        instagramBusinessAccountId: true,
        tokenExpiresAt: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const grouped = ALLOWED_PLATFORMS.reduce((acc, platform) => {
      acc[platform] = accounts.filter(
        (account) => account.platform === platform
      );
      return acc;
    }, {} as Record<string, typeof accounts>);

    const summary = ALLOWED_PLATFORMS.map((platform) => {
      const platformAccounts = grouped[platform] || [];

      return {
        platform,
        connected: platformAccounts.length,
        limit: MAX_ACCOUNTS_PER_PLATFORM,
        remaining: Math.max(
          MAX_ACCOUNTS_PER_PLATFORM - platformAccounts.length,
          0
        ),
        active: platformAccounts.filter((a) => a.status === "active").length,
        needsReconnect: platformAccounts.filter(
          (a) => a.status === "needs_reconnect"
        ).length,
        expired: platformAccounts.filter((a) => a.status === "expired").length,
        failed: platformAccounts.filter((a) => a.status === "failed").length,
      };
    });

    return res.status(200).json({
      success: true,
      accounts,
      grouped,
      summary,
      maxAccountsPerPlatform: MAX_ACCOUNTS_PER_PLATFORM,
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

export const getAccountById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const account = await prisma.socialAccount.findFirst({
      where: { id, userId },
      select: {
        id: true,
        platform: true,
        accountName: true,
        platformUserId: true,
        pageId: true,
        instagramBusinessAccountId: true,
        tokenExpiresAt: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    return res.status(200).json({
      success: true,
      account,
    });
  } catch (error: any) {
    console.error("getAccountById error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch account",
      error: error.message,
    });
  }
};

export const connectAccount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const {
      platform,
      accountName,
      accessToken,
      refreshToken,
      platformUserId,
      pageId,
      instagramBusinessAccountId,
      tokenExpiresAt,
    } = req.body;

    if (!platform || typeof platform !== "string") {
      return res.status(400).json({
        success: false,
        message: "Platform is required",
      });
    }

    const normalizedPlatform = normalizePlatform(platform);

    if (!isAllowedPlatform(normalizedPlatform)) {
      return res.status(400).json({
        success: false,
        message: `Invalid platform. Allowed platforms: ${ALLOWED_PLATFORMS.join(
          ", "
        )}`,
      });
    }

    if (!accountName || typeof accountName !== "string") {
      return res.status(400).json({
        success: false,
        message: "Account name is required",
      });
    }

    if (!platformUserId || typeof platformUserId !== "string") {
      return res.status(400).json({
        success: false,
        message: "platformUserId is required",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const savedAccount = await saveSocialAccount({
      userId,
      platform: normalizedPlatform,
      accountName: accountName.trim(),
      accessToken:
        accessToken || `test-token-${normalizedPlatform}-${Date.now()}`,
      refreshToken: refreshToken || null,
      platformUserId,
      pageId: pageId || null,
      instagramBusinessAccountId: instagramBusinessAccountId || null,
      tokenExpiresAt: tokenExpiresAt ? new Date(tokenExpiresAt) : null,
    });

    return res.status(200).json({
      success: true,
      message: `${normalizedPlatform} account connected successfully`,
      account: savedAccount,
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

export const updateAccountStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { status } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const allowedStatuses = [
      "active",
      "expired",
      "revoked",
      "needs_reconnect",
      "failed",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed: ${allowedStatuses.join(", ")}`,
      });
    }

    const existingAccount = await prisma.socialAccount.findFirst({
      where: { id, userId },
    });

    if (!existingAccount) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    const updated = await prisma.socialAccount.update({
      where: { id },
      data: { status },
    });

    return res.status(200).json({
      success: true,
      message: "Account status updated",
      account: updated,
    });
  } catch (error: any) {
    console.error("updateAccountStatus error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update account status",
      error: error.message,
    });
  }
};

export const deleteAccount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = getUserId(req);
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