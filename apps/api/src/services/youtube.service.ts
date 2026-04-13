import axios from "axios";
import fs from "fs";
import os from "os";
import path from "path";

const YOUTUBE_API_BASE_URL =
    process.env.YOUTUBE_API_BASE_URL || "https://www.googleapis.com/youtube/v3";

const YOUTUBE_UPLOAD_BASE_URL =
    process.env.YOUTUBE_UPLOAD_BASE_URL || "https://www.googleapis.com/upload/youtube/v3";

const GOOGLE_TOKEN_URL =
    process.env.GOOGLE_TOKEN_URL || "https://oauth2.googleapis.com/token";

const isRemoteUrl = (value: string) => /^https?:\/\//i.test(value);

const getMimeTypeFromPath = (filePath: string) => {
    const lower = filePath.toLowerCase();

    if (lower.endsWith(".mp4")) return "video/mp4";
    if (lower.endsWith(".mov")) return "video/quicktime";
    if (lower.endsWith(".avi")) return "video/x-msvideo";
    if (lower.endsWith(".mkv")) return "video/x-matroska";
    if (lower.endsWith(".webm")) return "video/webm";

    return "application/octet-stream";
};

const downloadRemoteFile = async (fileUrl: string) => {
    const parsed = new URL(fileUrl);
    const baseName = path.basename(parsed.pathname) || `video-${Date.now()}.mp4`;
    const safeName = baseName.endsWith(".mp4") ? baseName : `${baseName}.mp4`;
    const tempPath = path.join(os.tmpdir(), safeName);

    const response = await axios.get(fileUrl, {
        responseType: "stream",
        maxRedirects: 5,
        validateStatus: (status) => status >= 200 && status < 400,
    });

    console.log("[YouTube] Download content-type:", response.headers["content-type"]);
    console.log("[YouTube] Downloading file to:", tempPath);

    await new Promise<void>((resolve, reject) => {
        const writer = fs.createWriteStream(tempPath);
        response.data.pipe(writer);
        writer.on("finish", () => resolve());
        writer.on("error", reject);
    });

    const stat = fs.statSync(tempPath);
    console.log("[YouTube] Downloaded file size:", stat.size);

    return tempPath;
};

export const refreshYouTubeAccessToken = async (refreshToken: string) => {
    const clientId = process.env.YOUTUBE_CLIENT_ID || "";
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET || "";

    const response = await axios.post(
        GOOGLE_TOKEN_URL,
        new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: "refresh_token",
        }).toString(),
        {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        }
    );

    return response.data.access_token;
};

export const uploadYouTubeVideo = async ({
    accessToken,
    title,
    description,
    localFilePath,
    privacyStatus = "private",
}: {
    accessToken: string;
    title: string;
    description?: string;
    localFilePath: string;
    privacyStatus?: "private" | "public" | "unlisted";
}) => {

    const upload = async (token: string) => {
        let finalFilePath = localFilePath;
        let removeAfterUpload = false;

        if (isRemoteUrl(localFilePath)) {
            finalFilePath = await downloadRemoteFile(localFilePath);
            removeAfterUpload = true;
        }

        if (!fs.existsSync(finalFilePath)) {
            throw new Error(`File not found: ${finalFilePath}`);
        }

        const fileStat = fs.statSync(finalFilePath);
        const fileName = path.basename(finalFilePath);
        const mimeType = getMimeTypeFromPath(finalFilePath);

        console.log("[YouTube] Uploading with token...");

        const startRes = await axios.post(
            `${YOUTUBE_UPLOAD_BASE_URL}/videos?uploadType=resumable&part=snippet,status`,
            {
                snippet: {
                    title,
                    description: description || "",
                },
                status: {
                    privacyStatus,
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json; charset=UTF-8",
                    "X-Upload-Content-Length": String(fileStat.size),
                    "X-Upload-Content-Type": mimeType,
                },
            }
        );

        const uploadUrl = startRes.headers.location;

        if (!uploadUrl) {
            throw new Error("Failed to create upload session");
        }

        const uploadRes = await axios.put(uploadUrl, fs.createReadStream(finalFilePath), {
            headers: {
                "Content-Length": String(fileStat.size),
                "Content-Type": mimeType,
            },
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
        });

        return uploadRes.data;
    };

    try {
        return await upload(accessToken);
    } catch (error: any) {

        const isAuthError =
            error?.response?.status === 401 ||
            error?.response?.data?.error?.code === 401 ||
            error?.message?.includes("401");

        if (!isAuthError) {
            throw error;
        }

        console.log("🔄 YouTube token expired → retry handled in worker");

        // ❗ DO NOT refresh here (worker will do it)
        throw error;
    }
};
export const deleteYouTubeVideo = async ({
    videoId,
    accessToken,
}: {
    videoId: string;
    accessToken: string;
}) => {
    await axios.delete(
        `https://www.googleapis.com/youtube/v3/videos`,
        {
            params: { id: videoId },
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }
    );
};