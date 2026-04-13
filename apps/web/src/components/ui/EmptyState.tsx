import React from "react";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: React.ReactNode;
}

export default function EmptyState({
    icon: Icon,
    title,
    description,
    action,
}: EmptyStateProps) {
    return (
        <div className="glass-card flex min-h-[260px] flex-col items-center justify-center px-6 py-10 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-white/5 text-[#7a74ff]">
                <Icon className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-white">{title}</h3>
            <p className="mt-3 max-w-md text-sm leading-6 text-white/60">
                {description}
            </p>
            {action ? <div className="mt-6">{action}</div> : null}
        </div>
    );
}