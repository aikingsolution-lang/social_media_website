"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { buildLoginRedirectUrl, getToken, isTokenExpired, removeToken } from "@/lib/api";

export default function AuthGuard({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const token = getToken();
        const fullPath = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

        if (!token) {
            window.location.replace(buildLoginRedirectUrl(fullPath));
            return;
        }

        if (isTokenExpired(token)) {
            removeToken();
            window.location.replace(buildLoginRedirectUrl(fullPath));
            return;
        }

        setChecking(false);
    }, [pathname, searchParams]);

    if (checking) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center">
                <div className="glass-card w-full max-w-md p-8 text-center">
                    <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-[#7a74ff]" />
                    <h2 className="text-xl font-bold text-white">Checking authentication...</h2>
                    <p className="mt-2 text-sm text-white/55">
                        Please wait while we verify your session.
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}