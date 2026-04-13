import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    iconClassName?: string;
    footer?: React.ReactNode;
}

export default function StatCard({
    title,
    value,
    icon: Icon,
    iconClassName = "bg-[#141d4f] text-[#7780ff]",
    footer,
}: StatCardProps) {
    return (
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#07122b]/90 p-5 shadow-xl">
            <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${iconClassName}`}>
                <Icon className="h-6 w-6" />
            </div>

            <p className="text-sm font-medium text-white/60">{title}</p>
            <h3 className="mt-2 text-3xl font-black text-white">{value}</h3>

            {footer ? <div className="mt-4 border-t border-white/10 pt-4">{footer}</div> : null}
        </div>
    );
}