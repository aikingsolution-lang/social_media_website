import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { createInstagramPost } from "../controllers/instagram.post.controller";

const router = Router();

router.post("/publish", authenticate, createInstagramPost);

export default router;