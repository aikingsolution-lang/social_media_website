"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useState } from "react";
import AuthShowcase from "@/components/auth/AuthShowcase";
import { loginUser, saveToken, isTokenExpired } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const redirect = searchParams.get("redirect");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);

      const res = await loginUser({ email, password });

      if (!res?.token) {
        throw new Error("Invalid login response");
      }

      // save token
      saveToken(res.token);

      // optional: check token validity
      if (isTokenExpired(res.token)) {
        throw new Error("Session expired. Please login again.");
      }

      // redirect
      router.push(redirect || "/dashboard");
    } catch (error: any) {
      alert(error.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthClick = (provider: "Google" | "GitHub") => {
    const backendUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

    if (provider === "Google") {
      window.location.href = `${backendUrl}/api/auth/google`;
    } else {
      window.location.href = `${backendUrl}/api/auth/github`;
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="container-app grid min-h-[calc(100vh-2rem)] items-center gap-6 lg:grid-cols-2">
        <AuthShowcase
          title="Welcome back to your automation workspace"
          subtitle="Sign in to manage posts, accounts, campaigns, analytics, and AI-generated content."
        />

        <div className="glass-card mx-auto w-full max-w-xl p-8 sm:p-10">
          <div className="mb-8">
            <span className="badge-soft">Login</span>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-white">
              Sign in
            </h2>
            <p className="mt-2 text-sm text-white/60">
              Enter your email and password to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-white/75">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35 h-4 w-4" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="input-dark pl-11"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/75">
                Password
              </label>
              <div className="relative">
                <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35 h-4 w-4" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="input-dark pl-11 pr-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/45 hover:text-white"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-white/60">
                <input type="checkbox" />
                Remember me
              </label>

              <Link
                href="/auth/forgot-password"
                className="text-sm text-cyan-300 hover:text-cyan-200"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="primary-btn w-full"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs uppercase text-white/35">
              Or continue
            </span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => handleOAuthClick("Google")}
              className="secondary-btn w-full"
            >
              Google
            </button>

            <button
              type="button"
              onClick={() => handleOAuthClick("GitHub")}
              className="secondary-btn w-full"
            >
              GitHub
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-white/60">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/signup"
              className="text-cyan-300 hover:text-cyan-200"
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}