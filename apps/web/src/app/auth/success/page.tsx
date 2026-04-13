"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveToken } from "@/lib/api";

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      saveToken(token);
      router.push("/dashboard");
    } else {
      router.push("/auth/login?error=Invalid+OAuth+Token");
    }
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="glass-card p-8 text-center">
        <h2 className="text-xl font-bold text-white">Completing login...</h2>
        <p className="mt-2 text-sm text-white/50">Please wait while we redirect you to your dashboard.</p>
      </div>
    </div>
  );
}

export default function AuthSuccessPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-white">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
