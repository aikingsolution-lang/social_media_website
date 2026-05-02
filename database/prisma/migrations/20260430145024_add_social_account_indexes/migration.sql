-- CreateIndex
CREATE INDEX "SocialAccount_userId_idx" ON "public"."SocialAccount"("userId");

-- CreateIndex
CREATE INDEX "SocialAccount_platform_idx" ON "public"."SocialAccount"("platform");

-- CreateIndex
CREATE INDEX "SocialAccount_status_idx" ON "public"."SocialAccount"("status");
