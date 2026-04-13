"use client";

import { useState } from "react";
import DashboardSidebar from "./DashboardSidebar";
import DashboardTopbar from "./DashboardTopbar";
import MobileSidebar from "./MobileSidebar";

export default function DashboardShell({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen text-white">
            <MobileSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="dashboard-grid min-h-screen">
                <DashboardSidebar />

                <div className="min-h-screen">
                    <DashboardTopbar onOpenSidebar={() => setSidebarOpen(true)} />
                    <main className="page-wrap">{children}</main>
                </div>
            </div>
        </div>
    );
}