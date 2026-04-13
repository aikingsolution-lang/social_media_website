"use client";

import { CalendarClock, Pencil, Trash2 } from "lucide-react";

type Post = {
    id: string;
    caption: string;
    scheduledTime?: string;
    status?: string;
    mediaUrl?: string | null;
    account?: {
        platform?: string;
    };
};

interface PostTableProps {
    posts: Post[];
    loading?: boolean;
    onEdit?: (post: Post) => void;
    onDelete?: (postId: string) => void;
}

export default function PostTable({
    posts,
    loading = false,
    onEdit,
    onDelete,
}: PostTableProps) {
    const formatStatusClass = (status?: string) => {
        const value = (status || "").toUpperCase();

        if (value === "PUBLISHED") return "bg-emerald-500/15 text-emerald-300";
        if (value === "QUEUED" || value === "SCHEDULED" || value === "PENDING") {
            return "bg-cyan-500/15 text-cyan-300";
        }
        if (value === "FAILED") return "bg-red-500/15 text-red-300";
        return "bg-white/10 text-white/75";
    };

    return (
        <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                    <thead className="border-b border-white/10 bg-white/5">
                        <tr>
                            <th className="px-6 py-4 text-sm font-semibold text-white/75">Post</th>
                            <th className="px-6 py-4 text-sm font-semibold text-white/75">Platform</th>
                            <th className="px-6 py-4 text-sm font-semibold text-white/75">Status</th>
                            <th className="px-6 py-4 text-sm font-semibold text-white/75">Schedule</th>
                            <th className="px-6 py-4 text-sm font-semibold text-white/75">Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-white/60">
                                    Loading posts...
                                </td>
                            </tr>
                        ) : posts.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-white/60">
                                    No posts found
                                </td>
                            </tr>
                        ) : (
                            posts.map((post) => (
                                <tr
                                    key={post.id}
                                    className="border-b border-white/10 transition hover:bg-white/[0.03]"
                                >
                                    <td className="px-6 py-5">
                                        <p className="max-w-[320px] truncate font-semibold text-white">
                                            {post.caption}
                                        </p>
                                    </td>

                                    <td className="px-6 py-5 text-sm text-white/65">
                                        {post.account?.platform || "-"}
                                    </td>

                                    <td className="px-6 py-5">
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${formatStatusClass(
                                                post.status
                                            )}`}
                                        >
                                            {post.status || "DRAFT"}
                                        </span>
                                    </td>

                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2 text-sm text-white/65">
                                            <CalendarClock className="h-4 w-4" />
                                            {post.scheduledTime
                                                ? new Date(post.scheduledTime).toLocaleString()
                                                : "Not scheduled"}
                                        </div>
                                    </td>

                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <button
                                                className="secondary-btn !px-3"
                                                type="button"
                                                onClick={() => onEdit?.(post)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button
                                                className="secondary-btn !px-3"
                                                type="button"
                                                onClick={() => onDelete?.(post.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="border-t border-white/10 bg-white/[0.03] p-6">
                <p className="text-sm text-white/60">
                    Total posts: <span className="font-semibold text-white">{posts.length}</span>
                </p>
            </div>
        </div>
    );
}