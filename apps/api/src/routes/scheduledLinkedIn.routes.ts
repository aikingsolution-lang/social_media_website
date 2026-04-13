import { Router } from "express";
import {
    createScheduledLinkedInPost,
    createBulkScheduledLinkedInPost,
    getScheduledLinkedInPosts,
    rescheduleLinkedInPost,
} from "../controllers/scheduledLinkedIn.controller";

const router = Router();

router.post("/linkedin", createScheduledLinkedInPost);
router.post("/linkedin/bulk", createBulkScheduledLinkedInPost);
router.get("/linkedin", getScheduledLinkedInPosts);
router.patch("/linkedin/:postId/reschedule", rescheduleLinkedInPost);

export default router;