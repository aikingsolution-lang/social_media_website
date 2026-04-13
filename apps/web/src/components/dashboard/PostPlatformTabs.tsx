"use client";

interface PostPlatformTabsProps {
    selected: string;
    onChange: (value: string) => void;
}

const tabs = [
    "LinkedIn",
    "Instagram",
    "Facebook",
    "Twitter/X",
    "Threads",
    "YouTube",
];

export default function PostPlatformTabs({
    selected,
    onChange,
}: PostPlatformTabsProps) {
    return (
        <div className="flex flex-wrap gap-3">
            {tabs.map((tab) => {
                const active = selected === tab;
                return (
                    <button
                        key={tab}
                        type="button"
                        onClick={() => onChange(tab)}
                        className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${active
                                ? "bg-gradient-to-r from-[#6d6bff] to-[#9c59ff] text-white shadow-[0_0_24px_rgba(115,103,255,0.25)]"
                                : "border border-white/10 bg-white/5 text-white/75 hover:bg-white/10 hover:text-white"
                            }`}
                    >
                        {tab}
                    </button>
                );
            })}
        </div>
    );
}