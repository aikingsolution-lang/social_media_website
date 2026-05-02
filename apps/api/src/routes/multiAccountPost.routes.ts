import { Router } from "express";
import { createMultiAccountPost } from "../controllers/multiAccountPost.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

router.post("/", authenticate, createMultiAccountPost);

export default router;