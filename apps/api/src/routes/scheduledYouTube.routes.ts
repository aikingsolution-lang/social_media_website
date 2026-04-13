import { Router } from "express";
import { authenticate } from "../middleware/auth";
import {
    createScheduledYouTubePosts,
    getScheduledYouTubePosts,
    rescheduleScheduledYouTubePost,
} from "../controllers/scheduledYouTube.controller";

const router = Router();

router.post("/bulk", authenticate, createScheduledYouTubePosts);
router.get("/", authenticate, getScheduledYouTubePosts);
router.patch("/:id/reschedule", authenticate, rescheduleScheduledYouTubePost);

export default router;