import { Router } from "express";
import {
    createCampaign,
    deleteCampaign,
    generateSchedule,
    getCampaigns,
    publishNextPosts,
} from "../controllers/campaigns";
import { authenticate } from "../middleware/auth";

const router = Router();

router.post("/", authenticate, createCampaign);
router.get("/", authenticate, getCampaigns);
router.post("/:id/generate", authenticate, generateSchedule);
router.post("/:id/publish-next", authenticate, publishNextPosts);
router.delete("/:id", authenticate, deleteCampaign);

export default router;