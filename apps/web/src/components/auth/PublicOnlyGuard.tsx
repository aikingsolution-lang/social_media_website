"use client";

import { useEffect, useState } from "react";
import { isAuthenticated } from "@/lib/api";

export default function PublicOnlyGuard({
    children,
    redirectTo = "/dashboard",
}: {
    children: React.ReactNode;
    redirectTo?: string;
}) {
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        if (isAuthenticated()) {
            window.location.replace(redirectTo);
            return;
        }

        setChecking(false);
    }, [redirectTo]);

    if (checking) {
        return (
            <div className="flex min-h-screen items-center justify-center px-4">
                <div className="glass-card w-full max-w-md p-8 text-center">
                    <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-[#7a74ff]" />
                    <h2 className="text-xl font-bold text-white">Loading...</h2>
                    <p className="mt-2 text-sm text-white/55">
                        Checking your session.
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}