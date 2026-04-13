"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    BarChart3,
    CalendarDays,
    FileText,
    Home,
    Layers3,
    LogOut,
    MessageSquareText,
    Sparkles,
    Upload,
    UserCircle2,
    Users,
} from "lucide-react";
import AppLogo from "./AppLogo";
import { logoutUser } from "@/lib/api";
import { useToast } from "@/context/ToastContext";

const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/dashboard", label: "Overview", icon: Layers3 },
    { href: "/dashboard/upload", label: "Upload Media", icon: Upload },
    { href: "/dashboard/accounts", label: "Social Accounts", icon: Users },
    { href: "/dashboard/posts", label: "Posts", icon: FileText },
    { href: "/dashboard/campaigns", label: "Scheduler", icon: CalendarDays },
];

export default function DashboardSidebar() {
    const pathname = usePathname();
    const { showToast } = useToast();

    const handleLogout = () => {
        showToast("Logged out successfully", "success");
        setTimeout(() => logoutUser(), 400);
    };

    return (
        <aside className="hidden min-h-screen border-r border-white/10 bg-slate-950/75 p-5 backdrop-blur-xl xl:flex xl:flex-col">
            <div className="mb-8">
                <AppLogo href="/" />
            </div>

            <div className="glass-card-strong mb-6 p-4">
                <div className="mb-4 flex items-center justify-between">
                    <span className="badge-soft">AI Automation</span>
                    <Sparkles className="h-4 w-4 text-cyan-300" />
                </div>

                <h3 className="text-lg font-bold text-white">Control Center</h3>
                <p className="mt-1 text-sm text-white/60">
                    Manage accounts, schedule content, and monitor performance in one place.
                </p>
            </div>

            <nav className="flex flex-1 flex-col gap-2">
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
                            className={`sidebar-link ${isActive ? "sidebar-link-active" : ""}`}
                        >
                            <Icon className="h-4 w-4" />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="glass-card mt-6 p-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600/30 to-blue-600/30">
                        <UserCircle2 className="h-6 w-6 text-white" />
                    </div>

                    <div>
                        <p className="font-semibold text-white">Karan Garje</p>
                        <p className="text-xs text-white/55">Social Automation Admin</p>
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <div className="flex items-center gap-2 text-white/70">
                            <BarChart3 className="h-4 w-4" />
                            <span className="text-xs">Growth</span>
                        </div>
                        <p className="mt-2 text-lg font-bold text-white">+24%</p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <div className="flex items-center gap-2 text-white/70">
                            <MessageSquareText className="h-4 w-4" />
                            <span className="text-xs">Engagement</span>
                        </div>
                        <p className="mt-2 text-lg font-bold text-white">8.9k</p>
                    </div>
                </div>

                <button
                    className="secondary-btn mt-4 w-full"
                    onClick={handleLogout}
                    type="button"
                >
                    <LogOut className="h-4 w-4" />
                    Logout
                </button>
            </div>
        </aside>
    );
}