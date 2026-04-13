"use client";

import {
  Activity,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Globe2,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import OverviewMetricCard from "@/components/dashboard/OverviewMetricCard";
import { getDashboardStats } from "@/lib/api";

type DashboardStats = {
  totalVideos: number;
  totalAccounts: number;
  totalCampaigns: number;
  totalScheduledPosts: number;
  pendingPosts: number;
  queuedPosts: number;
  publishingPosts: number;
  publishedPosts: number;
  failedPosts: number;
};

type RecentPost = {
  id: string;
  caption: string;
  status?: string;
  createdAt?: string;
  account?: {
    platform?: string;
  };
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalVideos: 0,
    totalAccounts: 0,
    totalCampaigns: 0,
    totalScheduledPosts: 0,
    pendingPosts: 0,
    queuedPosts: 0,
    publishingPosts: 0,
    publishedPosts: 0,
    failedPosts: 0,
  });
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const res = await getDashboardStats();
        setStats(res?.stats || {});
        setRecentPosts(res?.recentPosts || []);
      } catch (error: any) {
        console.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  return (
    <div className="space-y-6">
      <section className="glass-card-strong overflow-hidden p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
          <div>
            <span className="badge-soft">
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              Professional Control Dashboard
            </span>

            <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
              Welcome to your <span className="hero-gradient-text">automation dashboard</span>
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/65 sm:text-base">
              Manage accounts, scheduled posts, campaigns, uploads, and analytics
              from one premium UI.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button className="primary-btn" type="button">Launch Campaign</button>
              <button className="secondary-btn" type="button">View Analytics</button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/60">Automation Health</p>
                <Activity className="h-4 w-4 text-cyan-300" />
              </div>
              <h3 className="mt-3 text-3xl font-black">
                {loading ? "..." : `${stats.totalScheduledPosts}`}
              </h3>
              <p className="mt-2 text-sm text-emerald-300">
                Total scheduled workflow items
              </p>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/60">Connected Platforms</p>
                <Globe2 className="h-4 w-4 text-violet-300" />
              </div>
              <h3 className="mt-3 text-3xl font-black">
                {loading ? "..." : stats.totalAccounts}
              </h3>
              <p className="mt-2 text-sm text-white/55">
                Connected social media accounts
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-grid">
        <OverviewMetricCard
          title="Total Posts"
          value={loading ? "..." : String(stats.totalScheduledPosts)}
          change="+0%"
          icon={TrendingUp}
        />
        <OverviewMetricCard
          title="Pending Posts"
          value={loading ? "..." : String(stats.pendingPosts)}
          change="+0%"
          icon={CalendarClock}
        />
        <OverviewMetricCard
          title="Published"
          value={loading ? "..." : String(stats.publishedPosts)}
          change="+0%"
          icon={CheckCircle2}
        />
        <OverviewMetricCard
          title="Connected Accounts"
          value={loading ? "..." : String(stats.totalAccounts)}
          change="+0%"
          icon={Users}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="glass-card p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="title-lg">Recent Posts</h2>
              <p className="text-muted mt-1">Latest activity from your dashboard</p>
            </div>
            <span className="badge-soft">Live data</span>
          </div>

          <div className="space-y-4">
            {recentPosts.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/60">
                No recent posts found
              </div>
            ) : (
              recentPosts.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-2.5 w-2.5 rounded-full bg-cyan-400" />
                    <div>
                      <p className="max-w-[420px] truncate font-medium text-white">
                        {item.caption}
                      </p>
                      <p className="mt-1 text-sm text-white/50">
                        {item.account?.platform || "Unknown platform"}
                      </p>
                    </div>
                  </div>

                  <span className="badge-soft">{item.status || "PENDING"}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="title-lg">Queue Summary</h2>
                <p className="text-muted mt-1">Live post pipeline status</p>
              </div>
              <Clock3 className="h-5 w-5 text-white/55" />
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-semibold text-white">Pending</p>
                <p className="mt-1 text-sm text-white/55">{stats.pendingPosts} posts waiting</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-semibold text-white">Queued</p>
                <p className="mt-1 text-sm text-white/55">{stats.queuedPosts} queued posts</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-semibold text-white">Published</p>
                <p className="mt-1 text-sm text-white/55">{stats.publishedPosts} completed posts</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-semibold text-white">Failed</p>
                <p className="mt-1 text-sm text-white/55">{stats.failedPosts} failed posts</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="title-lg">Quick Summary</h2>
                <p className="text-muted mt-1">Your current project overview</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/55">Videos</p>
                <p className="mt-2 text-2xl font-black text-white">{stats.totalVideos}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/55">Campaigns</p>
                <p className="mt-2 text-2xl font-black text-white">{stats.totalCampaigns}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}