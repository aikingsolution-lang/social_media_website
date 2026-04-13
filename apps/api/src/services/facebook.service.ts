import axios from "axios";


const graphVersion = process.env.FACEBOOK_GRAPH_VERSION || "v25.0";

export type PublishFacebookPostInput = {
    pageId: string;
    accessToken: string;
    caption: string;
    mediaUrl?: string | null;
};

export type FacebookPublishResult = {
    id: string;
    post_id?: string;
};

const isVideoUrl = (url: string) => {
    const value = url.toLowerCase();
    return (
        value.endsWith(".mp4") ||
        value.endsWith(".mov") ||
        value.endsWith(".avi") ||
        value.endsWith(".mkv") ||
        value.includes(".mp4?") ||
        value.includes(".mov?") ||
        value.includes("/video")
    );
};

// 🔥 COMMON ERROR HANDLER
const handleFacebookError = (error: any) => {
    console.error(
        "Facebook API Error:",
        error?.response?.data || error.message
    );

    throw new Error(
        error?.response?.data?.error?.message ||
        error.message ||
        "Facebook API Error"
    );
};

// ✅ TEXT POST
export const createFacebookTextPost = async ({
    pageId,
    accessToken,
    caption,
}: {
    pageId: string;
    accessToken: string;
    caption: string;
}): Promise<FacebookPublishResult> => {
    try {
        const url = `https://graph.facebook.com/${graphVersion}/${pageId}/feed`;

        const response = await axios.post(url, null, {
            params: {
                message: caption,
                access_token: accessToken,
            },
        });

        return response.data;
    } catch (error: any) {
        handleFacebookError(error);
        throw error;
    }
};

// ✅ IMAGE POST
export const createFacebookPhotoPost = async ({
    pageId,
    accessToken,
    caption,
    mediaUrl,
}: {
    pageId: string;
    accessToken: string;
    caption: string;
    mediaUrl: string;
}): Promise<FacebookPublishResult> => {
    try {
        const url = `https://graph.facebook.com/${graphVersion}/${pageId}/photos`;

        const response = await axios.post(url, null, {
            params: {
                url: mediaUrl,
                caption,
                access_token: accessToken,
                published: true,
            },
        });

        return response.data;
    } catch (error: any) {
        handleFacebookError(error);
        throw error;
    }
};

// ✅ VIDEO POST (with better timeout + retry ready)
export const createFacebookVideoPost = async ({
    pageId,
    accessToken,
    caption,
    mediaUrl,
}: {
    pageId: string;
    accessToken: string;
    caption: string;
    mediaUrl: string;
}): Promise<FacebookPublishResult> => {
    try {
        const url = `https://graph.facebook.com/${graphVersion}/${pageId}/videos`;

        const response = await axios.post(url, null, {
            params: {
                file_url: mediaUrl,
                description: caption,
                access_token: accessToken,
                published: true,
            },
            timeout: 180000, // 🔥 increased for large videos
        });

        return response.data;
    } catch (error: any) {
        handleFacebookError(error);
        throw error;
    }
};

// 🚀 MAIN ENTRY FUNCTION
export const publishFacebookPost = async ({
    pageId,
    accessToken,
    caption,
    mediaUrl,
}: PublishFacebookPostInput): Promise<FacebookPublishResult> => {
    try {
        // ✅ TEXT
        if (!mediaUrl) {
            return createFacebookTextPost({
                pageId,
                accessToken,
                caption,
            });
        }

        // ✅ VIDEO
        if (isVideoUrl(mediaUrl)) {
            return createFacebookVideoPost({
                pageId,
                accessToken,
                caption,
                mediaUrl,
            });
        }

        // ✅ IMAGE (default)
        return createFacebookPhotoPost({
            pageId,
            accessToken,
            caption,
            mediaUrl,
        });
    } catch (error: any) {
        console.error("publishFacebookPost error:", error.message);
        throw error;
    }
};

export const deleteFacebookPost = async ({
    postId,
    accessToken,
}: {
    postId: string;
    accessToken: string;
}) => {
    const url = `https://graph.facebook.com/v25.0/${postId}`;

    const res = await axios.delete(url, {
        params: {
            access_token: accessToken,
        },
    });

    return res.data;
};