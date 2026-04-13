import { Router } from "express";
import { createAutoAIPostingPlan } from "../controllers/autoPosting.controller";

const router = Router();

router.post("/linkedin", createAutoAIPostingPlan);

export default router;