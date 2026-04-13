import axios from "axios";
import { normalizeAccessToken } from "../utils/normalizeAccessToken";

type PublishThreadsPostInput = {
    userId: string;
    accessToken: string;
    caption: string;
    mediaUrl?: string | null;
    mediaUrls?: string[];
};

const GRAPH_VERSION = "v1.0";
const BASE_URL = `https://graph.threads.net/${GRAPH_VERSION}`;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isVideo(url: string) {
    const cleanUrl = url.split("?")[0].toLowerCase();

    return (
        cleanUrl.endsWith(".mp4") ||
        cleanUrl.endsWith(".mov") ||
        cleanUrl.endsWith(".m4v") ||
        cleanUrl.endsWith(".webm")
    );
}

async function verifyThreadsToken(accessToken: string) {
    const response = await axios.get(`${BASE_URL}/me`, {
        params: {
            fields: "id,username,name",
            access_token: accessToken,
        },
    });

    return response.data;
}

async function getContainerStatus(creationId: string, accessToken: string) {
    const response = await axios.get(`${BASE_URL}/${creationId}`, {
        params: {
            fields: "id,status,error_message",
            access_token: accessToken,
        },
    });

    return response.data;
}

async function createThreadsContainer(
    userId: string,
    accessToken: string,
    payload: Record<string, string>
) {
    const response = await axios.post(`${BASE_URL}/${userId}/threads`, {
        access_token: accessToken,
        ...payload,
    });

    return response.data;
}

async function publishThreadsContainer(
    userId: string,
    accessToken: string,
    creationId: string
) {
    const response = await axios.post(`${BASE_URL}/${userId}/threads_publish`, {
        creation_id: creationId,
        access_token: accessToken,
    });

    return response.data;
}

export const publishThreadsPost = async ({
    userId,
    accessToken,
    caption,
    mediaUrl,
    mediaUrls = [],
}: PublishThreadsPostInput) => {
    try {
        if (!accessToken || typeof accessToken !== "string") {
            throw new Error("Threads access token is missing");
        }

        if (!userId || typeof userId !== "string") {
            throw new Error("Threads userId is missing");
        }

        const trimmedToken = normalizeAccessToken(accessToken);
        const normalizedCaption =
            typeof caption === "string" ? caption.trim() : "";
        const normalizedMediaUrl =
            typeof mediaUrl === "string" && mediaUrl.trim() ? mediaUrl.trim() : null;

        const normalizedMediaUrls = Array.isArray(mediaUrls)
            ? mediaUrls.map((url) => (typeof url === "string" ? url.trim() : "")).filter(Boolean)
            : [];

        if (!trimmedToken) {
            throw new Error("Threads access token is invalid");
        }

        if (
            !normalizedCaption &&
            !normalizedMediaUrl &&
            normalizedMediaUrls.length === 0
        ) {
            throw new Error("Caption or media is required");
        }

        await verifyThreadsToken(trimmedToken);

        // TEXT
        if (!normalizedMediaUrl && normalizedMediaUrls.length === 0) {
            const created = await createThreadsContainer(userId, trimmedToken, {
                media_type: "TEXT",
                text: normalizedCaption,
            });

            const published = await publishThreadsContainer(
                userId,
                trimmedToken,
                created.id
            );

            return {
                id: published?.id,
                creationId: created?.id,
                mediaType: "TEXT",
                creation: created,
                publish: published,
            };
        }

        // CAROUSEL (multiple images only)
        if (normalizedMediaUrls.length > 1) {
            const hasVideo = normalizedMediaUrls.some((url) => isVideo(url));
            if (hasVideo) {
                throw new Error("Threads carousel supports images only in this implementation");
            }

            const childIds: string[] = [];

            for (const imageUrl of normalizedMediaUrls) {
                const child = await createThreadsContainer(userId, trimmedToken, {
                    media_type: "IMAGE",
                    image_url: imageUrl,
                    is_carousel_item: "true",
                });

                childIds.push(child.id);
            }

            const parent = await createThreadsContainer(userId, trimmedToken, {
                media_type: "CAROUSEL",
                text: normalizedCaption,
                children: childIds.join(","),
            });

            await sleep(3000);

            const published = await publishThreadsContainer(
                userId,
                trimmedToken,
                parent.id
            );

            return {
                id: published?.id,
                creationId: parent?.id,
                mediaType: "CAROUSEL",
                creation: parent,
                publish: published,
            };
        }

        // SINGLE IMAGE / VIDEO
        const finalMediaUrl = normalizedMediaUrl || normalizedMediaUrls[0];
        const mediaType: "IMAGE" | "VIDEO" = isVideo(finalMediaUrl)
            ? "VIDEO"
            : "IMAGE";

        const createPayload: Record<string, string> = {
            media_type: mediaType,
        };

        if (normalizedCaption) {
            createPayload.text = normalizedCaption;
        }

        if (mediaType === "IMAGE") {
            createPayload.image_url = finalMediaUrl;
        }

        if (mediaType === "VIDEO") {
            createPayload.video_url = finalMediaUrl;
        }

        const created = await createThreadsContainer(
            userId,
            trimmedToken,
            createPayload
        );

        if (mediaType === "VIDEO") {
            let attempts = 0;
            const maxAttempts = 20;

            while (attempts < maxAttempts) {
                await sleep(5000);

                const statusData = await getContainerStatus(created.id, trimmedToken);
                const status = String(statusData?.status || "").toUpperCase();

                if (status === "FINISHED" || status === "PUBLISHED") {
                    break;
                }

                if (status === "ERROR" || status === "EXPIRED") {
                    throw new Error(
                        statusData?.error_message ||
                        `Threads video container failed with status ${status}`
                    );
                }

                attempts += 1;
            }

            if (attempts === maxAttempts) {
                throw new Error("Threads video processing timed out");
            }
        } else {
            await sleep(3000);
        }

        const published = await publishThreadsContainer(
            userId,
            trimmedToken,
            created.id
        );

        return {
            id: published?.id,
            creationId: created?.id,
            mediaType,
            creation: created,
            publish: published,
        };
    } catch (error: any) {
        console.error(
            "Threads publish error:",
            error?.response?.data || error?.message || error
        );

        const apiError = error?.response?.data?.error;

        throw new Error(
            apiError?.error_user_msg ||
            apiError?.message ||
            error?.message ||
            "Failed to publish Threads post"
        );
    }
};