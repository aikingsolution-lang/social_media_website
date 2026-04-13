import axios from 'axios';
import prisma from 'database/src/index';

export const publishToLinkedIn = async (scheduledPostId: string) => {
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
        throw new Error('LinkedIn account not found');
    }

    if (!account.accessToken) {
        throw new Error('Missing LinkedIn access token');
    }

    if (!account.platformUserId) {
        throw new Error('Missing LinkedIn platform user id');
    }

    const author = `urn:li:person:${account.platformUserId.replace('urn:li:person:', '')}`;

    try {
        await axios.post(
            'https://api.linkedin.com/v2/ugcPosts',
            {
                author,
                lifecycleState: 'PUBLISHED',
                specificContent: {
                    'com.linkedin.ugc.ShareContent': {
                        shareCommentary: {
                            text: scheduledPost.caption,
                        },
                        shareMediaCategory: 'NONE',
                    },
                },
                visibility: {
                    'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${account.accessToken}`,
                    'Content-Type': 'application/json',
                    'X-Restli-Protocol-Version': '2.0.0',
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
        console.error('LinkedIn publish error:', error.response?.data || error.message);

        if (error.response?.status === 401) {
            await prisma.scheduledPost.update({
                where: { id: scheduledPostId },
                data: { status: 'FAILED' },
            });
        }

        throw error;
    }
};