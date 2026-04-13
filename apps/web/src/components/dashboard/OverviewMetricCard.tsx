import { LucideIcon, TrendingUp } from "lucide-react";

interface OverviewMetricCardProps {
    title: string;
    value: string;
    change: string;
    positive?: boolean;
    icon: LucideIcon;
}

export default function OverviewMetricCard({
    title,
    value,
    change,
    positive = true,
    icon: Icon,
}: OverviewMetricCardProps) {
    return (
        <div className="glass-card p-5">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-white/60">{title}</p>
                    <h3 className="mt-3 text-3xl font-black tracking-tight text-white">
                        {value}
                    </h3>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600/25 to-blue-600/25">
                    <Icon className="h-5 w-5 text-white" />
                </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
                <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${positive
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-red-500/15 text-red-300"
                        }`}
                >
                    <TrendingUp className="h-3.5 w-3.5" />
                    {change}
                </span>
                <span className="text-xs text-white/45">vs last 7 days</span>
            </div>
        </div>
    );
}