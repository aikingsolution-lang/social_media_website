import { Suspense } from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import AuthGuard from "@/components/auth/AuthGuard";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="glass-card w-full max-w-md p-8 text-center"><div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-[#7a74ff]" /><h2 className="text-xl font-bold text-white">Loading...</h2></div></div>}>
            <AuthGuard>
                <DashboardShell>{children}</DashboardShell>
            </AuthGuard>
        </Suspense>
    );
}