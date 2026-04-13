import axios from "axios";

type PublishInstagramPostInput = {
    igUserId: string;
    accessToken: string;
    caption: string;
    mediaUrls: string[];
};

const graphVersion = process.env.FACEBOOK_GRAPH_VERSION || "v25.0";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isVideo(url: string) {
    return /\.(mp4|mov|webm|m4v)$/i.test(url);
}

function isImage(url: string) {
    return /\.(jpg|jpeg|png|webp)$/i.test(url);
}

function isPublicHttpUrl(value: string) {
    return (
        /^https?:\/\//i.test(value) &&
        !value.includes("localhost") &&
        !value.includes("127.0.0.1")
    );
}

async function waitForContainerReady(
    creationId: string,
    accessToken: string,
    maxAttempts = 24,
    intervalMs = 5000
) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const statusResponse = await axios.get(
            `https://graph.facebook.com/${graphVersion}/${creationId}`,
            {
                params: {
                    fields: "id,status_code,status",
                    access_token: accessToken,
                },
            }
        );

        const statusCode = statusResponse.data?.status_code || "";

        if (statusCode === "FINISHED" || statusCode === "PUBLISHED") {
            return statusResponse.data;
        }

        if (statusCode === "ERROR" || statusCode === "EXPIRED") {
            throw new Error(
                `Instagram container failed. status_code=${statusCode}, status=${statusResponse.data?.status || ""}`
            );
        }

        await sleep(intervalMs);
    }

    throw new Error("Instagram container timed out before FINISHED");
}

async function createImageContainer({
    igUserId,
    accessToken,
    imageUrl,
    caption,
    isCarouselItem = false,
}: {
    igUserId: string;
    accessToken: string;
    imageUrl: string;
    caption?: string;
    isCarouselItem?: boolean;
}) {
    const params: Record<string, string | boolean> = {
        image_url: imageUrl,
        access_token: accessToken,
    };

    if (caption && !isCarouselItem) params.caption = caption;
    if (isCarouselItem) params.is_carousel_item = true;

    const response = await axios.post(
        `https://graph.facebook.com/${graphVersion}/${igUserId}/media`,
        null,
        { params }
    );

    const creationId = response.data?.id;
    if (!creationId) throw new Error("Instagram image container id not returned");
    return creationId as string;
}

async function createVideoContainer({
    igUserId,
    accessToken,
    videoUrl,
    caption,
    isCarouselItem = false,
}: {
    igUserId: string;
    accessToken: string;
    videoUrl: string;
    caption?: string;
    isCarouselItem?: boolean;
}) {
    const params: Record<string, string | boolean> = {
        access_token: accessToken,
        video_url: videoUrl,
        media_type: isCarouselItem ? "VIDEO" : "REELS",
    };

    if (caption && !isCarouselItem) params.caption = caption;
    if (isCarouselItem) params.is_carousel_item = true;

    const response = await axios.post(
        `https://graph.facebook.com/${graphVersion}/${igUserId}/media`,
        null,
        { params }
    );

    const creationId = response.data?.id;
    if (!creationId) throw new Error("Instagram video container id not returned");
    return creationId as string;
}

async function createCarouselContainer({
    igUserId,
    accessToken,
    children,
    caption,
}: {
    igUserId: string;
    accessToken: string;
    children: string[];
    caption?: string;
}) {
    const response = await axios.post(
        `https://graph.facebook.com/${graphVersion}/${igUserId}/media`,
        null,
        {
            params: {
                media_type: "CAROUSEL",
                children: children.join(","),
                caption: caption || "",
                access_token: accessToken,
            },
        }
    );

    const creationId = response.data?.id;
    if (!creationId) throw new Error("Instagram carousel container id not returned");
    return creationId as string;
}

async function publishContainer({
    igUserId,
    accessToken,
    creationId,
}: {
    igUserId: string;
    accessToken: string;
    creationId: string;
}) {
    const publishResponse = await axios.post(
        `https://graph.facebook.com/${graphVersion}/${igUserId}/media_publish`,
        null,
        {
            params: {
                creation_id: creationId,
                access_token: accessToken,
            },
        }
    );

    return publishResponse.data;
}

export const publishInstagramPost = async ({
    igUserId,
    accessToken,
    caption,
    mediaUrls,
}: PublishInstagramPostInput) => {
    if (!accessToken || typeof accessToken !== "string") {
        throw new Error("Instagram access token is missing");
    }

    if (!igUserId || typeof igUserId !== "string") {
        throw new Error("Instagram igUserId is missing");
    }

    if (!Array.isArray(mediaUrls) || mediaUrls.length === 0) {
        throw new Error("Instagram mediaUrls is required");
    }

    const trimmedToken = accessToken.trim();

    for (const mediaUrl of mediaUrls) {
        if (!isPublicHttpUrl(mediaUrl)) {
            throw new Error(
                "Instagram media must be hosted on a public URL. Localhost media URLs will not work."
            );
        }
    }

    if (mediaUrls.length === 1) {
        const mediaUrl = mediaUrls[0];
        let creationId = "";

        if (isVideo(mediaUrl)) {
            creationId = await createVideoContainer({
                igUserId,
                accessToken: trimmedToken,
                videoUrl: mediaUrl,
                caption,
            });

            await waitForContainerReady(creationId, trimmedToken, 24, 5000);

            return {
                type: "reel",
                creationId,
                publish: await publishContainer({
                    igUserId,
                    accessToken: trimmedToken,
                    creationId,
                }),
            };
        }

        if (isImage(mediaUrl)) {
            creationId = await createImageContainer({
                igUserId,
                accessToken: trimmedToken,
                imageUrl: mediaUrl,
                caption,
            });

            await waitForContainerReady(creationId, trimmedToken, 10, 3000);

            return {
                type: "image",
                creationId,
                publish: await publishContainer({
                    igUserId,
                    accessToken: trimmedToken,
                    creationId,
                }),
            };
        }

        throw new Error("Unsupported Instagram media type. Use public image or video URL.");
    }

    const hasVideo = mediaUrls.some((url) => isVideo(url));
    const hasNonImage = mediaUrls.some((url) => !isImage(url));

    if (hasVideo) {
        throw new Error(
            "This carousel implementation supports multiple images only, not mixed video carousel."
        );
    }

    if (hasNonImage) {
        throw new Error("Only jpg, jpeg, png, webp images are supported for carousel.");
    }

    if (mediaUrls.length < 2) {
        throw new Error("Instagram carousel requires at least 2 images.");
    }

    if (mediaUrls.length > 10) {
        throw new Error("Instagram carousel supports maximum 10 images.");
    }

    const childCreationIds: string[] = [];

    for (const mediaUrl of mediaUrls) {
        const childId = await createImageContainer({
            igUserId,
            accessToken: trimmedToken,
            imageUrl: mediaUrl,
            isCarouselItem: true,
        });

        await waitForContainerReady(childId, trimmedToken, 10, 3000);
        childCreationIds.push(childId);
    }

    const carouselCreationId = await createCarouselContainer({
        igUserId,
        accessToken: trimmedToken,
        children: childCreationIds,
        caption,
    });

    await waitForContainerReady(carouselCreationId, trimmedToken, 24, 5000);

    return {
        type: "carousel",
        children: childCreationIds,
        creationId: carouselCreationId,
        publish: await publishContainer({
            igUserId,
            accessToken: trimmedToken,
            creationId: carouselCreationId,
        }),
    };
};