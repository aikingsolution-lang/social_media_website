import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { createYouTubePost } from "../controllers/youtube.post.controller";

const router = Router();

router.post("/publish", authenticate, createYouTubePost);

export default router;