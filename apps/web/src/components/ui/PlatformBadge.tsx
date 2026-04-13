interface PlatformBadgeProps {
    platform: string;
}

const platformStyles: Record<string, string> = {
    linkedin: "bg-blue-500/15 text-blue-300 border-blue-400/20",
    instagram: "bg-pink-500/15 text-pink-300 border-pink-400/20",
    facebook: "bg-indigo-500/15 text-indigo-300 border-indigo-400/20",
    twitter: "bg-sky-500/15 text-sky-300 border-sky-400/20",
    "twitter/x": "bg-sky-500/15 text-sky-300 border-sky-400/20",
    threads: "bg-neutral-500/15 text-neutral-200 border-white/15",
    youtube: "bg-red-500/15 text-red-300 border-red-400/20",
};

export default function PlatformBadge({ platform }: PlatformBadgeProps) {
    const key = platform.toLowerCase();
    const style =
        platformStyles[key] || "bg-white/10 text-white/70 border-white/10";

    return (
        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${style}`}>
            {platform}
        </span>
    );
}
