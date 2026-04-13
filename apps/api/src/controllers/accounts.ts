import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from 'database/src/index';

const connectSchema = z.object({
  platform: z.string().min(1),
  accountName: z.string().min(1),
  // In a real OAuth flow these would be obtained via code exchange on backend
  // For simulation we accept them or generate dummies
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
});

export const connectAccount = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const parsed = connectSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.format() });
      return;
    }

    const { platform, accountName, accessToken, refreshToken } = parsed.data;

    // Simulate mock tokens if not provided
    const token = accessToken || `mock-access-token-${platform}-${Date.now()}`;
    const refresh = refreshToken || `mock-refresh-token-${platform}-${Date.now()}`;

    const account = await prisma.socialAccount.create({
      data: {
        userId,
        platform,
        accountName,
        accessToken: token,
        refreshToken: refresh,
      },
    });

    res.status(201).json({
      message: 'Account connected successfully',
      account: {
        id: account.id,
        platform: account.platform,
        accountName: account.accountName,
        createdAt: account.createdAt,
      },
    });
  } catch (error) {
    console.error('Connect account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAccounts = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
       res.status(401).json({ error: 'Not authenticated' });
       return;
    }

    const accounts = await prisma.socialAccount.findMany({
      where: { userId },
      select: {
        id: true,
        platform: true,
        accountName: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ accounts });
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteAccount = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;
    const accountId = req.params.id;

    if (!userId) {
       res.status(401).json({ error: 'Not authenticated' });
       return;
    }

    const account = await prisma.socialAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) {
       res.status(404).json({ error: 'Account not found' });
       return;
    }

    if (account.userId !== userId) {
       res.status(403).json({ error: 'Unauthorized to delete this account' });
       return;
    }

    await prisma.socialAccount.delete({
      where: { id: accountId },
    });

    res.json({ message: 'Account disabled successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
