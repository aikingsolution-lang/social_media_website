import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { createThreadsPost } from "../controllers/threads.post.controller";

const router = Router();

router.post("/publish", authenticate, createThreadsPost);

export default router;