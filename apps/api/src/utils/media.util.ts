import path from "path";

export const isRemoteUrl = (value?: string | null): boolean => {
    if (!value) return false;
    return /^https?:\/\//i.test(value);
};

export const isImageUrl = (value?: string | null): boolean => {
    if (!value) return false;
    const lower = value.toLowerCase();
    return (
        lower.includes(".jpg") ||
        lower.includes(".jpeg") ||
        lower.includes(".png") ||
        lower.includes(".webp") ||
        lower.includes("/image/") ||
        lower.includes("image/upload")
    );
};

export const isVideoUrl = (value?: string | null): boolean => {
    if (!value) return false;
    const lower = value.toLowerCase();
    return (
        lower.includes(".mp4") ||
        lower.includes(".mov") ||
        lower.includes(".avi") ||
        lower.includes(".mkv") ||
        lower.includes("/video/") ||
        lower.includes("video/upload")
    );
};

export const normalizeFileName = (originalName: string) => {
    const parsed = path.parse(originalName);
    const base = parsed.name.replace(/\s+/g, "-").replace(/[^\w-]/g, "");
    const ext = parsed.ext || "";
    return `${base}${ext}`;
};