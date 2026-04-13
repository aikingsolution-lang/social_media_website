"use client";

import Link from "next/link";
import { Mail } from "lucide-react";
import { useState } from "react";
import AuthShowcase from "@/components/auth/AuthShowcase";
import { forgotPassword } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      alert("Please enter your email.");
      return;
    }

    try {
      setLoading(true);

      await forgotPassword({ email });

      // ✅ Redirect to reset page with email
      router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`);

    } catch (error: any) {
      alert(error.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="container-app grid min-h-[calc(100vh-2rem)] items-center gap-6 lg:grid-cols-2">
        <AuthShowcase
          title="Recover your automation workspace"
          subtitle="Enter your email to receive a secure link to reset your password and regain access securely."
        />

        <div className="glass-card mx-auto w-full max-w-xl p-8 sm:p-10">
          <div className="mb-8">
            <span className="badge-soft">Recovery</span>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-white">
              Forgot password
            </h2>
            <p className="mt-2 text-sm text-white/60">
              We will send you a password reset link to your registered email.
            </p>
          </div>

          {success ? (
            <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-6 text-center">
              <h3 className="mb-2 font-semibold text-green-400">
                Check your email
              </h3>
              <p className="text-sm text-green-400/80">
                If an account exists with {email}, we have sent a 6-digit OTP to that email.
                Please check your inbox and spam folder.
              </p>
              <p className="mt-3 text-xs text-white/50">
                In development mode, also check your backend terminal for the reset URL.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/75">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
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

              <button
                type="submit"
                className="primary-btn w-full"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>
          )}

          <p className="mt-8 text-center text-sm text-white/60">
            Remember your password?{" "}
            <Link
              href="/auth/login"
              className="font-semibold text-cyan-300 transition hover:text-cyan-200"
            >
              Sign in back
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}