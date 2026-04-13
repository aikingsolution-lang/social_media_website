import { Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | null = null;

try {
    if (process.env.GEMINI_API_KEY) {
        client = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY,
        });
    }
} catch (error) {
    console.warn("Gemini client failed to initialize.");
}

type CaptionPlatform =
    | "linkedin"
    | "instagram"
    | "facebook"
    | "threads"
    | "youtube";

function extractJsonObject(text: string) {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");

    if (start === -1 || end === -1 || end <= start) {
        return null;
    }

    try {
        return JSON.parse(text.slice(start, end + 1));
    } catch {
        return null;
    }
}

function getPlatformInstructions(platform: CaptionPlatform) {
    switch (platform) {
        case "linkedin":
            return "Write polished, professional, business-friendly content with clear value.";
        case "instagram":
            return "Write engaging, visual, catchy content with a social feel.";
        case "facebook":
            return "Write conversational, community-friendly, easy-to-read content.";
        case "threads":
            return "Write short, punchy, natural, human-sounding content.";
        case "youtube":
            return "Write compelling video-focused content with a strong hook and CTA.";
        default:
            return "Write clear and engaging content.";
    }
}

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableGeminiError(error: any) {
    const status =
        error?.status ||
        error?.response?.status ||
        error?.error?.code ||
        error?.code;

    const message = String(
        error?.message ||
        error?.error?.message ||
        error?.response?.data?.error?.message ||
        ""
    ).toLowerCase();

    return (
        status === 503 ||
        status === 500 ||
        status === 429 ||
        message.includes("high demand") ||
        message.includes("unavailable") ||
        message.includes("overloaded") ||
        message.includes("resource exhausted")
    );
}

async function generateWithRetry(prompt: string) {
    if (!client) {
        throw new Error("Gemini is not configured. Please add GEMINI_API_KEY.");
    }

    const modelsToTry = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
    ];

    let lastError: any = null;

    for (const model of modelsToTry) {
        for (let attempt = 0; attempt < 4; attempt++) {
            try {
                const response = await client.models.generateContent({
                    model,
                    contents: prompt,
                });

                const text = response.text?.trim() || "";

                if (!text) {
                    throw new Error("Empty response from Gemini");
                }

                return text;
            } catch (error: any) {
                lastError = error;

                if (!isRetryableGeminiError(error)) {
                    throw error;
                }

                const isLastAttempt = attempt === 3;
                if (isLastAttempt) {
                    break;
                }

                const backoffMs = Math.min(1000 * 2 ** attempt, 8000);
                const jitterMs = Math.floor(Math.random() * 500);

                await sleep(backoffMs + jitterMs);
            }
        }
    }

    throw lastError || new Error("Gemini request failed after retries");
}

async function generateCaptionsByPlatform(
    req: Request,
    res: Response,
    platform: CaptionPlatform
) {
    try {
        const {
            prompt = "",
            postType = "general",
            tone = "professional",
            mediaCount = 0,
            hasVideo = false,
            format = "paragraph",
            length = "medium",
            language = "English",
            mode = "compose",
        } = req.body;

        if (!String(prompt).trim()) {
            return res.status(400).json({
                success: false,
                error: "Prompt is required",
            });
        }

        const finalPrompt = `
You are a premium AI writing assistant.

Generate 3 high-quality ${platform} drafts.

Requirements:
- Mode: ${mode}
- Format: ${format}
- Tone: ${tone}
- Length: ${length}
- Language: ${language}
- Post type: ${postType}
- Media count: ${mediaCount}
- Contains video: ${hasVideo ? "yes" : "no"}

Platform-specific instruction:
${getPlatformInstructions(platform)}

User request:
${prompt}

Rules:
- Make the content human-like and premium
- Keep it well-structured and readable
- Do not include explanations
- Return valid JSON only

Return this exact format:
{
  "captions": [
    "draft 1",
    "draft 2",
    "draft 3"
  ]
}
`;

        const text = await generateWithRetry(finalPrompt);

        let parsed = extractJsonObject(text);

        if (!parsed || !Array.isArray(parsed.captions)) {
            parsed = {
                captions: [text].filter(Boolean),
            };
        }

        return res.status(200).json({
            success: true,
            platform,
            data: {
                captions: parsed.captions,
            },
        });
    } catch (error: any) {
        console.error(`generate ${platform} caption error:`, error);

        const message =
            error?.message ||
            error?.error?.message ||
            error?.response?.data?.error?.message ||
            "Failed to generate caption";

        const isTemporary = isRetryableGeminiError(error);

        return res.status(isTemporary ? 503 : 500).json({
            success: false,
            error: isTemporary
                ? "Gemini is busy right now. Please try again in a few seconds."
                : message,
        });
    }
}

export const generateLinkedInCaption = async (req: Request, res: Response) =>
    generateCaptionsByPlatform(req, res, "linkedin");

export const generateInstagramCaption = async (req: Request, res: Response) =>
    generateCaptionsByPlatform(req, res, "instagram");

export const generateFacebookCaption = async (req: Request, res: Response) =>
    generateCaptionsByPlatform(req, res, "facebook");

export const generateThreadsCaption = async (req: Request, res: Response) =>
    generateCaptionsByPlatform(req, res, "threads");

export const generateYouTubeCaption = async (req: Request, res: Response) =>
    generateCaptionsByPlatform(req, res, "youtube");