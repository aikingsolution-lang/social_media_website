import { Request, Response } from "express";
import prisma from "database/src/index";

export const getPostLogs = async (req: Request, res: Response) => {
    try {
        const { postId } = req.params;

        const logs = await prisma.postLog.findMany({
            where: { postId },
            orderBy: { createdAt: "desc" },
        });

        return res.json({
            success: true,
            logs,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch logs",
        });
    }
};