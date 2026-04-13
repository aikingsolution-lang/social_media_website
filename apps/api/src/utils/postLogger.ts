import prisma from "database/src/index";

export const logPostAction = async (
    postId: string,
    action: string,
    message?: string
) => {
    try {
        await prisma.postLog.create({
            data: {
                postId,
                action,
                message,
            },
        });
    } catch (error) {
        console.error("PostLog error:", error);
    }
};