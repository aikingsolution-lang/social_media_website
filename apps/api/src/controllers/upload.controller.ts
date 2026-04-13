import { Request, Response } from "express";

export const uploadToCloudinary = async (req: Request, res: Response) => {
    try {
        const file = req.file as any;

        if (!file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded",
            });
        }

        const secureUrl = file.path || file.secure_url;

        return res.status(200).json({
            success: true,
            file: {
                filename: file.filename || file.public_id,
                originalname: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                url: secureUrl,
                path: secureUrl,
                resourceType: file.resource_type || "image",
            },
        });
    } catch (error: any) {
        console.error("uploadToCloudinary error:", error?.message || error);

        return res.status(500).json({
            success: false,
            message: "Failed to upload file to Cloudinary",
            error: error?.message || "Unknown error",
        });
    }
};

export const uploadMultipleToCloudinary = async (
    req: Request,
    res: Response
) => {
    try {
        const files = (req.files as any[]) || [];

        if (!files.length) {
            return res.status(400).json({
                success: false,
                message: "No files uploaded",
            });
        }

        const uploadedFiles = files.map((file) => ({
            filename: file.filename || file.public_id,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            url: file.path || file.secure_url,
            path: file.path || file.secure_url,
            resourceType: file.resource_type || "image",
        }));

        return res.status(200).json({
            success: true,
            files: uploadedFiles,
        });
    } catch (error: any) {
        console.error("uploadMultipleToCloudinary error:", error?.message || error);

        return res.status(500).json({
            success: false,
            message: "Failed to upload files to Cloudinary",
            error: error?.message || "Unknown error",
        });
    }
};