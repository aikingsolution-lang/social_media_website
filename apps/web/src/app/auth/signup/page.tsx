"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, Mail, User2 } from "lucide-react";
import { useState } from "react";
import AuthShowcase from "@/components/auth/AuthShowcase";
import { signupUser, loginUser, saveToken } from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      alert("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    if (!agreeTerms) {
      alert("You must agree to the terms.");
      return;
    }

    try {
      setLoading(true);
      await signupUser({ name, email, password });
      
      // Attempt login immediately after successful signup
      const loginRes = await loginUser({ email, password });
      if (loginRes?.token) {
        saveToken(loginRes.token);
      }
      
      alert("Account created successfully!");
      router.push("/dashboard");
    } catch (error: any) {
      alert(error.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="container-app grid min-h-[calc(100vh-2rem)] items-center gap-6 lg:grid-cols-2">
        <AuthShowcase
          title="Create your premium automation account"
          subtitle="Start managing social media accounts, schedule smart campaigns, and control everything with a modern SaaS interface."
        />

        <div className="glass-card mx-auto w-full max-w-xl p-8 sm:p-10">
          <div className="mb-8">
            <span className="badge-soft">Register</span>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-white">
              Create account
            </h2>
            <p className="mt-2 text-sm text-white/60">
              Fill in your details to create a new account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-white/75">
                Full name
              </label>
              <div className="relative">
                <User2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                <input
                  type="text"
                  placeholder="Enter your full name"
                  className="input-dark pl-11"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

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

            <div>
              <label className="mb-2 block text-sm font-medium text-white/75">
                Password
              </label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create password"
                  className="input-dark pl-11 pr-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/45 transition hover:text-white"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/75">
                Confirm password
              </label>
              <input
                type="password"
                placeholder="Confirm your password"
                className="input-dark"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <label className="flex items-start gap-3 text-sm text-white/60">
              <input 
                type="checkbox" 
                className="mt-1 rounded border-white/20 bg-transparent" 
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
              />
              <span>
                I agree to the terms and privacy policy of the platform.
              </span>
            </label>

            <button type="submit" className="primary-btn w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/60">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-semibold text-cyan-300 transition hover:text-cyan-200"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}