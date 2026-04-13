import { BarChart3, ShieldCheck, Sparkles, Zap } from "lucide-react";

interface AuthShowcaseProps {
    title: string;
    subtitle: string;
}

const points = [
    {
        icon: Sparkles,
        title: "AI Powered Workflow",
        description: "Generate captions, organize campaigns, and automate publishing.",
    },
    {
        icon: BarChart3,
        title: "Analytics Focused",
        description: "Track performance, growth, and engagement with clean dashboards.",
    },
    {
        icon: ShieldCheck,
        title: "Secure Access",
        description: "Protected login with a professional enterprise-style interface.",
    },
    {
        icon: Zap,
        title: "Fast Publishing",
        description: "Manage multiple platforms from one premium control center.",
    },
];

export default function AuthShowcase({
    title,
    subtitle,
}: AuthShowcaseProps) {
    return (
        <div className="glass-card-strong relative overflow-hidden p-8 lg:p-10">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-transparent to-cyan-400/10" />

            <div className="relative z-10">
                <span className="badge-soft">Professional Social Automation UI</span>

                <h1 className="mt-5 text-4xl font-black tracking-tight text-white sm:text-5xl">
                    {title}
                </h1>

                <p className="mt-4 max-w-xl text-sm leading-7 text-white/65 sm:text-base">
                    {subtitle}
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    {points.map((item) => {
                        const Icon = item.icon;

                        return (
                            <div
                                key={item.title}
                                className="rounded-3xl border border-white/10 bg-white/5 p-5"
                            >
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600/20 to-blue-600/20">
                                    <Icon className="h-5 w-5 text-white" />
                                </div>
                                <h3 className="text-base font-bold text-white">{item.title}</h3>
                                <p className="mt-2 text-sm leading-6 text-white/60">
                                    {item.description}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}