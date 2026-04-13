import axios from "axios";

// ================================
// HELPERS
// ================================
const getMediaType = (url: string) => {
    if (!url) return "NONE";

    const lower = url.toLowerCase();

    if (lower.endsWith(".mp4")) return "VIDEO";
    if (
        lower.endsWith(".jpg") ||
        lower.endsWith(".jpeg") ||
        lower.endsWith(".png") ||
        lower.endsWith(".webp")
    )
        return "IMAGE";

    return "NONE";
};

// ================================
// UPLOAD SINGLE MEDIA
// ================================
const uploadMedia = async ({
    accessToken,
    authorUrn,
    mediaUrl,
}: {
    accessToken: string;
    authorUrn: string;
    mediaUrl: string;
}) => {
    const type = getMediaType(mediaUrl);

    const recipe =
        type === "VIDEO"
            ? "urn:li:digitalmediaRecipe:feedshare-video"
            : "urn:li:digitalmediaRecipe:feedshare-image";

    // STEP 1: REGISTER
    const registerRes = await axios.post(
        "https://api.linkedin.com/v2/assets?action=registerUpload",
        {
            registerUploadRequest: {
                recipes: [recipe],
                owner: authorUrn,
                serviceRelationships: [
                    {
                        relationshipType: "OWNER",
                        identifier: "urn:li:userGeneratedContent",
                    },
                ],
            },
        },
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        }
    );

    const uploadUrl =
        registerRes.data.value.uploadMechanism[
            "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
        ].uploadUrl;

    const mediaUrn = registerRes.data.value.asset;

    // STEP 2: UPLOAD FILE
    const fileRes = await axios.get(mediaUrl, {
        responseType: "arraybuffer",
    });

    await axios.put(uploadUrl, fileRes.data, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/octet-stream",
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
    });

    return {
        mediaUrn,
        type,
    };
};

// ================================
// MAIN FUNCTION
// ================================
export const publishLinkedInPost = async ({
    accessToken,
    authorUrn,
    caption,
    mediaUrls = [], // ✅ MULTIPLE MEDIA SUPPORT
    thumbnailUrl,   // ✅ FOR VIDEO PREVIEW
}: {
    accessToken: string;
    authorUrn: string;
    caption: string;
    mediaUrls?: string[];
    thumbnailUrl?: string;
}) => {
    try {
        let uploadedMedia: any[] = [];

        // ================================
        // STEP 1 → UPLOAD ALL MEDIA
        // ================================
        for (const url of mediaUrls) {
            console.log("📤 Uploading:", url);

            const uploaded = await uploadMedia({
                accessToken,
                authorUrn,
                mediaUrl: url,
            });

            uploadedMedia.push(uploaded);
        }

        // ================================
        // STEP 2 → HANDLE VIDEO THUMBNAIL
        // ================================
        let thumbnailUrn = null;

        if (thumbnailUrl) {
            const thumb = await uploadMedia({
                accessToken,
                authorUrn,
                mediaUrl: thumbnailUrl,
            });

            thumbnailUrn = thumb.mediaUrn;
        }

        // ================================
        // STEP 3 → BUILD MEDIA ARRAY
        // ================================
        const media = uploadedMedia.map((m) => ({
            status: "READY",
            description: { text: caption || "" },
            media: m.mediaUrn,
            ...(m.type === "VIDEO" && thumbnailUrn
                ? { thumbnails: [{ resolvedUrl: thumbnailUrn }] }
                : {}),
        }));

        // ================================
        // STEP 4 → DETERMINE CATEGORY
        // ================================
        let category: "NONE" | "IMAGE" | "VIDEO" = "NONE";

        if (uploadedMedia.length > 0) {
            category =
                uploadedMedia[0].type === "VIDEO" ? "VIDEO" : "IMAGE";
        }

        // ================================
        // STEP 5 → CREATE POST
        // ================================
        console.log("📢 Creating LinkedIn Post...");

        const postRes = await axios.post(
            "https://api.linkedin.com/v2/ugcPosts",
            {
                author: authorUrn,
                lifecycleState: "PUBLISHED",
                specificContent: {
                    "com.linkedin.ugc.ShareContent": {
                        shareCommentary: {
                            text: caption || "",
                        },
                        shareMediaCategory: category,
                        media: media,
                    },
                },
                visibility: {
                    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                    "X-Restli-Protocol-Version": "2.0.0",
                },
            }
        );

        console.log("✅ POST SUCCESS");

        return postRes.data;
    } catch (error: any) {
        console.error("❌ FULL ERROR:");
        console.error(error.response?.data || error.message);

        throw error;
    }
};