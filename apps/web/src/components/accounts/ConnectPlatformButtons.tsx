"use client";

import { connectPlatform } from "@/lib/api";
import { Linkedin, Instagram, Twitter, Facebook, Youtube } from "lucide-react";

// Threads uses a custom logo not available in lucide-react
const ThreadsIcon = ({ className }: { className?: string }) => (
    <svg
        className={className}
        viewBox="0 0 192 192"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M141.537 88.988a66.667 66.667 0 0 0-2.518-1.143c-1.482-27.307-16.403-42.94-41.457-43.1h-.34c-14.986 0-27.449 6.396-35.12 18.036l13.779 9.452c5.73-8.695 14.724-10.548 21.348-10.548h.23c8.248.054 14.474 2.452 18.502 7.13 2.932 3.405 4.893 8.11 5.864 14.05-7.314-1.244-15.224-1.626-23.68-1.14-23.82 1.371-39.134 15.264-38.105 34.568.522 9.792 5.4 18.216 13.735 23.719 7.047 4.652 16.124 6.927 25.557 6.412 12.458-.683 22.231-5.436 29.049-14.127 5.178-6.6 8.453-15.153 9.899-25.93 5.937 3.583 10.337 8.298 12.767 13.966 4.132 9.635 4.373 25.468-8.546 38.376-11.319 11.308-24.925 16.2-45.488 16.351-22.809-.169-40.06-7.484-51.275-21.741C35.236 139.966 29.808 120.682 29.605 96c.203-24.682 5.63-43.966 16.133-57.317C56.954 24.425 74.204 17.11 97.013 16.94c22.975.17 40.526 7.52 52.171 21.847 5.71 7.026 9.986 15.976 12.737 26.56l16.146-4.308c-3.42-12.9-8.797-24.04-16.053-33.158C147.036 9.607 125.202.195 97.07 0h-.113C68.882.195 47.292 9.643 32.788 28.054 19.882 44.487 13.224 67.315 13.001 96c.223 28.685 6.88 51.513 19.787 67.946 14.504 18.411 36.094 27.859 64.172 28.054h.113c24.986-.173 42.549-6.713 57.04-21.192 18.963-18.952 18.392-42.654 12.142-57.223-4.484-10.454-13.033-18.935-24.718-24.597ZM96.4 128.282c-10.43.576-21.258-4.098-21.83-14.135-.424-7.945 5.67-16.813 24.01-17.866 2.099-.12 4.16-.178 6.181-.178 6.109 0 11.822.572 17.012 1.679-1.937 24.18-15.42 29.923-25.373 30.5Z" />
    </svg>
);

const platforms = [
    {
        key: "linkedin",
        label: "LinkedIn",
        icon: <Linkedin className="h-5 w-5 text-[#0A66C2]" />,
        hoverBg: "hover:bg-[#0A66C2]/20",
        hoverBorder: "hover:border-[#0A66C2]/50",
    },
    {
        key: "instagram",
        label: "Instagram",
        icon: <Instagram className="h-5 w-5 text-[#E4405F]" />,
        hoverBg: "hover:bg-[#E4405F]/20",
        hoverBorder: "hover:border-[#E4405F]/50",
    },
    {
        key: "twitter",
        label: "Twitter / X",
        icon: <Twitter className="h-5 w-5 text-[#1DA1F2]" />,
        hoverBg: "hover:bg-[#1DA1F2]/20",
        hoverBorder: "hover:border-[#1DA1F2]/50",
    },
    {
        key: "facebook",
        label: "Facebook",
        icon: <Facebook className="h-5 w-5 text-[#1877F2]" />,
        hoverBg: "hover:bg-[#1877F2]/20",
        hoverBorder: "hover:border-[#1877F2]/50",
    },
    {
        key: "youtube",
        label: "YouTube",
        icon: <Youtube className="h-5 w-5 text-[#FF0000]" />,
        hoverBg: "hover:bg-[#FF0000]/20",
        hoverBorder: "hover:border-[#FF0000]/50",
    },
    {
        key: "threads",
        label: "Threads",
        icon: <ThreadsIcon className="h-5 w-5 text-white" />,
        hoverBg: "hover:bg-white/10",
        hoverBorder: "hover:border-white/30",
    },
];

export default function ConnectPlatformButtons() {
    const handleConnect = (platform: string) => {
        connectPlatform(platform);
    };

    return (
        <section className="glass-card p-6">
            <h3 className="mb-4 text-lg font-bold text-white">Connect New Platform</h3>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
                {platforms.map(({ key, label, icon, hoverBg, hoverBorder }) => (
                    <button
                        key={key}
                        onClick={() => handleConnect(key)}
                        className={`flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 p-4 text-sm font-semibold text-white transition-all ${hoverBg} ${hoverBorder}`}
                    >
                        {icon}
                        {label}
                    </button>
                ))}
            </div>
        </section>
    );
}
