import express from "express";
import { generateCampaignSchedule } from "../controllers/campaignController";

const router = express.Router();

router.post("/generate", generateCampaignSchedule);

export default router;