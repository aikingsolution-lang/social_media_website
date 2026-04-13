interface LoadingSpinnerProps {
    text?: string;
}

export default function LoadingSpinner({
    text = "Loading...",
}: LoadingSpinnerProps) {
    return (
        <div className="flex min-h-[220px] flex-col items-center justify-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-[#7a74ff]" />
            <p className="text-sm text-white/60">{text}</p>
        </div>
    );
}