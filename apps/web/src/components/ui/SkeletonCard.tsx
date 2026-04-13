export default function SkeletonCard() {
    return (
        <div className="glass-card p-5 sm:p-6">
            <div className="animate-pulse">
                <div className="mb-4 h-12 w-12 rounded-2xl bg-white/10" />
                <div className="mb-3 h-4 w-28 rounded bg-white/10" />
                <div className="h-8 w-20 rounded bg-white/10" />
            </div>
        </div>
    );
}