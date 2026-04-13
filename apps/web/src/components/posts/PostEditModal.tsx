"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { updatePost } from "@/lib/api";

type EditablePost = {
    id: string;
    caption: string;
    scheduledTime?: string;
    mediaUrl?: string | null;
};

interface PostEditModalProps {
    post: EditablePost | null;
    open: boolean;
    onClose: () => void;
    onUpdated: () => void;
}

function toDateTimeLocal(value?: string) {
    if (!value) return "";
    const date = new Date(value);
    const pad = (n: number) => String(n).padStart(2, "0");

    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());

    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

export default function PostEditModal({
    post,
    open,
    onClose,
    onUpdated,
}: PostEditModalProps) {
    const [caption, setCaption] = useState("");
    const [scheduledTime, setScheduledTime] = useState("");
    const [mediaUrl, setMediaUrl] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (post) {
            setCaption(post.caption || "");
            setScheduledTime(toDateTimeLocal(post.scheduledTime));
            setMediaUrl(post.mediaUrl || "");
        }
    }, [post]);

    if (!open || !post) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setLoading(true);
            await updatePost(post.id, {
                caption,
                scheduledTime: scheduledTime || undefined,
                mediaUrl,
            });
            alert("Post updated successfully");
            onUpdated();
            onClose();
        } catch (error: any) {
            alert(error.message || "Failed to update post");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <div className="glass-card w-full max-w-2xl p-6">
                <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">Edit Post</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="secondary-btn !h-10 !w-10 !px-0"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-white/75">
                            Caption
                        </label>
                        <textarea
                            className="input-dark min-h-[120px] py-3"
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            placeholder="Write your caption"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-white/75">
                            Media URL
                        </label>
                        <input
                            className="input-dark"
                            value={mediaUrl}
                            onChange={(e) => setMediaUrl(e.target.value)}
                            placeholder="Paste media URL"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-white/75">
                            Schedule Time
                        </label>
                        <input
                            type="datetime-local"
                            className="input-dark"
                            value={scheduledTime}
                            onChange={(e) => setScheduledTime(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-3">
                        <button type="submit" className="primary-btn flex-1" disabled={loading}>
                            {loading ? "Updating..." : "Update Post"}
                        </button>
                        <button
                            type="button"
                            className="secondary-btn flex-1"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}