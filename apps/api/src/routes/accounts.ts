import { Router } from "express";
import {
  connectAccount,
  deleteAccount,
  getAccountById,
  getAccounts,
  updateAccountStatus,
} from "../controllers/accounts.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, getAccounts);
router.get("/:id", authenticate, getAccountById);
router.post("/", authenticate, connectAccount);
router.patch("/:id/status", authenticate, updateAccountStatus);
router.delete("/:id", authenticate, deleteAccount);

export default router;