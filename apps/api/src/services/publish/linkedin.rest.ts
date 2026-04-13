import axios from "axios";
import fs from "fs";
import path from "path";

const LINKEDIN_API_BASE = "https://api.linkedin.com/rest";
const LINKEDIN_VERSION = process.env.LINKEDIN_VERSION || "202601";

type LinkedInHeadersInput = {
    accessToken: string;
    contentType?: string;
};

function getLinkedInHeaders({
    accessToken,
    contentType = "application/json",
}: LinkedInHeadersInput) {
    return {
        Authorization: `Bearer ${accessToken}`,
        "X-Restli-Protocol-Version": "2.0.0",
        "Linkedin-Version": LINKEDIN_VERSION,
        "Content-Type": contentType,
    };
}

export type LinkedInPostResult = {
    id?: string;
    data?: any;
};

export async function initializeLinkedInImageUpload(
    accessToken: string,
    ownerUrn: string
) {
    const response = await axios.post(
        `${LINKEDIN_API_BASE}/images?action=initializeUpload`,
        {
            initializeUploadRequest: {
                owner: ownerUrn,
            },
        },
        {
            headers: getLinkedInHeaders({ accessToken }),
        }
    );

    return response.data?.value as {
        uploadUrl: string;
        image: string;
        uploadUrlExpiresAt?: number;
    };
}

export async function uploadLinkedInImageBinary(
    uploadUrl: string,
    fileBuffer: Buffer,
    mimeType: string
) {
    await axios.put(uploadUrl, fileBuffer, {
        headers: {
            "Content-Type": mimeType || "application/octet-stream",
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
    });
}

export async function initializeLinkedInVideoUpload(
    accessToken: string,
    ownerUrn: string,
    fileSizeBytes: number
) {
    const response = await axios.post(
        `${LINKEDIN_API_BASE}/videos?action=initializeUpload`,
        {
            initializeUploadRequest: {
                owner: ownerUrn,
                fileSizeBytes,
                uploadCaptions: false,
                uploadThumbnail: false,
            },
        },
        {
            headers: getLinkedInHeaders({ accessToken }),
        }
    );

    return response.data?.value as {
        video: string;
        uploadInstructions: Array<{
            firstByte: number;
            lastByte: number;
            uploadUrl: string;
        }>;
        uploadUrlsExpireAt?: number;
    };
}

export async function uploadLinkedInVideoParts(
    uploadInstructions: Array<{
        firstByte: number;
        lastByte: number;
        uploadUrl: string;
    }>,
    fileBuffer: Buffer
) {
    for (const part of uploadInstructions) {
        const chunk = fileBuffer.subarray(part.firstByte, part.lastByte + 1);

        await axios.put(part.uploadUrl, chunk, {
            headers: {
                "Content-Type": "application/octet-stream",
            },
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
        });
    }
}

export async function finalizeLinkedInVideoUpload(
    accessToken: string,
    videoUrn: string
) {
    const response = await axios.post(
        `${LINKEDIN_API_BASE}/videos?action=finalizeUpload`,
        {
            finalizeUploadRequest: {
                video: videoUrn,
            },
        },
        {
            headers: getLinkedInHeaders({ accessToken }),
        }
    );

    return response.data;
}

export async function createLinkedInTextPost(
    accessToken: string,
    ownerUrn: string,
    commentary: string
): Promise<LinkedInPostResult> {
    const response = await axios.post(
        `${LINKEDIN_API_BASE}/posts`,
        {
            author: ownerUrn,
            commentary,
            visibility: "PUBLIC",
            distribution: {
                feedDistribution: "MAIN_FEED",
                targetEntities: [],
                thirdPartyDistributionChannels: [],
            },
            lifecycleState: "PUBLISHED",
            isReshareDisabledByAuthor: false,
        },
        {
            headers: getLinkedInHeaders({ accessToken }),
        }
    );

    return {
        id: response.headers["x-restli-id"],
        data: response.data,
    };
}

export async function createLinkedInSingleImagePost(
    accessToken: string,
    ownerUrn: string,
    commentary: string,
    imageUrn: string
): Promise<LinkedInPostResult> {
    const response = await axios.post(
        `${LINKEDIN_API_BASE}/posts`,
        {
            author: ownerUrn,
            commentary,
            visibility: "PUBLIC",
            distribution: {
                feedDistribution: "MAIN_FEED",
                targetEntities: [],
                thirdPartyDistributionChannels: [],
            },
            lifecycleState: "PUBLISHED",
            isReshareDisabledByAuthor: false,
            content: {
                media: {
                    id: imageUrn,
                },
            },
        },
        {
            headers: getLinkedInHeaders({ accessToken }),
        }
    );

    return {
        id: response.headers["x-restli-id"],
        data: response.data,
    };
}

export async function createLinkedInMultiImagePost(
    accessToken: string,
    ownerUrn: string,
    commentary: string,
    imageUrns: string[]
): Promise<LinkedInPostResult> {
    const response = await axios.post(
        `${LINKEDIN_API_BASE}/posts`,
        {
            author: ownerUrn,
            commentary,
            visibility: "PUBLIC",
            distribution: {
                feedDistribution: "MAIN_FEED",
                targetEntities: [],
                thirdPartyDistributionChannels: [],
            },
            lifecycleState: "PUBLISHED",
            isReshareDisabledByAuthor: false,
            content: {
                multiImage: {
                    images: imageUrns.map((urn) => ({
                        id: urn,
                    })),
                },
            },
        },
        {
            headers: getLinkedInHeaders({ accessToken }),
        }
    );

    return {
        id: response.headers["x-restli-id"],
        data: response.data,
    };
}

export async function createLinkedInSingleVideoPost(
    accessToken: string,
    ownerUrn: string,
    commentary: string,
    videoUrn: string,
    title = "Video"
): Promise<LinkedInPostResult> {
    const response = await axios.post(
        `${LINKEDIN_API_BASE}/posts`,
        {
            author: ownerUrn,
            commentary,
            visibility: "PUBLIC",
            distribution: {
                feedDistribution: "MAIN_FEED",
                targetEntities: [],
                thirdPartyDistributionChannels: [],
            },
            lifecycleState: "PUBLISHED",
            isReshareDisabledByAuthor: false,
            content: {
                media: {
                    id: videoUrn,
                    title,
                },
            },
        },
        {
            headers: getLinkedInHeaders({ accessToken }),
        }
    );

    return {
        id: response.headers["x-restli-id"],
        data: response.data,
    };
}

export function readLocalFileBuffer(filePath: string) {
    const absolutePath = path.isAbsolute(filePath)
        ? filePath
        : path.join(process.cwd(), filePath);

    return fs.readFileSync(absolutePath);
}