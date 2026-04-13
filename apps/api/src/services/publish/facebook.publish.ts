import axios from "axios";
import fs from "fs";
import FormData from "form-data";
import path from "path";

type PublishFacebookPostInput = {
    pageId: string;
    accessToken: string;
    caption: string;
    mediaUrls?: string[];
    mediaPaths?: string[];
};

const graphVersion = process.env.FACEBOOK_GRAPH_VERSION || "v25.0";
const graphBaseUrl = `https://graph.facebook.com/${graphVersion}`;

function isRemoteUrl(value: string) {
    return /^https?:\/\//i.test(value);
}

function toAbsolutePath(filePath: string) {
    return path.isAbsolute(filePath)
        ? filePath
        : path.join(process.cwd(), filePath);
}

function stripQuery(value: string) {
    return value.split("?")[0];
}

function isImage(value: string) {
    return /\.(jpg|jpeg|png|webp|gif)$/i.test(stripQuery(value));
}

function isVideo(value: string) {
    return /\.(mp4|mov|m4v|webm|avi)$/i.test(stripQuery(value));
}

async function uploadUnpublishedPhotoFromLocal({
    pageId,
    accessToken,
    filePath,
}: {
    pageId: string;
    accessToken: string;
    filePath: string;
}) {
    const absolutePath = toAbsolutePath(filePath);

    const form = new FormData();
    form.append("source", fs.createReadStream(absolutePath));
    form.append("published", "false");
    form.append("access_token", accessToken);

    const response = await axios.post(`${graphBaseUrl}/${pageId}/photos`, form, {
        headers: form.getHeaders(),
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
    });

    return response.data;
}

async function uploadUnpublishedPhotoFromUrl({
    pageId,
    accessToken,
    mediaUrl,
}: {
    pageId: string;
    accessToken: string;
    mediaUrl: string;
}) {
    const response = await axios.post(`${graphBaseUrl}/${pageId}/photos`, null, {
        params: {
            url: mediaUrl,
            published: false,
            access_token: accessToken,
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
    });

    return response.data;
}

async function uploadPublishedSinglePhotoFromLocal({
    pageId,
    accessToken,
    filePath,
    caption,
}: {
    pageId: string;
    accessToken: string;
    filePath: string;
    caption: string;
}) {
    const absolutePath = toAbsolutePath(filePath);

    const form = new FormData();
    form.append("source", fs.createReadStream(absolutePath));
    form.append("caption", caption);
    form.append("access_token", accessToken);

    const response = await axios.post(`${graphBaseUrl}/${pageId}/photos`, form, {
        headers: form.getHeaders(),
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
    });

    return response.data;
}

async function uploadPublishedSinglePhotoFromUrl({
    pageId,
    accessToken,
    mediaUrl,
    caption,
}: {
    pageId: string;
    accessToken: string;
    mediaUrl: string;
    caption: string;
}) {
    const response = await axios.post(`${graphBaseUrl}/${pageId}/photos`, null, {
        params: {
            url: mediaUrl,
            caption,
            access_token: accessToken,
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
    });

    return response.data;
}

async function uploadVideoFromLocal({
    pageId,
    accessToken,
    filePath,
    caption,
}: {
    pageId: string;
    accessToken: string;
    filePath: string;
    caption: string;
}) {
    const absolutePath = toAbsolutePath(filePath);

    const form = new FormData();
    form.append("source", fs.createReadStream(absolutePath));
    form.append("description", caption);
    form.append("access_token", accessToken);

    const response = await axios.post(`${graphBaseUrl}/${pageId}/videos`, form, {
        headers: form.getHeaders(),
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
    });

    return response.data;
}

async function uploadVideoFromUrl({
    pageId,
    accessToken,
    mediaUrl,
    caption,
}: {
    pageId: string;
    accessToken: string;
    mediaUrl: string;
    caption: string;
}) {
    const response = await axios.post(`${graphBaseUrl}/${pageId}/videos`, null, {
        params: {
            file_url: mediaUrl,
            description: caption,
            access_token: accessToken,
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
    });

    return response.data;
}

async function uploadUnpublishedPhoto({
    pageId,
    accessToken,
    source,
}: {
    pageId: string;
    accessToken: string;
    source: string;
}) {
    if (isRemoteUrl(source)) {
        return uploadUnpublishedPhotoFromUrl({
            pageId,
            accessToken,
            mediaUrl: source,
        });
    }

    return uploadUnpublishedPhotoFromLocal({
        pageId,
        accessToken,
        filePath: source,
    });
}

async function uploadPublishedSinglePhoto({
    pageId,
    accessToken,
    source,
    caption,
}: {
    pageId: string;
    accessToken: string;
    source: string;
    caption: string;
}) {
    if (isRemoteUrl(source)) {
        return uploadPublishedSinglePhotoFromUrl({
            pageId,
            accessToken,
            mediaUrl: source,
            caption,
        });
    }

    return uploadPublishedSinglePhotoFromLocal({
        pageId,
        accessToken,
        filePath: source,
        caption,
    });
}

async function uploadVideo({
    pageId,
    accessToken,
    source,
    caption,
}: {
    pageId: string;
    accessToken: string;
    source: string;
    caption: string;
}) {
    if (isRemoteUrl(source)) {
        return uploadVideoFromUrl({
            pageId,
            accessToken,
            mediaUrl: source,
            caption,
        });
    }

    return uploadVideoFromLocal({
        pageId,
        accessToken,
        filePath: source,
        caption,
    });
}

export const publishFacebookPost = async ({
    pageId,
    accessToken,
    caption,
    mediaUrls = [],
    mediaPaths = [],
}: PublishFacebookPostInput) => {
    const mediaSources =
        Array.isArray(mediaUrls) && mediaUrls.length > 0
            ? mediaUrls.filter(Boolean)
            : Array.isArray(mediaPaths)
                ? mediaPaths.filter(Boolean)
                : [];

    console.log("FACEBOOK publish mediaSources:", mediaSources);

    // text only
    if (mediaSources.length === 0) {
        const response = await axios.post(`${graphBaseUrl}/${pageId}/feed`, null, {
            params: {
                message: caption,
                access_token: accessToken,
            },
        });

        return response.data;
    }

    // single video
    if (mediaSources.length === 1 && isVideo(mediaSources[0])) {
        return uploadVideo({
            pageId,
            accessToken,
            source: mediaSources[0],
            caption,
        });
    }

    // single image
    if (mediaSources.length === 1 && isImage(mediaSources[0])) {
        return uploadPublishedSinglePhoto({
            pageId,
            accessToken,
            source: mediaSources[0],
            caption,
        });
    }

    // multiple images only
    const hasNonImage = mediaSources.some((item) => !isImage(item));
    if (hasNonImage) {
        throw new Error("Facebook multiple media post currently supports images only.");
    }

    const uploadedPhotos: any[] = [];

    for (const mediaSource of mediaSources) {
        const uploaded = await uploadUnpublishedPhoto({
            pageId,
            accessToken,
            source: mediaSource,
        });

        uploadedPhotos.push(uploaded);
    }

    const attachedMedia = uploadedPhotos.map((photo) => ({
        media_fbid: photo.id,
    }));

    const response = await axios.post(`${graphBaseUrl}/${pageId}/feed`, null, {
        params: {
            message: caption,
            attached_media: JSON.stringify(attachedMedia),
            access_token: accessToken,
        },
    });

    return response.data;
};