import { Router } from "express";
import { authenticate } from "../middleware/auth";
import {
    getFacebookScheduledPosts,
    createFacebookScheduledPostsBulk,
    rescheduleFacebookPost,
} from "../controllers/facebook.scheduled.controller";

const router = Router();

router.get("/facebook", authenticate, getFacebookScheduledPosts);
router.post("/facebook/bulk", authenticate, createFacebookScheduledPostsBulk);
router.patch("/facebook/:postId/reschedule", authenticate, rescheduleFacebookPost);

export default router;