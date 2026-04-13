import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { createTwitterPost } from "../controllers/twitter.post.controller";

const router = Router();

/**
 * Publish Twitter/X Post
 * Supports:
 * - Text only
 * - Text + single mediaUrl
 * - Text + multiple mediaUrls (fallback mode)
 */
router.post("/publish", authenticate, createTwitterPost);

/**
 * Health check (optional but useful for testing)
 */
router.get("/health", (req, res) => {
    return res.json({
        success: true,
        message: "Twitter routes working",
    });
});

export default router;