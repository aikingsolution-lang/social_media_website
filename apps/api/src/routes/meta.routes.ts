import { Router } from "express";

const router = Router();

router.get("/delete", (req, res) => {
    res.send("User data deletion endpoint working");
});

export default router;