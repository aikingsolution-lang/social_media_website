// import { Request, Response } from 'express';
// import { z } from 'zod';
// import prisma from 'database/src/index';

// const uploadSchema = z.object({
//   title: z.string().min(1),
//   niche: z.string().optional(),
//   keywords: z.string().optional(),
// });

// export const uploadVideo = async (req: any, res: Response) => {
//   try {
//     const userId = req.user?.userId;
//     if (!userId) {
//       res.status(401).json({ error: 'Not authenticated' });
//       return;
//     }

//     if (!req.file) {
//       res.status(400).json({ error: 'No video file provided' });
//       return;
//     }

//     const parsed = uploadSchema.safeParse(req.body);
//     if (!parsed.success) {
//       res.status(400).json({ error: parsed.error.format() });
//       return;
//     }

//     const { title, niche, keywords } = parsed.data;

//     // The file is currently saved on disk by multer, so we construct the local path
//     const filePath = `/uploads/${req.file.filename}`;

//     const video = await prisma.video.create({
//       data: {
//         title,
//         niche: niche || null,
//         keywords: keywords || null,
//         filePath,
//         userId,
//       },
//     });

//     res.status(201).json({
//       message: 'Video uploaded successfully',
//       videoId: video.id,
//       filePath,
//     });
//   } catch (error) {
//     console.error('Upload error:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// };

import { Response } from 'express';
import { z } from 'zod';
import prisma from 'database/src/index';

const uploadSchema = z.object({
  title: z.string().min(1),
  niche: z.string().optional(),
  keywords: z.string().optional(),
});

export const uploadVideo = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'No video file provided' });
      return;
    }

    const parsed = uploadSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.format() });
      return;
    }

    const { title, niche, keywords } = parsed.data;
    const filePath = `/uploads/${req.file.filename}`;

    const video = await prisma.video.create({
      data: {
        title,
        niche: niche || null,
        keywords: keywords || null,
        filePath,
        userId,
      },
    });

    res.status(201).json({
      message: 'Video uploaded successfully',
      video: {
        id: video.id,
        title: video.title,
        niche: video.niche,
        keywords: video.keywords,
        filePath: video.filePath,
        createdAt: video.createdAt,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getVideos = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const videos = await prisma.video.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        niche: true,
        keywords: true,
        filePath: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ videos });
  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};