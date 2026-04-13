"use client";

import {
    CheckCircle2,
    ExternalLink,
    RefreshCcw,
    Unplug,
} from "lucide-react";

interface AccountCardProps {
    id: string;
    platform: string;
    username: string;
    status: "Connected" | "Pending" | "Expired";
    followers: string;
    onDisconnect?: (id: string) => void;
}

export default function AccountCard({
    id,
    platform,
    username,
    status,
    followers,
    onDisconnect,
}: AccountCardProps) {
    const statusStyles =
        status === "Connected"
            ? "bg-emerald-500/15 text-emerald-300"
            : status === "Pending"
                ? "bg-amber-500/15 text-amber-300"
                : "bg-red-500/15 text-red-300";

    return (
        <div className="glass-card p-5">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <span className="badge-soft">{platform}</span>
                    <h3 className="mt-3 text-xl font-bold text-white">{username}</h3>
                    <p className="mt-1 text-sm text-white/55">{followers} followers</p>
                </div>

                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles}`}>
                    {status}
                </span>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
                <button className="secondary-btn !px-3" type="button">
                    <ExternalLink className="h-4 w-4" />
                    View
                </button>
                <button className="secondary-btn !px-3" type="button">
                    <RefreshCcw className="h-4 w-4" />
                    Refresh
                </button>
                <button
                    className="secondary-btn !px-3"
                    type="button"
                    onClick={() => onDisconnect?.(id)}
                >
                    <Unplug className="h-4 w-4" />
                    Disconnect
                </button>
            </div>

            {status === "Connected" && (
                <div className="mt-5 flex items-center gap-2 text-sm text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" />
                    Active and ready for publishing
                </div>
            )}
        </div>
    );
}