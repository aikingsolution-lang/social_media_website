interface TimelinePost {
    id: string;
    platform: string;
    time: string;
    title: string;
    status: "Scheduled" | "Published" | "Failed";
}

interface SchedulerTimelineProps {
    posts: TimelinePost[];
}

export default function SchedulerTimeline({
    posts,
}: SchedulerTimelineProps) {
    if (!posts.length) {
        return (
            <div className="flex min-h-[320px] items-center justify-center rounded-[28px] border border-dashed border-white/10 bg-white/[0.03] p-6 text-center text-white/45">
                No posts in timeline.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {posts.map((post) => (
                <div
                    key={post.id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm font-semibold text-white">{post.title}</p>
                            <p className="mt-1 text-xs text-white/55">
                                {post.platform} • {post.time}
                            </p>
                        </div>

                        <span
                            className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-medium ${post.status === "Published"
                                    ? "bg-green-500/10 text-green-300"
                                    : post.status === "Failed"
                                        ? "bg-red-500/10 text-red-300"
                                        : "bg-yellow-500/10 text-yellow-300"
                                }`}
                        >
                            {post.status}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}