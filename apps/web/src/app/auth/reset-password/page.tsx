"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LockKeyhole, Eye, EyeOff, Mail, ShieldCheck } from "lucide-react";
import AuthShowcase from "@/components/auth/AuthShowcase";
import { resetPassword } from "@/lib/api";
import Link from "next/link";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const emailFromUrl = searchParams.get("email");
    if (emailFromUrl) {
      setEmail(emailFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        router.push("/auth/login");
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [success, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !otp || !password || !confirmPassword) {
      alert("Please fill all fields");
      return;
    }

    if (otp.length !== 6) {
      alert("OTP must be 6 digits");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      await resetPassword({
        email,
        otp,
        password,
      });

      setSuccess(true);
    } catch (error: any) {
      alert(error.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="container-app grid min-h-[calc(100vh-2rem)] items-center gap-6 lg:grid-cols-2">
        <AuthShowcase
          title="Secure your account"
          subtitle="Enter OTP and create a new password"
        />

        <div className="glass-card mx-auto w-full max-w-xl p-8">
          <h2 className="mb-6 text-3xl font-bold text-white">
            Reset Password
          </h2>

          {success ? (
            <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-6 text-center">
              <h3 className="mb-2 text-xl font-semibold text-green-400">
                Password updated successfully
              </h3>
              <p className="mb-4 text-sm text-green-300/80">
                Redirecting to login page...
              </p>
              <button
                onClick={() => router.push("/auth/login")}
                className="primary-btn w-full"
              >
                Go to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-sm text-white/70">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-white/40" />
                  <input
                    type="email"
                    className="input-dark pl-10"
                    placeholder="Enter email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-white/70">OTP</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-3 text-white/40" />
                  <input
                    type="text"
                    maxLength={6}
                    className="input-dark pl-10 text-center tracking-widest"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-white/70">New Password</label>
                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-3 text-white/40" />
                  <input
                    type={showPassword ? "text" : "password"}
                    className="input-dark pl-10 pr-10"
                    placeholder="New password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-white/40"
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm text-white/70">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="input-dark pr-10"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    className="absolute right-3 top-3 text-white/40"
                  >
                    {showConfirmPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>

              <button className="primary-btn w-full" disabled={loading}>
                {loading ? "Updating..." : "Reset Password"}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-white/60">
            Back to{" "}
            <Link href="/auth/login" className="text-cyan-300">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-black text-white">
          Loading...
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}