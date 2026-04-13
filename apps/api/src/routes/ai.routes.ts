import { Router } from "express";
import {
    generateLinkedInCaption,
    generateInstagramCaption,
    generateFacebookCaption,
    generateThreadsCaption,
    generateYouTubeCaption,
} from "../controllers/aiCaption.controller";

const router = Router();

router.post("/captions/linkedin", generateLinkedInCaption);
router.post("/captions/instagram", generateInstagramCaption);
router.post("/captions/facebook", generateFacebookCaption);
router.post("/captions/threads", generateThreadsCaption);
router.post("/captions/youtube", generateYouTubeCaption);

export default router;