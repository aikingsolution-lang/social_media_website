import { Router } from "express";
import {
    connectAccount,
    deleteAccount,
    getAccounts,
} from "../controllers/accounts.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, getAccounts);
router.post("/", authenticate, connectAccount);
router.delete("/:id", authenticate, deleteAccount);

export default router;