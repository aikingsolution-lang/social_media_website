"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";
import {
  Plus,
  Upload,
  X,
  Image as ImageIcon,
  Video,
  Loader2,
  Check,
} from "lucide-react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

type SocialAccount = {
  id: string;
  platform: string;
  accountName: string;
  status?: string;
};

export type UploadedFileItem = {
  url: string;
  type: "image" | "video";
  name: string;
  resourceType?: string;
};

type CreatePostCardProps = {
  accounts: SocialAccount[];
  selectedAccountIds: string[];
  setSelectedAccountIds: React.Dispatch<React.SetStateAction<string[]>>;
  caption: string;
  setCaption: (value: string) => void;
  uploadedFiles: UploadedFileItem[];
  setUploadedFiles: React.Dispatch<React.SetStateAction<UploadedFileItem[]>>;
  onPublish: () => void;
};

export default function CreatePostCard({
  accounts,
  selectedAccountIds,
  setSelectedAccountIds,
  caption,
  setCaption,
  uploadedFiles,
  setUploadedFiles,
  onPublish,
}: CreatePostCardProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const groupedAccounts = useMemo(() => {
    return accounts.reduce<Record<string, SocialAccount[]>>((acc, account) => {
      const platform = account.platform?.toLowerCase() || "other";
      acc[platform] ||= [];
      acc[platform].push(account);
      return acc;
    }, {});
  }, [accounts]);

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function toggleAccount(accountId: string) {
    setSelectedAccountIds((prev) =>
      prev.includes(accountId)
        ? prev.filter((id) => id !== accountId)
        : [...prev, accountId]
    );
  }

  function selectAllPlatform(platform: string) {
    const platformAccountIds = groupedAccounts[platform].map((item) => item.id);

    const allSelected = platformAccountIds.every((id) =>
      selectedAccountIds.includes(id)
    );

    setSelectedAccountIds((prev) =>
      allSelected
        ? prev.filter((id) => !platformAccountIds.includes(id))
        : Array.from(new Set([...prev, ...platformAccountIds]))
    );
  }

  function clearSelectedAccounts() {
    setSelectedAccountIds([]);
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const selectedFiles = Array.from(files);
    const imageFiles = selectedFiles.filter((file) =>
      file.type.startsWith("image/")
    );
    const videoFiles = selectedFiles.filter((file) =>
      file.type.startsWith("video/")
    );

    if (videoFiles.length > 1) {
      alert("You can upload only one video.");
      event.target.value = "";
      return;
    }

    if (videoFiles.length > 0 && imageFiles.length > 0) {
      alert("Please upload either multiple images or one video.");
      event.target.value = "";
      return;
    }

    if (
      videoFiles.length > 0 &&
      uploadedFiles.some((file) => file.type === "image")
    ) {
      alert("Remove existing images before uploading a video.");
      event.target.value = "";
      return;
    }

    if (
      imageFiles.length > 0 &&
      uploadedFiles.some((file) => file.type === "video")
    ) {
      alert("Remove existing video before uploading images.");
      event.target.value = "";
      return;
    }

    try {
      setUploading(true);

      const token = localStorage.getItem("token");
      const newUploadedItems: UploadedFileItem[] = [];

      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(`${API_BASE_URL}/api/upload`, {
          method: "POST",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.message || "Failed to upload media");
        }

        const fileUrl =
          data?.file?.url || data?.file?.path || data?.url || data?.path;

        if (!fileUrl) {
          throw new Error("Uploaded file URL not found");
        }

        const resourceType =
          data?.file?.resourceType ||
          data?.file?.resource_type ||
          (file.type.startsWith("video/") ? "video" : "image");

        newUploadedItems.push({
          url: fileUrl,
          type: resourceType === "video" ? "video" : "image",
          name: data?.file?.originalname || file.name,
          resourceType,
        });
      }

      setUploadedFiles((prev) => [...prev, ...newUploadedItems]);
    } catch (error: any) {
      console.error("Upload error:", error);
      alert(error.message || "Failed to upload media");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  function removeUploadedFile(index: number) {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function clearAllMedia() {
    setUploadedFiles([]);
  }

  return (
    <div className="rounded-[28px] border border-white/10 bg-[#071225] p-6 shadow-[0_0_30px_rgba(79,70,229,0.08)]">
      <div className="mb-5 flex items-start gap-3">
        <div className="mt-1 rounded-full bg-white/5 p-2">
          <Plus className="h-4 w-4 text-slate-300" />
        </div>

        <div>
          <h2 className="text-2xl font-bold">Create Post</h2>
          <p className="text-sm text-slate-400">
            Publish one post to multiple accounts
          </p>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-300">
              Select Accounts ({selectedAccountIds.length} selected)
            </label>

            {selectedAccountIds.length > 0 && (
              <button
                type="button"
                onClick={clearSelectedAccounts}
                className="text-xs font-medium text-red-300 transition hover:text-red-200"
              >
                Clear
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto rounded-2xl border border-white/10 bg-[#0a1326] p-3">
            {accounts.length === 0 ? (
              <div className="rounded-xl bg-white/5 p-4 text-sm text-slate-400">
                No accounts found. Connect accounts first.
              </div>
            ) : (
              Object.entries(groupedAccounts).map(
                ([platform, platformAccounts]) => {
                  const platformAccountIds = platformAccounts.map(
                    (item) => item.id
                  );

                  const allSelected = platformAccountIds.every((id) =>
                    selectedAccountIds.includes(id)
                  );

                  return (
                    <div key={platform} className="mb-4 last:mb-0">
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-sm font-bold capitalize text-white">
                          {platform} ({platformAccounts.length})
                        </h3>

                        <button
                          type="button"
                          onClick={() => selectAllPlatform(platform)}
                          className="text-xs font-semibold text-violet-300 hover:text-violet-200"
                        >
                          {allSelected ? "Unselect all" : "Select all"}
                        </button>
                      </div>

                      <div className="space-y-2">
                        {platformAccounts.map((account) => {
                          const checked = selectedAccountIds.includes(
                            account.id
                          );

                          return (
                            <button
                              key={account.id}
                              type="button"
                              onClick={() => toggleAccount(account.id)}
                              className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                                checked
                                  ? "border-violet-500/60 bg-violet-500/15"
                                  : "border-white/5 bg-white/[0.02] hover:bg-white/5"
                              }`}
                            >
                              <span
                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                                  checked
                                    ? "border-violet-400 bg-violet-500"
                                    : "border-white/20"
                                }`}
                              >
                                {checked && (
                                  <Check className="h-3.5 w-3.5 text-white" />
                                )}
                              </span>

                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-white">
                                  {account.platform} - {account.accountName}
                                </p>

                                <p className="text-xs text-slate-500">
                                  {account.status || "active"}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
              )
            )}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-300">
              Caption
            </label>

            {caption.trim() && (
              <button
                type="button"
                onClick={() => setCaption("")}
                className="inline-flex items-center text-xs font-medium text-red-300 transition hover:text-red-200"
              >
                <X className="mr-1 h-3.5 w-3.5" />
                Clear caption
              </button>
            )}
          </div>

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={7}
            placeholder="Write your creative caption here..."
            className="w-full rounded-2xl border border-white/10 bg-[#0a1326] px-4 py-4 text-sm leading-7 text-white outline-none placeholder:text-slate-500 focus:border-violet-500/50"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-300">
              Upload images or one video
            </label>

            {uploadedFiles.length > 0 && (
              <button
                type="button"
                onClick={clearAllMedia}
                className="text-xs font-medium text-red-300 transition hover:text-red-200"
              >
                Clear media
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />

          <button
            type="button"
            onClick={openFilePicker}
            disabled={uploading}
            className="flex h-28 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-violet-500/30 bg-[#081738] text-center transition hover:border-violet-400/50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading ? (
              <>
                <Loader2 className="mb-2 h-5 w-5 animate-spin text-slate-300" />
                <span className="font-medium">Uploading...</span>
                <span className="mt-1 text-xs text-slate-400">
                  Please wait while media uploads
                </span>
              </>
            ) : (
              <>
                <Upload className="mb-2 h-5 w-5 text-slate-300" />
                <span className="font-medium">Upload media</span>
                <span className="mt-1 text-xs text-slate-400">
                  Multiple images or one video
                </span>
              </>
            )}
          </button>

          {uploadedFiles.length > 0 && (
            <div className="mt-4 space-y-3">
              {uploadedFiles.map((file, index) => (
                <div
                  key={`${file.url}-${index}`}
                  className="rounded-2xl border border-white/10 bg-[#0a1326] p-3"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2 text-sm text-slate-300">
                      {file.type === "video" ? (
                        <Video className="h-4 w-4 shrink-0" />
                      ) : (
                        <ImageIcon className="h-4 w-4 shrink-0" />
                      )}

                      <span className="truncate">{file.name}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeUploadedFile(index)}
                      className="rounded-lg p-1 text-red-300 transition hover:bg-red-500/10 hover:text-red-200"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {file.type === "image" ? (
                    <img
                      src={file.url}
                      alt={file.name}
                      className="h-40 w-full rounded-xl object-cover"
                    />
                  ) : (
                    <video
                      src={file.url}
                      controls
                      className="h-52 w-full rounded-xl bg-black object-cover"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={onPublish}
          className="flex h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 text-sm font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:opacity-95"
        >
          Publish to {selectedAccountIds.length} Accounts
        </button>
      </div>
    </div>
  );
}