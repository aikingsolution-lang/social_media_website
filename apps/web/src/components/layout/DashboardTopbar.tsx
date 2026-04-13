"use client";

import Link from "next/link";
import { Bell, Menu, Plus, Search } from "lucide-react";
import AppLogo from "./AppLogo";

interface DashboardTopbarProps {
    onOpenSidebar: () => void;
}

export default function DashboardTopbar({
    onOpenSidebar,
}: DashboardTopbarProps) {
    return (
        <header className="topbar-blur">
            <div className="container-app flex h-20 items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onOpenSidebar}
                        className="secondary-btn !h-11 !w-11 !px-0 xl:hidden"
                        aria-label="Open sidebar"
                        type="button"
                    >
                        <Menu className="h-5 w-5" />
                    </button>

                    <div className="xl:hidden">
                        <AppLogo href="/" />
                    </div>
                </div>

                <div className="hidden max-w-xl flex-1 lg:flex">
                    <div className="relative w-full">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                        <input
                            type="text"
                            placeholder="Search posts, campaigns, accounts..."
                            className="input-dark pl-11"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        className="secondary-btn !h-11 !w-11 !px-0 relative"
                        type="button"
                    >
                        <Bell className="h-4 w-4" />
                        <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-cyan-400" />
                    </button>

                    <Link href="/dashboard/posts" className="primary-btn hidden sm:inline-flex">
                        <Plus className="h-4 w-4" />
                        Create Post
                    </Link>
                </div>
            </div>
        </header>
    );
}