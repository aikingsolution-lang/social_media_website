import axios from 'axios';
import prisma from 'database/src/index';

export const publishToInstagram = async (scheduledPostId: string, publicVideoUrl: string) => {
    const scheduledPost = await prisma.scheduledPost.findUnique({
        where: { id: scheduledPostId },
    });

    if (!scheduledPost) {
        throw new Error('Scheduled post not found');
    }

    const account = await prisma.socialAccount.findUnique({
        where: { id: scheduledPost.accountId },
    });

    if (!account) {
        throw new Error('Instagram account not found');
    }

    if (!account.accessToken) {
        throw new Error('Missing Instagram access token');
    }

    if (!account.instagramBusinessAccountId) {
        throw new Error('Missing Instagram Business Account ID');
    }

    try {
        const createMediaResponse = await axios.post(
            `https://graph.facebook.com/v19.0/${account.instagramBusinessAccountId}/media`,
            null,
            {
                params: {
                    media_type: 'REELS',
                    video_url: publicVideoUrl,
                    caption: scheduledPost.caption,
                    access_token: account.accessToken,
                },
            }
        );

        const creationId = createMediaResponse.data.id;

        await axios.post(
            `https://graph.facebook.com/v19.0/${account.instagramBusinessAccountId}/media_publish`,
            null,
            {
                params: {
                    creation_id: creationId,
                    access_token: account.accessToken,
                },
            }
        );

        await prisma.scheduledPost.update({
            where: { id: scheduledPostId },
            data: {
                status: 'PUBLISHED',
                publishedAt: new Date(),
            },
        });
    } catch (error: any) {
        console.error('Instagram publish error:', error.response?.data || error.message);

        await prisma.scheduledPost.update({
            where: { id: scheduledPostId },
            data: { status: 'FAILED' },
        });

        throw error;
    }
};