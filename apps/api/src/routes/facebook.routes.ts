import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { publishFacebookDirect } from "../controllers/facebook.controller";

const router = Router();

router.post("/publish", authenticate, publishFacebookDirect);

export default router;