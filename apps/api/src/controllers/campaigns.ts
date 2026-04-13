import { Response } from "express";
import { z } from "zod";
import prisma from "database/src/index";

const createCampaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required"),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  accountIds: z.array(z.string()).optional(),
  videoIds: z.array(z.string()).optional(),
});

const generateScheduleSchema = z.object({
  accountIds: z.array(z.string()).optional(),
  videoIds: z.array(z.string()).optional(),
  startDate: z.string().optional(),
  durationDays: z.number().optional(),
});

const buildCaption = (platform: string, videoTitle: string, dayNumber: number) => {
  const p = platform.toLowerCase();

  if (p === "facebook") {
    return `Job tips to boost your chances—update your resume, tailor each application, and follow up. Day ${dayNumber}: ${videoTitle}`;
  }

  if (p === "linkedin") {
    return `Job search tips that move the needle: sharpen your resume, tailor every application, and follow up with purpose. Day ${dayNumber}: ${videoTitle}`;
  }

  if (p === "instagram") {
    return `Job hunt glow-up: quick tips to stand out and land interviews faster. Day ${dayNumber}: ${videoTitle}`;
  }

  if (p === "youtube") {
    return `New job tips in "${videoTitle}"! Practical career moves to help you land interviews faster. Day ${dayNumber}.`;
  }

  return `Automated post for ${platform} - Day ${dayNumber}: ${videoTitle}`;
};

const getUserIdOrFail = (req: any, res: Response) => {
  const userId = req.user?.userId || req.user?.id;

  if (!userId) {
    res.status(401).json({
      success: false,
      message: "Not authenticated",
    });
    return null;
  }

  return userId;
};

const getDefaultStartDate = () => {
  const date = new Date();
  date.setHours(9, 0, 0, 0);
  return date;
};

const getDefaultEndDate = (startDate: Date) => {
  const end = new Date(startDate);
  end.setDate(end.getDate() + 7);
  end.setHours(18, 0, 0, 0);
  return end;
};

export const createCampaign = async (req: any, res: Response) => {
  try {
    const userId = getUserIdOrFail(req, res);
    if (!userId) return;

    const parsed = createCampaignSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        error: parsed.error.format(),
      });
    }

    const { name, description, startDate, endDate } = parsed.data;

    const finalStartDate = startDate ? new Date(startDate) : getDefaultStartDate();
    const finalEndDate = endDate ? new Date(endDate) : getDefaultEndDate(finalStartDate);

    const campaign = await prisma.campaign.create({
      data: {
        userId,
        name: name.trim(),
        startDate: finalStartDate,
        endDate: finalEndDate,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Campaign created successfully",
      campaign: {
        ...campaign,
        description: description || "",
      },
    });
  } catch (error) {
    console.error("Create campaign error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getCampaigns = async (req: any, res: Response) => {
  try {
    const userId = getUserIdOrFail(req, res);
    if (!userId) return;

    const campaigns = await prisma.campaign.findMany({
      where: { userId },
      include: {
        scheduledPosts: {
          orderBy: { scheduledTime: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      campaigns: campaigns.map((campaign) => ({
        ...campaign,
        description: "",
      })),
    });
  } catch (error) {
    console.error("Get campaigns error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const generateSchedule = async (req: any, res: Response) => {
  try {
    const userId = getUserIdOrFail(req, res);
    if (!userId) return;

    const campaignId = req.params.id;
    const parsed = generateScheduleSchema.safeParse(req.body || {});

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        error: parsed.error.format(),
      });
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { scheduledPosts: true },
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    if (campaign.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized route ownership",
      });
    }

    const requestedAccountIds = parsed.data.accountIds || [];
    const requestedVideoIds = parsed.data.videoIds || [];

    const accounts = await prisma.socialAccount.findMany({
      where: {
        userId,
        ...(requestedAccountIds.length > 0 ? { id: { in: requestedAccountIds } } : {}),
      },
      orderBy: { createdAt: "asc" },
    });

    if (accounts.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No social accounts connected to schedule posts for.",
      });
    }

    const videos = await prisma.video.findMany({
      where: {
        userId,
        ...(requestedVideoIds.length > 0 ? { id: { in: requestedVideoIds } } : {}),
      },
      orderBy: { createdAt: "asc" },
    });

    if (videos.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No videos found to generate schedule.",
      });
    }

    if (campaign.scheduledPosts.length > 0) {
      await prisma.scheduledPost.deleteMany({
        where: { campaignId },
      });
    }

    const campaignStart = parsed.data.startDate
      ? new Date(parsed.data.startDate)
      : new Date(campaign.startDate);

    const durationDays =
      parsed.data.durationDays && parsed.data.durationDays > 0
        ? parsed.data.durationDays
        : Math.max(
          1,
          Math.round(
            (new Date(campaign.endDate).getTime() - new Date(campaign.startDate).getTime()) /
            (1000 * 60 * 60 * 24)
          ) + 1
        );

    const start = new Date(campaignStart);
    start.setHours(0, 0, 0, 0);

    const generatedPosts = [];
    let videoIndex = 0;

    for (let day = 0; day < durationDays; day++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + day);

      for (let accIndex = 0; accIndex < accounts.length; accIndex++) {
        const account = accounts[accIndex];
        const video = videos[(videoIndex + accIndex) % videos.length];

        const scheduledTime = new Date(currentDate);
        const randomHour = 9 + Math.floor(Math.random() * 9);
        const randomMinute = Math.floor(Math.random() * 60);
        scheduledTime.setHours(randomHour, randomMinute, 0, 0);

        const caption = buildCaption(account.platform, video.title, day + 1);

        const post = await prisma.scheduledPost.create({
          data: {
            campaignId: campaign.id,
            accountId: account.id,
            videoId: video.id,
            caption,
            scheduledTime,
            status: "PENDING",
          },
        });

        generatedPosts.push(post);
      }

      videoIndex++;
    }

    return res.status(200).json({
      success: true,
      message: `Successfully generated ${generatedPosts.length} scheduled posts.`,
      posts: generatedPosts,
      totalPosts: generatedPosts.length,
    });
  } catch (error) {
    console.error("Generate schedule error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const publishNextPosts = async (req: any, res: Response) => {
  try {
    const userId = getUserIdOrFail(req, res);
    if (!userId) return;

    const campaignId = req.params.id;

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    if (campaign.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized route ownership",
      });
    }

    const nextPosts = await prisma.scheduledPost.findMany({
      where: {
        campaignId,
        status: "PENDING",
      },
      orderBy: { scheduledTime: "asc" },
      take: 10,
    });

    if (nextPosts.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No pending posts available to publish.",
        updatedCount: 0,
      });
    }

    const ids = nextPosts.map((post) => post.id);

    await prisma.scheduledPost.updateMany({
      where: { id: { in: ids } },
      data: {
        status: "PUBLISHED",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Next 10 posts published successfully",
      updatedCount: ids.length,
    });
  } catch (error) {
    console.error("Publish next posts error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deleteCampaign = async (req: any, res: Response) => {
  try {
    const userId = getUserIdOrFail(req, res);
    if (!userId) return;

    const campaignId = req.params.id;

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { scheduledPosts: true },
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    if (campaign.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to delete this campaign",
      });
    }

    await prisma.scheduledPost.deleteMany({
      where: { campaignId },
    });

    await prisma.campaign.delete({
      where: { id: campaignId },
    });

    return res.status(200).json({
      success: true,
      message: "Campaign and schedule cleared successfully",
    });
  } catch (error) {
    console.error("Delete campaign error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};