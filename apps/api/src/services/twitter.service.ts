import axios from "axios";

type GetTwitterMeParams = {
    accessToken: string;
};

type PublishTwitterPostParams = {
    accessToken: string;
    caption: string;
    mediaUrl?: string | null;
    mediaUrls?: string[];
};

type TwitterMeResponse = {
    id: string;
    name?: string;
    username?: string;
};

type TwitterPublishResponse = {
    data?: {
        id?: string;
        text?: string;
    };
};

const X_API_BASE_URL = process.env.X_API_BASE_URL || "https://api.x.com/2";

export const getTwitterMe = async ({
    accessToken,
}: GetTwitterMeParams): Promise<TwitterMeResponse> => {
    const response = await axios.get(`${X_API_BASE_URL}/users/me`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        params: {
            "user.fields": "id,name,username",
        },
    });

    return response.data?.data;
};

/**
 * Create text-only Twitter/X post
 */
export const createTwitterTextPost = async ({
    accessToken,
    caption,
}: PublishTwitterPostParams): Promise<TwitterPublishResponse> => {
    const response = await axios.post(
        `${X_API_BASE_URL}/tweets`,
        {
            text: caption,
        },
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        }
    );

    return response.data;
};

/**
 * Temporary fallback:
 * Since full X media upload is not wired yet,
 * append public media URL(s) into the tweet text.
 *
 * This keeps scheduler/API/frontend working immediately.
 */
export const createTwitterPostWithPublicMediaUrlFallback = async ({
    accessToken,
    caption,
    mediaUrl,
    mediaUrls,
}: PublishTwitterPostParams): Promise<TwitterPublishResponse> => {
    const allMediaUrls = [
        ...(mediaUrls || []),
        ...(mediaUrl ? [mediaUrl] : []),
    ].filter(Boolean);

    const uniqueMediaUrls = Array.from(new Set(allMediaUrls));

    const text = [caption, ...uniqueMediaUrls].filter(Boolean).join("\n\n").trim();

    const response = await axios.post(
        `${X_API_BASE_URL}/tweets`,
        {
            text,
        },
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        }
    );

    return response.data;
};

export const publishTwitterPost = async ({
    accessToken,
    caption,
    mediaUrl,
    mediaUrls,
}: PublishTwitterPostParams): Promise<TwitterPublishResponse> => {
    const trimmedCaption = caption?.trim() || "";
    const normalizedMediaUrls = (mediaUrls || []).filter(Boolean);
    const hasSingleMedia = Boolean(mediaUrl);
    const hasMultipleMedia = normalizedMediaUrls.length > 0;

    if (!trimmedCaption && !hasSingleMedia && !hasMultipleMedia) {
        throw new Error("caption or mediaUrl/mediaUrls is required");
    }

    if (hasSingleMedia || hasMultipleMedia) {
        return createTwitterPostWithPublicMediaUrlFallback({
            accessToken,
            caption: trimmedCaption,
            mediaUrl: mediaUrl || null,
            mediaUrls: normalizedMediaUrls,
        });
    }

    return createTwitterTextPost({
        accessToken,
        caption: trimmedCaption,
    });
};

export const deleteTwitterPost = async ({
    tweetId,
    accessToken,
}: {
    tweetId: string;
    accessToken: string;
}) => {
    await axios.delete(
        `https://api.twitter.com/2/tweets/${tweetId}`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }
    );
};