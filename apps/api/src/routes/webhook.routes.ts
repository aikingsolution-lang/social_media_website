import { Router, Request, Response } from "express";

const router = Router();

// Threads / Meta Data Deletion Callback
router.post("/threads-delete-callback", (req: Request, res: Response) => {
    console.log("Delete callback received:", req.body);

    res.status(200).json({
        url: "https://karangarje.github.io/meta-pages/delete/",
        confirmation_code: "delete-confirmation-123"
    });
});

export default router;