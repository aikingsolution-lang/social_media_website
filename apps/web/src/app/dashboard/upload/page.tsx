"use client";

import { useState } from "react";
import { Film, Sparkles, Tag, Upload, Video } from "lucide-react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import UploadDropzone from "@/components/dashboard/UploadDropzone";
import { apiFetch, getToken, API_URL } from "@/lib/api";
import { useToast } from "@/context/ToastContext";

export default function UploadPage() {
  const { showToast } = useToast();

  const [title, setTitle] = useState("");
  const [niche, setNiche] = useState("");
  const [keywords, setKeywords] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file || !title.trim()) {
      showToast("Please enter a title and choose a video file.", "error");
      return;
    }

    try {
      setLoading(true);

      const token = getToken();
      const formData = new FormData();
      formData.append("title", title);
      formData.append("niche", niche);
      formData.append("keywords", keywords);
      formData.append("video", file);

      const res = await fetch(`${API_URL}/api/videos/upload`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || "Upload failed");
      }

      showToast("Video uploaded successfully.", "success");
      setTitle("");
      setNiche("");
      setKeywords("");
      setFile(null);
    } catch (error: any) {
      showToast(error.message || "Something went wrong.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Upload Media"
        description="Build your content library with clean metadata so you can reuse videos across posts, campaigns, and schedules."
        actions={
          <Button>
            <Upload className="h-4 w-4" />
            Upload New Media
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card
          title="Media Upload"
          description="Add your next piece of content to the automation pipeline."
        >
          <UploadDropzone
            fileName={file?.name}
            onChange={(e) => {
              const selected = e.target.files?.[0];
              if (selected) setFile(selected);
            }}
          />
        </Card>

        <div className="space-y-6">
          <Card
            title="Video Details"
            description="Structured details help AI planning and faster post creation."
          >
            <div className="space-y-4">
              <Input
                label="Video title"
                placeholder="Enter a professional title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <Input
                label="Niche"
                placeholder="Example: marketing, tech, education"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
              />

              <Input
                label="Keywords"
                placeholder="Example: growth, reels, startup, strategy"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
              />

              <Button fullWidth onClick={handleUpload} disabled={loading}>
                {loading ? "Uploading..." : "Submit Video"}
              </Button>
            </div>
          </Card>

          <Card title="Upload Tips" description="A few quick rules for better media management.">
            <div className="space-y-4 text-sm text-white/65">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-[#7a74ff]">
                  <Video className="h-4 w-4" />
                </div>
                <p>Use short, platform-ready videos for better publishing flexibility.</p>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-[#7a74ff]">
                  <Tag className="h-4 w-4" />
                </div>
                <p>Add meaningful keywords to quickly find content during post creation.</p>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-[#7a74ff]">
                  <Sparkles className="h-4 w-4" />
                </div>
                <p>Consistent metadata improves caption generation and scheduling suggestions.</p>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-[#7a74ff]">
                  <Film className="h-4 w-4" />
                </div>
                <p>Keep files optimized and clearly named before upload for team workflows.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}