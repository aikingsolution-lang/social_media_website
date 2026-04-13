import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { publishNow, deletePost } from "../controllers/post.controller";

const router = Router();

router.post("/publish", authenticate, publishNow);

// ✅ ADD THIS
router.delete("/:postId", authenticate, deletePost);

export default router;