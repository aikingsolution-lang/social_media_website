import axios from "axios";

type PublishThreadsPostInput = {
    userId: string;
    accessToken: string;
    caption: string;
    mediaUrl?: string | null;
};

const graphVersion = process.env.THREADS_GRAPH_VERSION || "v25.0";

function isVideo(url: string) {
    return /\.(mp4|mov|webm)$/i.test(url);
}

export const publishThreadsPost = async ({
    userId,
    accessToken,
    caption,
    mediaUrl,
}: PublishThreadsPostInput) => {
    if (!accessToken || typeof accessToken !== "string") {
        throw new Error("Threads access token is missing");
    }

    if (!userId || typeof userId !== "string") {
        throw new Error("Threads userId is missing");
    }

    const trimmedToken = accessToken.trim();

    const createParams: Record<string, string> = {
        access_token: trimmedToken,
        text: caption,
    };

    if (!mediaUrl) {
        createParams.media_type = "TEXT";
    } else if (isVideo(mediaUrl)) {
        createParams.media_type = "VIDEO";
        createParams.video_url = mediaUrl;
    } else {
        createParams.media_type = "IMAGE";
        createParams.image_url = mediaUrl;
    }

    const createResponse = await axios.post(
        `https://graph.facebook.com/${graphVersion}/${userId}/threads`,
        null,
        { params: createParams }
    );

    const creationId = createResponse.data?.id;

    if (!creationId) {
        throw new Error("Threads creation id not returned");
    }

    const publishResponse = await axios.post(
        `https://graph.facebook.com/${graphVersion}/${userId}/threads_publish`,
        null,
        {
            params: {
                creation_id: creationId,
                access_token: trimmedToken,
            },
        }
    );

    return {
        creation: createResponse.data,
        publish: publishResponse.data,
    };
};