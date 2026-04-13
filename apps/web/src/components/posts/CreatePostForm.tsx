"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Send, Upload, Calendar } from "lucide-react";
import {
    createPost,
    getAccounts,
    uploadMedia,
    uploadMultipleMedia,
} from "@/lib/api";

type Account = {
    id: string;
    platform: string;
    accountName: string;
};

interface CreatePostFormProps {
    onCreated: () => void;
}

export default function CreatePostForm({ onCreated }: CreatePostFormProps) {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [accountId, setAccountId] = useState("");
    const [caption, setCaption] = useState("");
    const [mediaUrls, setMediaUrls] = useState<string[]>([]);
    const [scheduledTime, setScheduledTime] = useState("");
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedFileNames, setSelectedFileNames] = useState<string[]>([]);
    const [previewType, setPreviewType] = useState<"images" | "video" | null>(null);

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        getAccounts()
            .then((res: any) => {
                const accountsData = res?.accounts || res || [];
                setAccounts(accountsData);
                if (accountsData.length > 0) {
                    setAccountId(accountsData[0].id);
                }
            })
            .catch((err: any) => console.error("Failed to load accounts", err));
    }, []);

    const handleChooseFile = () => {
        fileInputRef.current?.click();
    };

    const clearMedia = () => {
        setMediaUrls([]);
        setSelectedFileNames([]);
        setPreviewType(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const validateFiles = (files: File[]) => {
        if (!files.length) {
            throw new Error("Please select at least one file");
        }

        const imageFiles = files.filter((file) => file.type.startsWith("image/"));
        const videoFiles = files.filter((file) => file.type.startsWith("video/"));
        const unsupportedFiles = files.filter(
            (file) =>
                !file.type.startsWith("image/") && !file.type.startsWith("video/")
        );

        if (unsupportedFiles.length > 0) {
            throw new Error("Only image and video files are allowed");
        }

        if (videoFiles.length > 1) {
            throw new Error("Only one video can be uploaded");
        }

        if (videoFiles.length === 1 && imageFiles.length > 0) {
            throw new Error("You cannot upload images and a video together");
        }

        if (imageFiles.length > 10) {
            throw new Error("You can upload up to 10 images");
        }

        return {
            imageFiles,
            videoFiles,
        };
    };

    const handleFilesUpload = async (files: File[]) => {
        try {
            setUploading(true);
            setSelectedFileNames(files.map((file) => file.name));

            const { imageFiles, videoFiles } = validateFiles(files);

            if (videoFiles.length === 1) {
                setPreviewType("video");

                const data = await uploadMedia(videoFiles[0]);
                const uploadedUrl = data?.file?.url || data?.file?.path;

                if (!uploadedUrl) {
                    throw new Error("Upload failed: No URL returned");
                }

                setMediaUrls([uploadedUrl]);
                return;
            }

            if (imageFiles.length >= 1) {
                setPreviewType("images");

                if (imageFiles.length === 1) {
                    const data = await uploadMedia(imageFiles[0]);
                    const uploadedUrl = data?.file?.url || data?.file?.path;

                    if (!uploadedUrl) {
                        throw new Error("Upload failed: No URL returned");
                    }

                    setMediaUrls([uploadedUrl]);
                    return;
                }

                const data = await uploadMultipleMedia(imageFiles);
                const uploadedUrls =
                    data?.files?.map((file: any) => file?.url || file?.path).filter(Boolean) ||
                    [];

                if (!uploadedUrls.length) {
                    throw new Error("Multiple upload failed: No URLs returned");
                }

                setMediaUrls(uploadedUrls);
            }
        } catch (error: any) {
            console.error("Upload failed:", error);
            alert(error.message || "Upload failed");
            clearMedia();
        } finally {
            setUploading(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        await handleFilesUpload(files);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files || []);
        if (!files.length) return;
        await handleFilesUpload(files);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!accountId) {
            alert("Please select an account first.");
            return;
        }

        if (!caption.trim()) {
            alert("Caption is required");
            return;
        }

        try {
            setLoading(true);

            await createPost({
                accountId,
                caption,
                scheduledTime: scheduledTime
                    ? new Date(scheduledTime).toISOString()
                    : undefined,
                mediaUrls: mediaUrls.length ? mediaUrls : undefined,
            });

            alert("Post created successfully!");
            setCaption("");
            setMediaUrls([]);
            setSelectedFileNames([]);
            setPreviewType(null);
            setScheduledTime("");

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }

            onCreated();
        } catch (error: any) {
            alert(error.message || "Failed to create post");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="glass-card flex flex-col p-6">
            <div className="mb-6 flex items-center gap-3 border-b border-white/5 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
                    <Plus className="h-5 w-5" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">Create Post</h3>
                    <p className="text-xs text-white/50">Schedule or post immediately</p>
                </div>
            </div>

            <div className="space-y-5">
                <div>
                    <label className="mb-2 block text-sm font-medium text-white/75">
                        Select Account
                    </label>
                    <select
                        className="input-dark bg-[#0f172a]"
                        value={accountId}
                        onChange={(e) => setAccountId(e.target.value)}
                    >
                        <option value="">Select Platform Account...</option>
                        {accounts.map((acc) => (
                            <option key={acc.id} value={acc.id}>
                                {acc.platform} - {acc.accountName}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="mb-2 block text-sm font-medium text-white/75">
                        Caption
                    </label>
                    <textarea
                        required
                        className="input-dark min-h-[140px] resize-y py-3"
                        placeholder="Write your creative caption here..."
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                    />
                </div>

                <div>
                    <label className="mb-3 block text-sm font-medium text-white/75">
                        Upload images or one video
                    </label>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        className="hidden"
                        onChange={handleFileChange}
                    />

                    <div
                        onClick={handleChooseFile}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        className="group cursor-pointer rounded-[20px] border border-dashed border-white/10 bg-[#0b1430] px-4 py-6 min-h-[140px] flex flex-col items-center justify-center text-center transition hover:border-primary/40 hover:bg-[#0d1838]"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Upload className="h-5 w-5" />
                        </div>

                        <h4 className="mt-3 text-sm font-semibold text-white">
                            Upload media
                        </h4>

                        <p className="mt-1 text-xs text-white/50">
                            Multiple images or one video
                        </p>

                        {uploading && (
                            <p className="mt-2 text-xs text-yellow-400">
                                Uploading...
                            </p>
                        )}

                        {!uploading && selectedFileNames.length > 0 && (
                            <p className="mt-2 text-xs text-green-400">
                                {selectedFileNames.length} file
                                {selectedFileNames.length > 1 ? "s" : ""} selected
                            </p>
                        )}
                    </div>

                    {mediaUrls.length > 0 && previewType === "images" && (
                        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                {mediaUrls.map((url, index) => (
                                    <img
                                        key={index}
                                        src={url}
                                        alt={`Uploaded preview ${index + 1}`}
                                        className="h-28 w-full rounded-xl object-cover"
                                    />
                                ))}
                            </div>
                            <div className="mt-3 flex justify-end">
                                <button
                                    type="button"
                                    onClick={clearMedia}
                                    className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:bg-white/5"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    )}

                    {mediaUrls.length === 1 && previewType === "video" && (
                        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
                            <video
                                src={mediaUrls[0]}
                                controls
                                className="max-h-56 w-full rounded-xl"
                            />
                            <div className="mt-3 flex justify-end">
                                <button
                                    type="button"
                                    onClick={clearMedia}
                                    className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:bg-white/5"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white/75">
                        <Calendar className="h-4 w-4" />
                        Schedule Time (Optional)
                    </label>
                    <input
                        type="datetime-local"
                        className="input-dark"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                    />
                </div>

                <div className="mt-8 pt-4">
                    <button
                        type="submit"
                        className="primary-btn w-full justify-center py-3.5 text-base font-semibold"
                        disabled={loading || uploading}
                    >
                        {loading ? (
                            "Creating..."
                        ) : (
                            <>
                                <Send className="mr-2 h-5 w-5" />
                                {scheduledTime ? "Schedule Post" : "Publish Now"}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
}