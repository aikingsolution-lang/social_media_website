"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarRange,
  CheckCircle2,
  Clock3,
  LayoutList,
  Trash2,
  Wand2,
  XCircle,
  Send,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import StatCard from "@/components/ui/StatCard";
import Toast from "@/components/ui/Toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { apiFetch } from "@/lib/api";

type ScheduledPost = {
  id: string;
  caption: string;
  scheduledTime: string;
  status: string;
  accountId?: string;
  videoId?: string | null;
};

type Campaign = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  createdAt?: string;
  scheduledPosts: ScheduledPost[];
};

type CampaignsResponse = {
  campaigns: Campaign[];
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [duration, setDuration] = useState("30");

  const [creating, setCreating] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [toast, setToast] = useState({
    show: false,
    type: "info" as "success" | "error" | "info",
    message: "",
  });

  const showToast = (message: string, type: "success" | "error" | "info") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 2500);
  };

  const fetchCampaigns = async () => {
    try {
      setLoading(true);

      const data = await apiFetch<CampaignsResponse>("/api/campaigns", {
        method: "GET",
        auth: true,
      });

      setCampaigns(data?.campaigns || []);
    } catch (error: any) {
      showToast(error.message || "Failed to load campaigns", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const stats = useMemo(() => {
    const allPosts = campaigns.flatMap((c) => c.scheduledPosts || []);

    return {
      scheduled: allPosts.filter(
        (p) => p.status === "PENDING" || p.status === "QUEUED"
      ).length,
      posted: allPosts.filter((p) => p.status === "PUBLISHED").length,
      failed: allPosts.filter((p) => p.status === "FAILED").length,
      total: allPosts.length,
    };
  }, [campaigns]);

  const handleCreateCampaign = async () => {
    if (!name.trim()) {
      showToast("Please enter campaign name", "error");
      return;
    }

    if (!startDate) {
      showToast("Please select start date", "error");
      return;
    }

    const days = Number(duration);

    if (!days || days <= 0) {
      showToast("Please enter valid duration", "error");
      return;
    }

    try {
      setCreating(true);

      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(start.getDate() + days - 1);

      await apiFetch("/api/campaigns", {
        method: "POST",
        auth: true,
        body: {
          name,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        },
      });

      setName("");
      setStartDate("");
      setDuration("30");

      showToast("Campaign created successfully", "success");
      await fetchCampaigns();
    } catch (error: any) {
      showToast(error.message || "Failed to create campaign", "error");
    } finally {
      setCreating(false);
    }
  };

  const handleGenerateSchedule = async (campaign: Campaign) => {
    try {
      setGeneratingId(campaign.id);

      const start = new Date(campaign.startDate);
      const end = new Date(campaign.endDate);

      const diffDays =
        Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) +
        1;

      await apiFetch(`/api/campaigns/${campaign.id}/generate`, {
        method: "POST",
        auth: true,
        body: {
          startDate: start.toISOString(),
          durationDays: diffDays,
        },
      });

      showToast("Schedule generated successfully", "success");
      await fetchCampaigns();
    } catch (error: any) {
      showToast(error.message || "Failed to generate schedule", "error");
    } finally {
      setGeneratingId(null);
    }
  };

  const handlePublishNext = async (campaignId: string) => {
    try {
      setPublishingId(campaignId);

      await apiFetch(`/api/campaigns/${campaignId}/publish-next`, {
        method: "POST",
        auth: true,
      });

      showToast("Next posts published successfully", "success");
      await fetchCampaigns();
    } catch (error: any) {
      showToast(error.message || "Failed to publish posts", "error");
    } finally {
      setPublishingId(null);
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    try {
      setDeletingId(campaignId);

      await apiFetch(`/api/campaigns/${campaignId}`, {
        method: "DELETE",
        auth: true,
      });

      showToast("Campaign deleted successfully", "success");
      await fetchCampaigns();
    } catch (error: any) {
      showToast(error.message || "Failed to delete campaign", "error");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <Toast
        show={toast.show}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
      />

      <div>
        <PageHeader
          title="Scheduler"
          description="Create campaigns, generate posting schedules, publish queued posts, and manage your automation timeline."
          actions={
            <Button onClick={fetchCampaigns}>
              <LayoutList className="h-4 w-4" />
              Refresh Campaigns
            </Button>
          }
        />

        <div className="stats-grid">
          <StatCard
            title="Scheduled"
            value={stats.scheduled}
            icon={Clock3}
            iconClassName="bg-yellow-500/20 text-yellow-300"
          />
          <StatCard
            title="Posted"
            value={stats.posted}
            icon={CheckCircle2}
            iconClassName="bg-green-500/20 text-green-300"
          />
          <StatCard
            title="Failed"
            value={stats.failed}
            icon={XCircle}
            iconClassName="bg-red-500/20 text-red-300"
          />
          <StatCard
            title="Total Posts"
            value={stats.total}
            icon={CalendarRange}
            iconClassName="bg-purple-500/20 text-purple-300"
          />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Card
            title="Create Campaign"
            description="This form is connected to POST /api/campaigns."
          >
            <div className="space-y-4">
              <div>
                <label className="label-text">Campaign name</label>
                <input
                  className="input-dark"
                  placeholder="Enter campaign name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="label-text">Start date</label>
                <input
                  type="date"
                  className="input-dark"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div>
                <label className="label-text">Duration (days)</label>
                <input
                  className="input-dark"
                  placeholder="30"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>

              <Button onClick={handleCreateCampaign} disabled={creating} fullWidth>
                <Wand2 className="h-4 w-4" />
                {creating ? "Creating..." : "Create Campaign"}
              </Button>
            </div>
          </Card>

          <Card
            title="Campaign List"
            description="Loaded directly from GET /api/campaigns."
          >
            {loading ? (
              <LoadingSpinner text="Loading campaigns..." />
            ) : campaigns.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-8 text-center text-white/55">
                No campaigns created yet.
              </div>
            ) : (
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-white">
                          {campaign.name}
                        </h3>
                        <p className="mt-1 text-sm text-white/55">
                          {new Date(campaign.startDate).toLocaleDateString()} -{" "}
                          {new Date(campaign.endDate).toLocaleDateString()}
                        </p>
                        <p className="mt-2 text-sm text-white/70">
                          Scheduled posts: {campaign.scheduledPosts?.length || 0}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Button
                          variant="secondary"
                          onClick={() => handleGenerateSchedule(campaign)}
                          disabled={generatingId === campaign.id}
                        >
                          <CalendarRange className="h-4 w-4" />
                          {generatingId === campaign.id
                            ? "Generating..."
                            : "Generate"}
                        </Button>

                        <Button
                          onClick={() => handlePublishNext(campaign.id)}
                          disabled={publishingId === campaign.id}
                        >
                          <Send className="h-4 w-4" />
                          {publishingId === campaign.id
                            ? "Publishing..."
                            : "Publish Next"}
                        </Button>

                        <Button
                          variant="danger"
                          onClick={() => handleDeleteCampaign(campaign.id)}
                          disabled={deletingId === campaign.id}
                        >
                          <Trash2 className="h-4 w-4" />
                          {deletingId === campaign.id ? "Deleting..." : "Delete"}
                        </Button>
                      </div>
                    </div>

                    {campaign.scheduledPosts?.length > 0 ? (
                      <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
                        {campaign.scheduledPosts.slice(0, 5).map((post) => (
                          <div
                            key={post.id}
                            className="flex flex-col gap-2 rounded-xl bg-white/[0.03] p-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <p className="line-clamp-1 text-sm text-white">
                                {post.caption}
                              </p>
                              <p className="mt-1 text-xs text-white/50">
                                {new Date(post.scheduledTime).toLocaleString()}
                              </p>
                            </div>
                            <span className="inline-flex w-fit rounded-full bg-white/10 px-3 py-1 text-xs text-white/75">
                              {post.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}