import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary";

const storage = new CloudinaryStorage({
    cloudinary,
    params: async (_req, file) => {
        const isVideo = file.mimetype.startsWith("video/");

        return {
            folder: "social-automation",
            resource_type: isVideo ? "video" : "image",
            allowed_formats: isVideo
                ? ["mp4", "mov", "m4v", "webm"]
                : ["jpg", "jpeg", "png", "gif", "webp"],
            public_id: `${Date.now()}-${file.originalname
                .replace(/\s+/g, "-")
                .replace(/[^a-zA-Z0-9._-]/g, "")}`,
        };
    },
});

export const cloudinaryUpload = multer({
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100 MB
        files: 10,
    },
});