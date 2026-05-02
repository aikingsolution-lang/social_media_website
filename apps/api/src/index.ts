import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

import express, { Request, Response } from "express";
import cors from "cors";

// Routes
import authRouter from "./routes/auth";
import videoRouter from "./routes/videos";
import accountRouter from "./routes/accounts";
import campaignRouter from "./routes/campaigns";
import oauthRoutes from "./routes/oauth";
import postRoutes from "./routes/post.routes";
import scheduledPostRoutes from "./routes/scheduledPost.routes";
import dashboardRoutes from "./routes/dashboard";
import aiRoutes from "./routes/ai.routes";
import autoPostingRoutes from "./routes/autoPosting.routes";
import instagramRoutes from "./routes/instagram.routes";
import twitterRoutes from "./routes/twitter.routes";
import facebookRoutes from "./routes/facebook.routes";
import scheduledFacebookRoutes from "./routes/scheduledFacebook.routes";
import youtubeRoutes from "./routes/youtube.routes";
import scheduledYouTubeRoutes from "./routes/scheduledYouTube.routes";
import metaRoutes from "./routes/meta.routes";
import webhookRoutes from "./routes/webhook.routes";
import uploadRoutes from "./routes/upload.routes";
import threadsRoutes from "./routes/threads.routes";
import scheduledInstagramRoutes from "./routes/scheduledInstagram.routes";
import multiAccountPostRoutes from "./routes/multiAccountPost.routes";

// ✅ Scheduler import
import { startScheduler } from "../../../workers/src/scheduler";

const app = express();
const port = process.env.PORT || 4000;

// Middlewares
const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.includes(origin) ||
        allowedOrigins.includes("*")
      ) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    message: "Social automation API is running",
  });
});

// API Routes
app.use("/api/auth", authRouter);
app.use("/api/videos", videoRouter);
app.use("/api/accounts", accountRouter);
app.use("/api/campaigns", campaignRouter);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/oauth", oauthRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/multi-posts", multiAccountPostRoutes);

/**
 * Scheduled post routes
 * General scheduled posts -> /api/scheduled-posts
 * Facebook scheduled posts -> /api/scheduled-posts/facebook
 * YouTube scheduled posts -> /api/scheduled-posts/youtube
 */
app.use("/api/scheduled-posts", scheduledPostRoutes);
app.use("/api/scheduled-posts/facebook", scheduledFacebookRoutes);
app.use("/api/scheduled-posts/youtube", scheduledYouTubeRoutes);

app.use("/api/uploads", uploadRoutes);
app.use("/api/upload", uploadRoutes);

app.use("/api/ai", aiRoutes);
app.use("/api/auto-posting", autoPostingRoutes);
app.use("/api/instagram", instagramRoutes);
app.use("/api/twitter", twitterRoutes);
app.use("/api/threads", threadsRoutes);
app.use("/api/facebook", facebookRoutes);
app.use("/api/youtube", youtubeRoutes);

app.use("/", metaRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/scheduled-posts/instagram", scheduledInstagramRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: any) => {
  console.error("Unhandled error:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// Threads delete callback
app.post("/threads-delete-callback", (req: Request, res: Response) => {
  console.log("Delete request received:", req.body);

  res.status(200).json({
    url: "https://karangarje.github.io/meta-pages/delete/",
    confirmation_code: "delete-confirmation-123",
  });
});

// Threads uninstall callback
app.post("/threads-uninstall-callback", (req: Request, res: Response) => {
  console.log("User uninstalled app:", req.body);

  res.status(200).json({
    success: true,
  });
});

// Start server
app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);

  try {
    //startScheduler();
    console.log("✅ Scheduler started from API server");
  } catch (error) {
    console.error("❌ Failed to start scheduler:", error);
  }
});