"use client";

import { useEffect, useMemo, useState } from "react";
import {
    ChevronDown,
    Sparkles,
    RefreshCw,
    Copy,
    Check,
    Trash2,
    Wand2,
} from "lucide-react";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

type AICaptionGeneratorProps = {
    platform: string;
    setCaption: (value: string) => void;
};

type CaptionOption = {
    id: number;
    text: string;
};

const supportedPlatforms = [
    "linkedin",
    "instagram",
    "facebook",
    "threads",
    "youtube",
];

export default function AICaptionGenerator({
    platform,
    setCaption,
}: AICaptionGeneratorProps) {
    const [aiPrompt, setAiPrompt] = useState("");
    const [aiTone, setAiTone] = useState("professional");
    const [selectedPostType, setSelectedPostType] = useState("general");
    const [aiLoading, setAiLoading] = useState(false);
    const [captions, setCaptions] = useState<CaptionOption[]>([]);
    const [copiedId, setCopiedId] = useState<number | null>(null);
    const [errorMessage, setErrorMessage] = useState("");

    const normalizedPlatform = useMemo(() => {
        const value = (platform || "").toLowerCase();
        return supportedPlatforms.includes(value) ? value : "linkedin";
    }, [platform]);

    useEffect(() => {
        if (normalizedPlatform === "linkedin") setAiTone("professional");
        if (normalizedPlatform === "instagram") setAiTone("casual");
        if (normalizedPlatform === "facebook") setAiTone("friendly");
        if (normalizedPlatform === "threads") setAiTone("casual");
        if (normalizedPlatform === "youtube") setAiTone("marketing");
    }, [normalizedPlatform]);

    async function handleGenerateCaption() {
        if (!aiPrompt.trim()) {
            setErrorMessage("Please enter a prompt or topic.");
            return;
        }

        try {
            setAiLoading(true);
            setErrorMessage("");
            setCopiedId(null);

            const token = localStorage.getItem("token");
            const route = `${API_BASE_URL}/api/ai/captions/${normalizedPlatform}`;

            const res = await fetch(route, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    prompt: aiPrompt,
                    postType: selectedPostType,
                    tone: aiTone,
                    mediaCount: 0,
                    hasVideo: normalizedPlatform === "youtube",
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data?.error || data?.message || "Failed to generate caption");
            }

            const rawCaptions: string[] = Array.isArray(data?.data?.captions)
                ? data.data.captions
                : [];

            if (!rawCaptions.length) {
                throw new Error("No captions returned from AI.");
            }

            const formattedCaptions = rawCaptions.map((text, index) => ({
                id: index + 1,
                text,
            }));

            setCaptions(formattedCaptions);
            setCaption(formattedCaptions[0].text);
        } catch (error: any) {
            console.error("AI caption error:", error);
            setErrorMessage(error.message || "Failed to generate caption");
        } finally {
            setAiLoading(false);
        }
    }

    function handleUseCaption(text: string) {
        setCaption(text);
    }

    async function handleCopy(text: string, id: number) {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (error) {
            console.error("Copy failed:", error);
        }
    }

    function handleClearAll() {
        setAiPrompt("");
        setCaptions([]);
        setCopiedId(null);
        setErrorMessage("");
        setCaption("");
        setSelectedPostType("general");

        if (normalizedPlatform === "linkedin") setAiTone("professional");
        if (normalizedPlatform === "instagram") setAiTone("casual");
        if (normalizedPlatform === "facebook") setAiTone("friendly");
        if (normalizedPlatform === "threads") setAiTone("casual");
        if (normalizedPlatform === "youtube") setAiTone("marketing");
    }

    function handleNewPrompt() {
        setAiPrompt("");
        setCaptions([]);
        setCopiedId(null);
        setErrorMessage("");
    }

    return (
        <div className="rounded-[30px] border border-white/10 bg-gradient-to-b from-[#071a3a] to-[#05132b] p-6 shadow-[0_0_45px_rgba(59,130,246,0.10)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-200">
                        <Wand2 className="h-3.5 w-3.5" />
                        Smart AI Writing
                    </div>

                    <h2 className="mt-4 text-[38px] font-bold leading-none text-white">
                        AI Caption Generator
                    </h2>

                    <p className="mt-3 text-base text-slate-300">
                        Create clean, high-quality captions for{" "}
                        <span className="font-semibold capitalize text-white">
                            {normalizedPlatform}
                        </span>
                        .
                    </p>
                </div>

                <div className="rounded-2xl border border-violet-500/20 bg-[#111f4d] px-4 py-3 text-sm text-violet-100">
                    Active platform:{" "}
                    <span className="font-semibold capitalize">{normalizedPlatform}</span>
                </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                    <label className="mb-3 block text-sm font-semibold text-slate-200">
                        Prompt or topic
                    </label>
                    <input
                        type="text"
                        value={aiPrompt}
                        onChange={(e) => {
                            setAiPrompt(e.target.value);
                            if (errorMessage) setErrorMessage("");
                        }}
                        placeholder={`Enter ${normalizedPlatform} content topic`}
                        className="h-16 w-full rounded-[22px] border border-white/10 bg-[#081734] px-5 text-lg text-white outline-none placeholder:text-slate-500 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                    />
                </div>

                <div>
                    <label className="mb-3 block text-sm font-semibold text-slate-200">
                        Tone
                    </label>
                    <div className="relative">
                        <select
                            value={aiTone}
                            onChange={(e) => setAiTone(e.target.value)}
                            className="h-16 w-full appearance-none rounded-[22px] border border-white/10 bg-[#081734] px-5 pr-12 text-lg capitalize text-white outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                        >
                            <option value="professional">Professional</option>
                            <option value="casual">Casual</option>
                            <option value="friendly">Friendly</option>
                            <option value="marketing">Marketing</option>
                            <option value="bold">Bold</option>
                            <option value="formal">Formal</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    </div>
                </div>
            </div>

            <div className="mt-5">
                <label className="mb-3 block text-sm font-semibold text-slate-200">
                    Post type
                </label>
                <div className="relative">
                    <select
                        value={selectedPostType}
                        onChange={(e) => setSelectedPostType(e.target.value)}
                        className="h-16 w-full appearance-none rounded-[22px] border border-white/10 bg-[#081734] px-5 pr-12 text-lg capitalize text-white outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
                    >
                        <option value="general">General</option>
                        <option value="announcement">Announcement</option>
                        <option value="product">Product</option>
                        <option value="hiring">Hiring</option>
                        <option value="educational">Educational</option>
                        <option value="launch">Launch</option>
                        <option value="promotion">Promotion</option>
                        <option value="tutorial">Tutorial</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                </div>
            </div>

            {errorMessage && (
                <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {errorMessage}
                </div>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                    onClick={handleGenerateCaption}
                    disabled={aiLoading}
                    className="inline-flex h-16 items-center justify-center rounded-[22px] bg-gradient-to-r from-violet-500 to-fuchsia-500 px-8 text-xl font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {aiLoading ? (
                        <>
                            <RefreshCw className="mr-3 h-5 w-5 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Sparkles className="mr-3 h-5 w-5" />
                            Generate Caption
                        </>
                    )}
                </button>

                <button
                    type="button"
                    onClick={handleGenerateCaption}
                    disabled={aiLoading || !aiPrompt.trim()}
                    className="inline-flex h-16 items-center justify-center rounded-[22px] border border-white/10 bg-[#0a1a3d] px-6 text-base font-semibold text-slate-100 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <RefreshCw className="mr-2 h-5 w-5" />
                    Generate Another
                </button>

                <button
                    type="button"
                    onClick={handleNewPrompt}
                    className="inline-flex h-16 items-center justify-center rounded-[22px] border border-white/10 bg-[#0a1a3d] px-6 text-base font-semibold text-slate-100 transition hover:bg-white/5"
                >
                    New Prompt
                </button>

                <button
                    type="button"
                    onClick={handleClearAll}
                    className="inline-flex h-16 items-center justify-center rounded-[22px] border border-red-500/20 bg-red-500/10 px-6 text-base font-semibold text-red-300 transition hover:bg-red-500/15"
                >
                    <Trash2 className="mr-2 h-5 w-5" />
                    Clear
                </button>
            </div>

            {captions.length > 0 && (
                <div className="mt-10">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-2xl font-bold text-white">Generated Captions</h3>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                            {captions.length} options
                        </span>
                    </div>

                    <div className="space-y-4">
                        {captions.map((item) => (
                            <div
                                key={item.id}
                                className="rounded-[24px] border border-white/10 bg-[#081734] p-5 shadow-[0_0_20px_rgba(59,130,246,0.05)]"
                            >
                                <div className="mb-4 flex items-center justify-between">
                                    <span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-200">
                                        Option {item.id}
                                    </span>
                                </div>

                                <p className="whitespace-pre-wrap text-[17px] leading-8 text-slate-100">
                                    {item.text}
                                </p>

                                <div className="mt-5 flex flex-wrap gap-3">
                                    <button
                                        type="button"
                                        onClick={() => handleUseCaption(item.text)}
                                        className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
                                    >
                                        Use This Caption
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleCopy(item.text, item.id)}
                                        className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                                    >
                                        {copiedId === item.id ? (
                                            <>
                                                <Check className="mr-2 h-4 w-4" />
                                                Copied
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="mr-2 h-4 w-4" />
                                                Copy
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}