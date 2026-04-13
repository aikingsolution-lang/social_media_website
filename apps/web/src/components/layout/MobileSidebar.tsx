"use client";

import Link from "next/link";
import { X, Home, Layers3, Upload, Users, FileText, CalendarDays } from "lucide-react";
import { usePathname } from "next/navigation";
import AppLogo from "./AppLogo";

const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/dashboard", label: "Overview", icon: Layers3 },
    { href: "/dashboard/upload", label: "Upload Media", icon: Upload },
    { href: "/dashboard/accounts", label: "Social Accounts", icon: Users },
    { href: "/dashboard/posts", label: "Posts", icon: FileText },
    { href: "/dashboard/campaigns", label: "Scheduler", icon: CalendarDays },
];

interface MobileSidebarProps {
    open: boolean;
    onClose: () => void;
}

export default function MobileSidebar({
    open,
    onClose,
}: MobileSidebarProps) {
    const pathname = usePathname();

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 xl:hidden">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="absolute left-0 top-0 h-full w-[88%] max-w-[320px] border-r border-white/10 bg-slate-950 p-5 shadow-2xl">
                <div className="mb-8 flex items-center justify-between">
                    <AppLogo href="/" />
                    <button
                        type="button"
                        onClick={onClose}
                        className="secondary-btn !h-10 !w-10 !px-0"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <nav className="flex flex-col gap-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive =
                            item.href === "/dashboard"
                                ? pathname === "/dashboard"
                                : pathname.startsWith(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                className={`sidebar-link ${isActive ? "sidebar-link-active" : ""}`}
                            >
                                <Icon className="h-4 w-4" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}