/*
  Warnings:

  - A unique constraint covering the columns `[userId,platform,platformUserId]` on the table `SocialAccount` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "SocialAccount_userId_platform_platformUserId_key" ON "SocialAccount"("userId", "platform", "platformUserId");
