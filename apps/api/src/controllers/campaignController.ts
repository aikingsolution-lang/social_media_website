import prisma from "database/src/index";
import { generateCaption } from "../services/ai.service";
import { postQueue } from "../queues/postQueue";

export async function generateCampaignSchedule(req: any, res: any) {
  try {
    const { campaignId } = req.body;

    if (!campaignId) {
      return res.status(400).json({
        success: false,
        error: "Campaign ID required",
      });
    }

    // 1) Fetch campaign
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: "Campaign not found",
      });
    }

    // 2) Fetch user videos
    const videos = await prisma.video.findMany({
      where: { userId: campaign.userId },
      orderBy: { createdAt: "asc" },
    });

    // 3) Fetch social accounts
    const accounts = await prisma.socialAccount.findMany({
      where: {
        userId: campaign.userId,
        status: "active",
      },
      orderBy: { createdAt: "asc" },
    });

    if (videos.length === 0 || accounts.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Videos or Accounts missing",
      });
    }

    // Optional: clear old pending/queued schedule for this campaign
    await prisma.scheduledPost.deleteMany({
      where: {
        campaignId: campaign.id,
        userId: campaign.userId,
        status: {
          in: ["PENDING", "QUEUED", "FAILED"],
        },
      },
    });

    // 4) Date calculation
    const startDate = new Date(campaign.startDate);
    const endDate = new Date(campaign.endDate);

    const generatedPosts: any[] = [];

    let currentDate = new Date(startDate);
    let videoIndex = 0;

    // 5) Smart scheduling loop
    while (currentDate <= endDate) {
      for (let accIndex = 0; accIndex < accounts.length; accIndex++) {
        const account = accounts[accIndex];

        // Smart video rotation
        const video = videos[(videoIndex + accIndex) % videos.length];

        // Random time (10 AM – 4 PM)
        const scheduledTime = new Date(currentDate);
        const randomHour = Math.floor(Math.random() * 6) + 10;
        const randomMinute = Math.floor(Math.random() * 60);

        scheduledTime.setHours(randomHour, randomMinute, 0, 0);

        // Generate AI caption
        const caption = await generateCaption({
          title: video.title,
          niche: video.niche,
          keywords: video.keywords,
          platform: account.platform,
        });

        const post = await prisma.scheduledPost.create({
          data: {
            userId: campaign.userId, // FIX: required relation
            campaignId: campaign.id,
            videoId: video.id,
            accountId: account.id,
            caption,
            scheduledTime,
            status: "PENDING",
          },
        });

        await postQueue.add(
          "publish-post",
          {
            scheduledPostId: post.id,
            userId: campaign.userId,
            videoId: video.id,
            accountId: account.id,
            caption,
            platform: account.platform,
            scheduledTime: scheduledTime.toISOString(),
          },
          {
            delay: Math.max(new Date(scheduledTime).getTime() - Date.now(), 0),
            attempts: 3,
            backoff: {
              type: "exponential",
              delay: 5000,
            },
            removeOnComplete: true,
            removeOnFail: false,
          }
        );

        generatedPosts.push(post);
      }

      videoIndex++;
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return res.status(200).json({
      success: true,
      totalPosts: generatedPosts.length,
      message: "Schedule generated successfully",
      posts: generatedPosts,
    });
  } catch (error: any) {
    console.error("Schedule generation error:", error);

    return res.status(500).json({
      success: false,
      error: error?.message || "Failed to generate schedule",
    });
  }
}