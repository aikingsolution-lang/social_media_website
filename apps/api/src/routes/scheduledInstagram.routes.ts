import { Router } from "express";
import { authenticate } from "../middleware/auth";
import {
    createInstagramScheduledPost,
    getInstagramScheduledPosts,
} from "../controllers/instagram.scheduled.controller";

const router = Router();

router.get("/", authenticate, getInstagramScheduledPosts);
router.post("/", authenticate, createInstagramScheduledPost);

export default router;