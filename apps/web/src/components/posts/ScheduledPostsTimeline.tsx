"use client";

import { useMemo, useState } from "react";
import { ScheduledLinkedInPost } from "@/types/post";

type Props = {
    posts: ScheduledLinkedInPost[];
    selectedDate: string;
    onReschedule?: (postId: string, newDateTime: string) => Promise<void>;
};

function isSameDay(dateString: string, selectedDate: string) {
    const a = new Date(dateString);
    const b = new Date(selectedDate);

    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

function formatTime(dateString: string) {
    return new Date(dateString).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function getStatusClasses(status: string) {
    switch (status) {
        case "PUBLISHED":
            return "bg-green-500/15 text-green-300 border-green-500/20";
        case "FAILED":
            return "bg-red-500/15 text-red-300 border-red-500/20";
        case "QUEUED":
            return "bg-yellow-500/15 text-yellow-300 border-yellow-500/20";
        case "PUBLISHING":
            return "bg-blue-500/15 text-blue-300 border-blue-500/20";
        default:
            return "bg-white/10 text-white/70 border-white/10";
    }
}

function buildDateTime(selectedDate: string, time: string) {
    return `${selectedDate}T${time}:00`;
}

const TIME_SLOTS = [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
];

export default function ScheduledPostsTimeline({
    posts,
    selectedDate,
    onReschedule,
}: Props) {
    const [draggingPostId, setDraggingPostId] = useState<string | null>(null);
    const [droppingTime, setDroppingTime] = useState<string | null>(null);

    const filteredPosts = useMemo(() => {
        return posts
            .filter((post) => isSameDay(post.scheduledTime, selectedDate))
            .sort(
                (a, b) =>
                    new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
            );
    }, [posts, selectedDate]);

    const groupedByHour = useMemo(() => {
        const map: Record<string, ScheduledLinkedInPost[]> = {};
        TIME_SLOTS.forEach((slot) => {
            map[slot] = [];
        });

        filteredPosts.forEach((post) => {
            const date = new Date(post.scheduledTime);
            const hh = String(date.getHours()).padStart(2, "0");
            const rounded = `${hh}:00`;

            if (!map[rounded]) {
                map[rounded] = [];
            }

            map[rounded].push(post);
        });

        return map;
    }, [filteredPosts]);

    const handleDrop = async (time: string) => {
        if (!draggingPostId || !onReschedule) return;

        try {
            setDroppingTime(time);
            const newDateTime = buildDateTime(selectedDate, time);
            await onReschedule(draggingPostId, newDateTime);
        } finally {
            setDraggingPostId(null);
            setDroppingTime(null);
        }
    };

    return (
        <div className="rounded-3xl border border-white/10 bg-[#07122b]/90 p-5 shadow-2xl">
            <div className="mb-4">
                <h2 className="text-xl font-bold text-white">Scheduled Timeline</h2>
                <p className="mt-1 text-sm text-white/60">
                    Drag a post card and drop it on another time slot to reschedule it.
                </p>
            </div>

            {filteredPosts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-sm text-white/50">
                    No LinkedIn posts scheduled for this date.
                </div>
            ) : (
                <div className="space-y-4">
                    {TIME_SLOTS.map((slot) => (
                        <div
                            key={slot}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => handleDrop(slot)}
                            className={`rounded-2xl border p-4 transition ${droppingTime === slot
                                    ? "border-[#7367ff]/50 bg-[#7367ff]/10"
                                    : "border-white/10 bg-white/5"
                                }`}
                        >
                            <div className="mb-3 flex items-center justify-between">
                                <div className="text-sm font-semibold text-[#b4aaff]">{slot}</div>
                                <div className="text-xs text-white/45">
                                    {groupedByHour[slot]?.length || 0} post(s)
                                </div>
                            </div>

                            {groupedByHour[slot] && groupedByHour[slot].length > 0 ? (
                                <div className="space-y-3">
                                    {groupedByHour[slot].map((post) => (
                                        <div
                                            key={post.id}
                                            draggable
                                            onDragStart={() => setDraggingPostId(post.id)}
                                            onDragEnd={() => setDraggingPostId(null)}
                                            className={`cursor-move rounded-2xl border border-white/10 bg-black/20 p-4 ${draggingPostId === post.id ? "opacity-50" : ""
                                                }`}
                                        >
                                            <div className="mb-2 flex items-center gap-2">
                                                <span className="rounded-xl bg-[#7367ff]/20 px-3 py-1 text-xs font-medium text-[#b4aaff]">
                                                    {formatTime(post.scheduledTime)}
                                                </span>
                                                <span
                                                    className={`rounded-xl border px-3 py-1 text-xs font-medium ${getStatusClasses(
                                                        post.status
                                                    )}`}
                                                >
                                                    {post.status}
                                                </span>
                                            </div>

                                            <p className="line-clamp-3 text-sm text-white/85">
                                                {post.caption || "No caption"}
                                            </p>

                                            <div className="mt-2 text-xs text-white/50">
                                                {post.account?.profileName ||
                                                    post.account?.username ||
                                                    post.account?.email ||
                                                    "LinkedIn account"}
                                            </div>

                                            {post.failedReason && (
                                                <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                                                    {post.failedReason}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-xl border border-dashed border-white/10 bg-black/10 p-4 text-center text-xs text-white/35">
                                    Drop here to move a post to {slot}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}