"use client";

import { UploadCloud, Video, FileVideo } from "lucide-react";

interface UploadDropzoneProps {
    fileName?: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function UploadDropzone({
    fileName,
    onChange,
}: UploadDropzoneProps) {
    return (
        <label className="group flex min-h-[260px] cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed border-white/15 bg-white/[0.03] p-6 text-center transition hover:border-[#7a74ff]/40 hover:bg-white/[0.05]">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#151f4f] text-[#8a81ff] transition group-hover:scale-105">
                <UploadCloud className="h-8 w-8" />
            </div>

            <h3 className="text-xl font-bold text-white">Drag and drop your video</h3>
            <p className="mt-3 max-w-md text-sm leading-6 text-white/60">
                Upload MP4, MOV, AVI, or other supported video files for your campaigns and post composer.
            </p>

            <div className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white">
                <FileVideo className="h-4 w-4" />
                Choose video file
            </div>

            <div className="mt-4 text-xs text-white/45">
                Recommended: optimized social media clips under 200MB
            </div>

            {fileName ? (
                <div className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-green-500/10 px-4 py-2 text-sm text-green-300">
                    <Video className="h-4 w-4" />
                    {fileName}
                </div>
            ) : null}

            <input type="file" accept="video/*" className="hidden" onChange={onChange} />
        </label>
    );
}