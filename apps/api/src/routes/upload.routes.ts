import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { cloudinaryUpload } from "../middleware/cloudinaryUpload";
import {
    uploadToCloudinary,
    uploadMultipleToCloudinary,
} from "../controllers/upload.controller";

const router = Router();

// single upload
router.post(
    "/",
    authenticate,
    cloudinaryUpload.single("file"),
    uploadToCloudinary
);

// multiple upload
router.post(
    "/multiple",
    authenticate,
    cloudinaryUpload.array("files", 10),
    uploadMultipleToCloudinary
);

export default router;