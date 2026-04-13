"use client";

import { useMemo, useState } from "react";
import { ScheduledLinkedInPost } from "@/types/post";

type Props = {
    posts: ScheduledLinkedInPost[];
    selectedDate: string;
    onReschedule?: (postId: string, newDateTime: string) => Promise<void>;
};

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

function getStartOfWeek(dateString: string) {
    const date = new Date(dateString);
    const day = date.getDay(); // 0 = Sunday
    const diff = day === 0 ? -6 : 1 - day; // Monday start
    const monday = new Date(date);
    monday.setDate(date.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
}

function formatDateKey(date: Date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function formatDayLabel(date: Date) {
    return date.toLocaleDateString([], {
        weekday: "short",
        day: "numeric",
        month: "short",
    });
}

function formatPostTime(dateString: string) {
    return new Date(dateString).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function buildDateTime(dateKey: string, time: string) {
    return `${dateKey}T${time}:00`;
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

export default function WeeklyCalendarView({
    posts,
    selectedDate,
    onReschedule,
}: Props) {
    const [draggingPostId, setDraggingPostId] = useState<string | null>(null);
    const [droppingCell, setDroppingCell] = useState<string | null>(null);

    const weekDays = useMemo(() => {
        const start = getStartOfWeek(selectedDate);
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            return d;
        });
    }, [selectedDate]);

    const groupedPosts = useMemo(() => {
        const map: Record<string, ScheduledLinkedInPost[]> = {};

        posts.forEach((post) => {
            const d = new Date(post.scheduledTime);
            const dateKey = formatDateKey(d);
            const hh = String(d.getHours()).padStart(2, "0");
            const timeKey = `${hh}:00`;
            const key = `${dateKey}_${timeKey}`;

            if (!map[key]) map[key] = [];
            map[key].push(post);
        });

        Object.keys(map).forEach((key) => {
            map[key].sort(
                (a, b) =>
                    new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
            );
        });

        return map;
    }, [posts]);

    const handleDrop = async (dateKey: string, time: string) => {
        if (!draggingPostId || !onReschedule) return;

        const cellKey = `${dateKey}_${time}`;
        try {
            setDroppingCell(cellKey);
            await onReschedule(draggingPostId, buildDateTime(dateKey, time));
        } finally {
            setDraggingPostId(null);
            setDroppingCell(null);
        }
    };

    return (
        <div className="rounded-3xl border border-white/10 bg-[#07122b]/90 p-5 shadow-2xl">
            <div className="mb-4">
                <h2 className="text-xl font-bold text-white">Weekly Calendar View</h2>
                <p className="mt-1 text-sm text-white/60">
                    Drag a scheduled post to another day and time slot.
                </p>
            </div>

            <div className="overflow-x-auto">
                <div className="min-w-[980px]">
                    <div className="grid grid-cols-8 gap-2">
                        <div className="rounded-xl bg-white/5 p-3 text-xs font-semibold text-white/50">
                            Time
                        </div>

                        {weekDays.map((day) => (
                            <div
                                key={formatDateKey(day)}
                                className="rounded-xl bg-white/5 p-3 text-center text-xs font-semibold text-white"
                            >
                                {formatDayLabel(day)}
                            </div>
                        ))}

                        {TIME_SLOTS.map((time) => (
                            <>
                                <div
                                    key={`label-${time}`}
                                    className="rounded-xl bg-black/20 p-3 text-xs font-medium text-[#b4aaff]"
                                >
                                    {time}
                                </div>

                                {weekDays.map((day) => {
                                    const dateKey = formatDateKey(day);
                                    const cellKey = `${dateKey}_${time}`;
                                    const cellPosts = groupedPosts[cellKey] || [];

                                    return (
                                        <div
                                            key={cellKey}
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={() => handleDrop(dateKey, time)}
                                            className={`min-h-[110px] rounded-xl border p-2 transition ${droppingCell === cellKey
                                                    ? "border-[#7367ff]/50 bg-[#7367ff]/10"
                                                    : "border-white/10 bg-white/5"
                                                }`}
                                        >
                                            {cellPosts.length === 0 ? (
                                                <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-white/10 text-[11px] text-white/30">
                                                    Drop here
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {cellPosts.map((post) => (
                                                        <div
                                                            key={post.id}
                                                            draggable
                                                            onDragStart={() => setDraggingPostId(post.id)}
                                                            onDragEnd={() => setDraggingPostId(null)}
                                                            className={`cursor-move rounded-lg border border-white/10 bg-black/25 p-2 ${draggingPostId === post.id ? "opacity-50" : ""
                                                                }`}
                                                        >
                                                            <div className="mb-1 flex items-center justify-between gap-2">
                                                                <span className="text-[10px] font-medium text-[#b4aaff]">
                                                                    {formatPostTime(post.scheduledTime)}
                                                                </span>
                                                                <span
                                                                    className={`rounded-md border px-2 py-0.5 text-[10px] font-medium ${getStatusClasses(
                                                                        post.status
                                                                    )}`}
                                                                >
                                                                    {post.status}
                                                                </span>
                                                            </div>

                                                            <p className="line-clamp-2 text-[11px] text-white/85">
                                                                {post.caption || "No caption"}
                                                            </p>

                                                            <div className="mt-1 text-[10px] text-white/45">
                                                                {post.account?.profileName ||
                                                                    post.account?.username ||
                                                                    post.account?.email ||
                                                                    "LinkedIn"}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}