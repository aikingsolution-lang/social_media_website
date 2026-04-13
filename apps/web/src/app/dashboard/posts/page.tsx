"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Filter, Download, Pencil, Trash2, X } from "lucide-react";
import CreatePostCard, {
    UploadedFileItem,
} from "@/components/posts/CreatePostCard";
import AICaptionGenerator from "@/components/posts/AICaptionGenerator";
import QuickSchedule from "@/components/posts/QuickSchedule";

type SocialAccount = {
    id: string;
    platform: string;
    accountName: string;
};

type PostItem = {
    id: string;
    caption: string;
    status:
    | "PUBLISHED"
    | "FAILED"
    | "PENDING"
    | "QUEUED"
    | "DELETED"
    | "PUBLISHING";
    scheduledTime?: string | null;
    publishedAt?: string | null;
    mediaUrl?: string | null;
    account?: {
        id: string;
        platform: string;
        accountName?: string;
    } | null;
};

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export default function PostsPage() {
    const [accounts, setAccounts] = useState<SocialAccount[]>([]);
    const [posts, setPosts] = useState<PostItem[]>([]);
    const [selectedAccount, setSelectedAccount] = useState("");
    const [selectedPlatform, setSelectedPlatform] = useState("linkedin");
    const [caption, setCaption] = useState("");
    const [postSearch, setPostSearch] = useState("");
    const [scheduleDate, setScheduleDate] = useState("");
    const [scheduleTime, setScheduleTime] = useState("");
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFileItem[]>([]);

    const [editingPostId, setEditingPostId] = useState<string | null>(null);
    const [editCaption, setEditCaption] = useState("");
    const [editDate, setEditDate] = useState("");
    const [editTime, setEditTime] = useState("");
    const [editMediaUrl, setEditMediaUrl] = useState("");
    const [editLoading, setEditLoading] = useState(false);
    const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);

    const filteredPosts = useMemo(() => {
        if (!postSearch.trim()) return posts;

        const q = postSearch.toLowerCase();

        return posts.filter((post) => {
            const platform = post.account?.platform || "";
            return (
                post.caption?.toLowerCase().includes(q) ||
                platform.toLowerCase().includes(q) ||
                post.status?.toLowerCase().includes(q)
            );
        });
    }, [posts, postSearch]);

    useEffect(() => {
        fetchAccounts();
        fetchPosts();
    }, []);

    useEffect(() => {
        const account = accounts.find((item) => item.id === selectedAccount);
        if (account?.platform) {
            setSelectedPlatform(account.platform.toLowerCase());
        }
    }, [selectedAccount, accounts]);

    async function fetchAccounts() {
        try {
            const token = localStorage.getItem("token");

            const res = await fetch(`${API_BASE_URL}/api/accounts`, {
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            if (!res.ok) return;

            const data = await res.json();
            const accountList = Array.isArray(data?.accounts) ? data.accounts : [];

            setAccounts(accountList);

            if (accountList.length > 0) {
                const firstAccountId = accountList[0].id;
                setSelectedAccount((prev) => prev || firstAccountId);

                const firstAccount = accountList[0];
                if (firstAccount?.platform) {
                    setSelectedPlatform(firstAccount.platform.toLowerCase());
                }
            }
        } catch (error) {
            console.error("Failed to fetch accounts:", error);
        }
    }

    async function fetchPosts() {
        try {
            const token = localStorage.getItem("token");

            const res = await fetch(`${API_BASE_URL}/api/scheduled-posts`, {
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            if (!res.ok) return;

            const data = await res.json();
            setPosts(Array.isArray(data?.posts) ? data.posts : []);
        } catch (error) {
            console.error("Failed to fetch posts:", error);
        }
    }

    async function handlePublishNow() {
        if (!selectedAccount) {
            alert("Please select an account.");
            return;
        }

        if (!caption.trim() && uploadedFiles.length === 0) {
            alert("Please enter caption or upload media.");
            return;
        }

        try {
            const token = localStorage.getItem("token");

            const mediaUrls = uploadedFiles.map((file) => file.url);
            const hasVideo = uploadedFiles.some((file) => file.type === "video");

            const payload: Record<string, any> = {
                accountId: selectedAccount,
                caption,
                mediaUrls,
                mediaUrl: mediaUrls[0] || null,
                hasVideo,
            };

            if (scheduleDate && scheduleTime) {
                payload.scheduledTime = `${scheduleDate}T${scheduleTime}:00`;
            }

            const res = await fetch(`${API_BASE_URL}/api/scheduled-posts`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data?.message || "Failed to create post");
            }

            setCaption("");
            setScheduleDate("");
            setScheduleTime("");
            setUploadedFiles([]);
            fetchPosts();

            alert(
                scheduleDate && scheduleTime
                    ? "Post scheduled successfully"
                    : "Post queued for immediate publishing"
            );
        } catch (error: any) {
            console.error("Post create error:", error);
            alert(error.message || "Failed to create post");
        }
    }

    function openEditModal(post: PostItem) {
        setEditingPostId(post.id);
        setEditCaption(post.caption || "");
        setEditMediaUrl(post.mediaUrl || "");

        if (post.scheduledTime) {
            const dateObj = new Date(post.scheduledTime);

            if (!Number.isNaN(dateObj.getTime())) {
                const year = dateObj.getFullYear();
                const month = String(dateObj.getMonth() + 1).padStart(2, "0");
                const day = String(dateObj.getDate()).padStart(2, "0");
                const hours = String(dateObj.getHours()).padStart(2, "0");
                const minutes = String(dateObj.getMinutes()).padStart(2, "0");

                setEditDate(`${year}-${month}-${day}`);
                setEditTime(`${hours}:${minutes}`);
            } else {
                setEditDate("");
                setEditTime("");
            }
        } else {
            setEditDate("");
            setEditTime("");
        }
    }

    function closeEditModal() {
        setEditingPostId(null);
        setEditCaption("");
        setEditDate("");
        setEditTime("");
        setEditMediaUrl("");
    }

    async function handleUpdatePost() {
        if (!editingPostId) return;

        try {
            setEditLoading(true);

            const token = localStorage.getItem("token");
            const payload: Record<string, any> = {
                caption: editCaption,
                mediaUrl: editMediaUrl || null,
            };

            if (editDate && editTime) {
                payload.scheduledTime = `${editDate}T${editTime}:00`;
            }

            const res = await fetch(
                `${API_BASE_URL}/api/scheduled-posts/${editingPostId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify(payload),
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data?.message || "Failed to update post");
            }

            closeEditModal();
            fetchPosts();
            alert("Post updated successfully");
        } catch (error: any) {
            console.error("Update post error:", error);
            alert(error.message || "Failed to update post");
        } finally {
            setEditLoading(false);
        }
    }

    async function handleDeletePost(postId: string) {
        const confirmed = window.confirm(
            "Are you sure you want to delete this post?"
        );

        if (!confirmed) return;

        try {
            setDeleteLoadingId(postId);

            const token = localStorage.getItem("token");

            const res = await fetch(`${API_BASE_URL}/api/scheduled-posts/${postId}`, {
                method: "DELETE",
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data?.message || "Failed to delete post");
            }

            fetchPosts();
            alert("Post deleted successfully");
        } catch (error: any) {
            console.error("Delete post error:", error);
            alert(error.message || "Failed to delete post");
        } finally {
            setDeleteLoadingId(null);
        }
    }

    function getStatusClass(status: PostItem["status"]) {
        switch (status) {
            case "PUBLISHED":
                return "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20";
            case "FAILED":
                return "bg-red-500/15 text-red-400 border border-red-500/20";
            case "QUEUED":
                return "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20";
            case "DELETED":
                return "bg-slate-500/15 text-slate-300 border border-slate-500/20";
            case "PUBLISHING":
                return "bg-sky-500/15 text-sky-400 border border-sky-500/20";
            default:
                return "bg-sky-500/15 text-sky-400 border border-sky-500/20";
        }
    }

    function getDisplayDate(post: PostItem) {
        if (post.scheduledTime) {
            return {
                date: new Date(post.scheduledTime).toLocaleString(),
                label: "Scheduled",
                labelClass: "text-slate-500",
            };
        }

        if (post.publishedAt) {
            return {
                date: new Date(post.publishedAt).toLocaleString(),
                label: "Published",
                labelClass: "text-emerald-400",
            };
        }

        return null;
    }

    return (
        <div className="min-h-screen bg-[#020617] text-white">
            <div className="px-6 py-6">
                <div className="mb-6 rounded-[28px] border border-white/10 bg-[#030d1d] p-6 shadow-[0_0_40px_rgba(59,130,246,0.08)]">
                    <div className="mb-3 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">
                        Professional Post Management
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight">Posts Dashboard</h1>
                    <p className="mt-2 text-sm text-slate-400">
                        Create, schedule, edit, and manage all social media posts using a
                        clean enterprise dashboard.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
                    <div className="space-y-6">
                        <CreatePostCard
                            accounts={accounts}
                            selectedAccount={selectedAccount}
                            setSelectedAccount={setSelectedAccount}
                            caption={caption}
                            setCaption={setCaption}
                            uploadedFiles={uploadedFiles}
                            setUploadedFiles={setUploadedFiles}
                            onPublish={handlePublishNow}
                        />

                        <AICaptionGenerator
                            platform={selectedPlatform}
                            setCaption={setCaption}
                        />

                        <QuickSchedule
                            scheduleDate={scheduleDate}
                            setScheduleDate={setScheduleDate}
                            scheduleTime={scheduleTime}
                            setScheduleTime={setScheduleTime}
                        />
                    </div>

                    <div className="rounded-[28px] border border-white/10 bg-[#071225] p-5 shadow-[0_0_30px_rgba(79,70,229,0.08)]">
                        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="relative w-full">
                                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="text"
                                    value={postSearch}
                                    onChange={(e) => setPostSearch(e.target.value)}
                                    placeholder="Search posts..."
                                    className="h-14 w-full rounded-2xl border border-white/10 bg-[#0a1326] pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-500/50"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button className="flex h-14 items-center justify-center rounded-2xl border border-white/10 bg-[#0a1326] px-5 text-sm font-medium text-slate-200 hover:bg-white/5">
                                    <Filter className="mr-2 h-4 w-4" />
                                    Filter
                                </button>
                                <button className="flex h-14 items-center justify-center rounded-2xl border border-white/10 bg-[#0a1326] px-5 text-sm font-medium text-slate-200 hover:bg-white/5">
                                    <Download className="mr-2 h-4 w-4" />
                                    Export
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto rounded-3xl border border-white/10">
                            <div className="min-w-[760px]">
                                <div className="grid grid-cols-[2fr_1fr_1fr_1.4fr_110px] bg-white/5 px-5 py-4 text-sm font-semibold text-slate-300">
                                    <div>Post</div>
                                    <div>Platform</div>
                                    <div>Status</div>
                                    <div>Schedule</div>
                                    <div>Actions</div>
                                </div>

                                <div className="divide-y divide-white/10">
                                    {filteredPosts.length === 0 ? (
                                        <div className="px-5 py-10 text-center text-slate-400">
                                            No posts found.
                                        </div>
                                    ) : (
                                        filteredPosts.map((post) => {
                                            const displayDate = getDisplayDate(post);

                                            return (
                                                <div
                                                    key={post.id}
                                                    className="grid grid-cols-[2fr_1fr_1fr_1.4fr_110px] items-center px-5 py-4 text-sm text-slate-200"
                                                >
                                                    <div className="truncate font-medium">
                                                        {post.caption}
                                                    </div>

                                                    <div className="capitalize text-slate-400">
                                                        {post.account?.platform || "-"}
                                                    </div>

                                                    <div>
                                                        <span
                                                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                                                                post.status
                                                            )}`}
                                                        >
                                                            {post.status}
                                                        </span>
                                                    </div>

                                                    <div className="text-slate-400">
                                                        {displayDate ? (
                                                            <div className="flex flex-col">
                                                                <span>{displayDate.date}</span>
                                                                <span
                                                                    className={`text-xs ${displayDate.labelClass}`}
                                                                >
                                                                    {displayDate.label}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            "-"
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => openEditModal(post)}
                                                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10"
                                                            title="Edit post"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </button>

                                                        <button
                                                            onClick={() => handleDeletePost(post.id)}
                                                            disabled={deleteLoadingId === post.id}
                                                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                                                            title="Delete post"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {editingPostId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-2xl rounded-[28px] border border-white/10 bg-[#071225] p-6 shadow-[0_0_40px_rgba(79,70,229,0.15)]">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-white">Edit Post</h2>
                                <p className="mt-1 text-sm text-slate-400">
                                    Update caption, schedule, or media URL
                                </p>
                            </div>

                            <button
                                onClick={closeEditModal}
                                className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-300">
                                    Caption
                                </label>
                                <textarea
                                    value={editCaption}
                                    onChange={(e) => setEditCaption(e.target.value)}
                                    rows={6}
                                    className="w-full rounded-2xl border border-white/10 bg-[#0a1326] px-4 py-4 text-sm leading-7 text-white outline-none placeholder:text-slate-500 focus:border-violet-500/50"
                                    placeholder="Update caption..."
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-300">
                                    Media URL
                                </label>
                                <input
                                    type="text"
                                    value={editMediaUrl}
                                    onChange={(e) => setEditMediaUrl(e.target.value)}
                                    className="h-14 w-full rounded-2xl border border-white/10 bg-[#0a1326] px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-500/50"
                                    placeholder="https://..."
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-300">
                                        Schedule date
                                    </label>
                                    <input
                                        type="date"
                                        value={editDate}
                                        onChange={(e) => setEditDate(e.target.value)}
                                        className="h-14 w-full rounded-2xl border border-white/10 bg-[#0a1326] px-4 text-sm text-white outline-none focus:border-violet-500/50"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-300">
                                        Schedule time
                                    </label>
                                    <input
                                        type="time"
                                        value={editTime}
                                        onChange={(e) => setEditTime(e.target.value)}
                                        className="h-14 w-full rounded-2xl border border-white/10 bg-[#0a1326] px-4 text-sm text-white outline-none focus:border-violet-500/50"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                                <button
                                    onClick={handleUpdatePost}
                                    disabled={editLoading}
                                    className="flex h-14 flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 text-sm font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {editLoading ? "Updating..." : "Save Changes"}
                                </button>

                                <button
                                    onClick={closeEditModal}
                                    className="flex h-14 flex-1 items-center justify-center rounded-2xl border border-white/10 bg-[#0a1326] text-sm font-semibold text-slate-200 hover:bg-white/5"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}