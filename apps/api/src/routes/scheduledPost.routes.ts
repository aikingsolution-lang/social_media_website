import { Router } from "express";
import { authenticate } from "../middleware/auth";
import {
    createScheduledPost,
    getScheduledPosts,
    updateScheduledPost,
    deleteScheduledPost,
    createBulkScheduledPosts,
    rescheduleScheduledPost,
    restoreScheduledPost,
    bulkDeletePosts,
} from "../controllers/scheduledPost.controller";

const router = Router();

router.post("/", authenticate, createScheduledPost);
router.get("/", authenticate, getScheduledPosts);
router.post("/bulk", authenticate, createBulkScheduledPosts);
router.patch("/:postId/reschedule", authenticate, rescheduleScheduledPost);
router.patch("/:postId/restore", authenticate, restoreScheduledPost);
router.put("/:postId", authenticate, updateScheduledPost);
router.delete("/:postId", authenticate, deleteScheduledPost);
router.post("/bulk-delete", authenticate, bulkDeletePosts);

export default router;