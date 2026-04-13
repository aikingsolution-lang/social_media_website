import { Router } from "express";
import {
    register,
    login,
    me,
    signup,
    forgotPassword,
    resetPassword,
} from "../controllers/auth";
import {
    googleAuth,
    googleCallback,
    githubAuth,
    githubCallback,
} from "../controllers/auth.oauth";
import { authenticate } from "../middleware/auth";

const router = Router();

// support both old and new frontend paths
router.post("/register", register);
router.post("/signup", signup);
router.post("/login", login);
router.get("/me", authenticate, me);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// OAuth routes
router.get("/google", googleAuth);
router.get("/google/callback", googleCallback);
router.get("/github", githubAuth);
router.get("/github/callback", githubCallback);

export default router;