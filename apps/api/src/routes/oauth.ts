import { Router } from "express";
import { linkedinAuth } from "../controllers/oauth/linkedin.oauth";
import { linkedinCallback } from "../controllers/oauth/linkedin.callback";
import { instagramAuth } from "../controllers/oauth/instagram.oauth";
import { instagramCallback } from "../controllers/oauth/instagram.callback";
import { twitterAuth } from "../controllers/oauth/twitter.oauth";
import { twitterCallback } from "../controllers/oauth/twitter.callback";
import { threadsAuth } from "../controllers/oauth/threads.oauth";
import { threadsCallback } from "../controllers/oauth/threads.callback";
import { facebookAuth } from "../controllers/oauth/facebook.oauth";
import { facebookCallback } from "../controllers/oauth/facebook.callback";
import { youtubeAuth } from "../controllers/oauth/youtube.oauth";
import { youtubeCallback } from "../controllers/oauth/youtube.callback";

const router = Router();

// LinkedIn
router.get("/linkedin/connect", linkedinAuth);
router.get("/linkedin/callback", linkedinCallback);

// Instagram
router.get("/instagram/connect", instagramAuth);
router.get("/instagram/callback", instagramCallback);

// Twitter / X
router.get("/twitter/connect", twitterAuth);
router.get("/twitter/callback", twitterCallback);


// Threads
router.get("/threads/connect", threadsAuth);
router.get("/threads/callback", threadsCallback);

// Facebook
router.get("/facebook/connect", facebookAuth);
router.get("/facebook/callback", facebookCallback);

// YouTube
router.get("/youtube/connect", youtubeAuth);
router.get("/youtube/callback", youtubeCallback);

export default router;