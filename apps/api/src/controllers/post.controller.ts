import { Request, Response } from "express";
import path from "path";
import axios from "axios";
import prisma from "database/src/index";
import {
    createLinkedInMultiImagePost,
    createLinkedInSingleImagePost,
    createLinkedInSingleVideoPost,
    createLinkedInTextPost,
    finalizeLinkedInVideoUpload,
    initializeLinkedInImageUpload,
    initializeLinkedInVideoUpload,
    readLocalFileBuffer,
    uploadLinkedInImageBinary,
    uploadLinkedInVideoParts,
} from "../services/publish/linkedin.rest";
import { publishTwitterPost } from "../services/publish/twitter.publish";
import { publishFacebookPost } from "../services/publish/facebook.publish";
import { publishThreadsPost } from "../services/threads.service";
import { normalizeAccessToken } from "../utils/normalizeAccessToken";
import { publishInstagramPost } from "../services/publish/instagram.publish";

type AuthRequest = Request & {
    user?: {
        userId?: string;
        id?: string;
        email?: string;
    };
};

function isRemoteUrl(value: string) {
    return /^https?:\/\//i.test(value);
}

function getMimeTypeFromFileName(fileName: string) {
    const ext = path.extname(fileName).toLowerCase();

    if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
    if (ext === ".png") return "image/png";
    if (ext === ".gif") return "image/gif";
    if (ext === ".webp") return "image/webp";
    if (ext === ".mp4") return "video/mp4";
    if (ext === ".mov") return "video/quicktime";
    if (ext === ".m4v") return "video/x-m4v";
    if (ext === ".webm") return "video/webm";

    return "application/octet-stream";
}

function isImageFile(urlOrPath: string) {
    return /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(urlOrPath);
}

function isVideoFile(urlOrPath: string) {
    return /\.(mp4|mov|m4v|webm)(\?.*)?$/i.test(urlOrPath);
}

async function readBufferFromSource(source: string) {
    if (isRemoteUrl(source)) {
        const response = await axios.get<ArrayBuffer>(source, {
            responseType: "arraybuffer",
        });

        return Buffer.from(response.data);
    }

    return readLocalFileBuffer(source);
}

function pickMimeTypeFromSource(source: string) {
    return getMimeTypeFromFileName(source.split("?")[0]);
}

export const publishNow = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        const { accountId, videoId, mediaUrls, mediaPaths, mediaUrl, caption } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Not authenticated",
            });
        }

        if (!accountId || !caption) {
            return res.status(400).json({
                success: false,
                message: "accountId and caption are required",
            });
        }

        const account = await prisma.socialAccount.findFirst({
            where: {
                id: accountId,
                userId,
            },
        });

        if (!account) {
            return res.status(404).json({
                success: false,
                message: "Connected account not found",
            });
        }

        let finalMediaUrls: string[] = [];
        let finalMediaPaths: string[] = [];

        if (Array.isArray(mediaUrls) && mediaUrls.length > 0) {
            finalMediaUrls = mediaUrls.filter(Boolean);
        } else if (mediaUrl) {
            finalMediaUrls = [mediaUrl];
        }

        if (Array.isArray(mediaPaths) && mediaPaths.length > 0) {
            finalMediaPaths = mediaPaths.filter(Boolean);
        }

        if (videoId) {
            const video = await prisma.video.findFirst({
                where: {
                    id: videoId,
                    userId,
                },
            });

            if (!video) {
                return res.status(404).json({
                    success: false,
                    message: "Video not found",
                });
            }

            finalMediaPaths = [video.filePath];
            finalMediaUrls = [video.filePath];
        }

        // IMPORTANT:
        // Do NOT convert public URLs into fake local paths.
        // If URLs exist, keep them as URLs.
        // Only fall back to local paths if URLs are missing.
        const finalMediaSources =
            finalMediaUrls.length > 0 ? finalMediaUrls : finalMediaPaths;

        let publishResult: any = null;

        console.log("PUBLISH account platform:", account.platform);
        console.log("PUBLISH account id:", account.id);
        console.log("PUBLISH platformUserId:", account.platformUserId);
        console.log(
            "PUBLISH accessToken preview:",
            account.accessToken ? `${account.accessToken.slice(0, 20)}...` : "NO TOKEN"
        );
        console.log("PUBLISH finalMediaUrls:", finalMediaUrls);
        console.log("PUBLISH finalMediaPaths:", finalMediaPaths);
        console.log("PUBLISH finalMediaSources:", finalMediaSources);

        if (!account.accessToken || typeof account.accessToken !== "string") {
            return res.status(400).json({
                success: false,
                message: "Connected account has no valid access token",
            });
        }

        const cleanedAccessToken = normalizeAccessToken(account.accessToken);

        if (!cleanedAccessToken) {
            return res.status(400).json({
                success: false,
                message: "Connected account has invalid access token",
            });
        }

        switch (String(account.platform).toLowerCase()) {
            case "linkedin": {
                if (!account.platformUserId) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "LinkedIn account missing platformUserId. Remove the old account and reconnect via OAuth.",
                    });
                }

                const ownerUrn = `urn:li:person:${account.platformUserId}`;

                if (finalMediaSources.length === 0) {
                    publishResult = await createLinkedInTextPost(
                        cleanedAccessToken,
                        ownerUrn,
                        caption
                    );
                    break;
                }

                if (finalMediaSources.length === 1) {
                    const one = finalMediaSources[0];
                    const buffer = await readBufferFromSource(one);
                    const mimeType = pickMimeTypeFromSource(one);

                    if (isImageFile(one)) {
                        const init = await initializeLinkedInImageUpload(
                            cleanedAccessToken,
                            ownerUrn
                        );

                        await uploadLinkedInImageBinary(init.uploadUrl, buffer, mimeType);

                        publishResult = await createLinkedInSingleImagePost(
                            cleanedAccessToken,
                            ownerUrn,
                            caption,
                            init.image
                        );
                        break;
                    }

                    if (isVideoFile(one)) {
                        const init = await initializeLinkedInVideoUpload(
                            cleanedAccessToken,
                            ownerUrn,
                            buffer.length
                        );

                        await uploadLinkedInVideoParts(init.uploadInstructions, buffer);
                        await finalizeLinkedInVideoUpload(cleanedAccessToken, init.video);

                        publishResult = await createLinkedInSingleVideoPost(
                            cleanedAccessToken,
                            ownerUrn,
                            caption,
                            init.video,
                            "Video"
                        );
                        break;
                    }

                    return res.status(400).json({
                        success: false,
                        message: "Unsupported LinkedIn media type",
                    });
                }

                const hasNonImage = finalMediaSources.some((item) => !isImageFile(item));
                if (hasNonImage) {
                    return res.status(400).json({
                        success: false,
                        message: "LinkedIn multi-image post supports images only",
                    });
                }

                if (finalMediaSources.length < 2 || finalMediaSources.length > 20) {
                    return res.status(400).json({
                        success: false,
                        message: "LinkedIn multi-image post requires 2 to 20 images",
                    });
                }

                const imageUrns: string[] = [];

                for (const item of finalMediaSources) {
                    const buffer = await readBufferFromSource(item);
                    const mimeType = pickMimeTypeFromSource(item);

                    const init = await initializeLinkedInImageUpload(
                        cleanedAccessToken,
                        ownerUrn
                    );

                    await uploadLinkedInImageBinary(init.uploadUrl, buffer, mimeType);
                    imageUrns.push(init.image);
                }

                publishResult = await createLinkedInMultiImagePost(
                    cleanedAccessToken,
                    ownerUrn,
                    caption,
                    imageUrns
                );
                break;
            }

            case "instagram": {
                if (!account.platformUserId) {
                    return res.status(400).json({
                        success: false,
                        message: "Instagram account missing platform user id",
                    });
                }

                publishResult = await publishInstagramPost({
                    igUserId: account.platformUserId,
                    accessToken: cleanedAccessToken,
                    caption,
                    mediaUrls: finalMediaUrls,
                });

                break;
            }

            case "twitter": {
                publishResult = await publishTwitterPost({
                    accessToken: cleanedAccessToken,
                    caption,
                });
                break;
            }

            case "facebook": {
                if (!account.platformUserId) {
                    return res.status(400).json({
                        success: false,
                        message: "Facebook account missing page id",
                    });
                }

                publishResult = await publishFacebookPost({
                    pageId: account.platformUserId,
                    accessToken: cleanedAccessToken,
                    caption,
                    mediaUrls: finalMediaUrls,
                } as any);

                break;
            }

            case "threads": {
                if (!account.platformUserId) {
                    return res.status(400).json({
                        success: false,
                        message: "Threads account missing platform user id",
                    });
                }

                if (caption.length > 500) {
                    return res.status(400).json({
                        success: false,
                        message: "Threads text is limited to 500 characters",
                    });
                }

                const publicMediaUrls = finalMediaUrls.filter(Boolean);

                const hasVideo = publicMediaUrls.some((url) =>
                    /\.(mp4|mov|m4v|webm)(\?.*)?$/i.test(url)
                );

                if (hasVideo && publicMediaUrls.length > 1) {
                    return res.status(400).json({
                        success: false,
                        message: "Threads supports one video only in this implementation",
                    });
                }

                publishResult = await publishThreadsPost({
                    userId: account.platformUserId,
                    accessToken: cleanedAccessToken,
                    caption,
                    mediaUrl: publicMediaUrls.length === 1 ? publicMediaUrls[0] : null,
                    mediaUrls: publicMediaUrls.length > 1 ? publicMediaUrls : [],
                });
                break;
            }

            default:
                return res.status(400).json({
                    success: false,
                    message: `Unsupported platform: ${account.platform}`,
                });
        }

        return res.status(200).json({
            success: true,
            message: "Post published successfully",
            data: publishResult,
        });
    } catch (error: any) {
        console.error("publishNow error:", error?.response?.data || error.message || error);

        return res.status(500).json({
            success: false,
            message: "Failed to publish post",
            error: error?.response?.data || error.message,
        });
    }
};

export const deletePost = async (req: AuthRequest, res: Response) => {
    try {
        const { postId } = req.params;
        const userId = req.user?.userId || req.user?.id;

        if (!postId) {
            return res.status(400).json({
                success: false,
                message: "Post ID is required",
            });
        }

        const post = await prisma.scheduledPost.findFirst({
            where: {
                id: postId,
                userId,
            },
        });

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found",
            });
        }

        await prisma.scheduledPost.delete({
            where: { id: postId },
        });

        return res.status(200).json({
            success: true,
            message: "Post deleted successfully",
        });
    } catch (error: any) {
        console.error("Delete post error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete post",
            error: error.message,
        });
    }
};