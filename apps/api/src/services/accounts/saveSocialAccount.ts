import prisma from "database/src/index";

type SaveSocialAccountInput = {
  userId: string;
  platform: string;
  accountName: string;
  accessToken: string;
  refreshToken?: string | null;
  platformUserId: string;
  pageId?: string | null;
  instagramBusinessAccountId?: string | null;
  tokenExpiresAt?: Date | null;
};

export async function saveSocialAccount(input: SaveSocialAccountInput) {
  const existing = await prisma.socialAccount.findFirst({
    where: {
      userId: input.userId,
      platform: input.platform,
      platformUserId: input.platformUserId,
    },
  });

  if (existing) {
    return prisma.socialAccount.update({
      where: { id: existing.id },
      data: {
        accountName: input.accountName,
        accessToken: input.accessToken,
        refreshToken: input.refreshToken || null,
        pageId: input.pageId || null,
        instagramBusinessAccountId: input.instagramBusinessAccountId || null,
        tokenExpiresAt: input.tokenExpiresAt || null,
        status: "active",
      },
    });
  }

  const count = await prisma.socialAccount.count({
    where: {
      userId: input.userId,
      platform: input.platform,
    },
  });

  if (count >= 10) {
    throw new Error(`Maximum 10 ${input.platform} accounts allowed`);
  }

  return prisma.socialAccount.create({
    data: {
      userId: input.userId,
      platform: input.platform,
      accountName: input.accountName,
      accessToken: input.accessToken,
      refreshToken: input.refreshToken || null,
      platformUserId: input.platformUserId,
      pageId: input.pageId || null,
      instagramBusinessAccountId: input.instagramBusinessAccountId || null,
      tokenExpiresAt: input.tokenExpiresAt || null,
      status: "active",
    },
  });
}