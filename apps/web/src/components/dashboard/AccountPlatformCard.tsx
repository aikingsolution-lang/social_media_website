import { LucideIcon, CheckCircle2, AlertCircle } from "lucide-react";
import Button from "@/components/ui/Button";

interface AccountPlatformCardProps {
    title: string;
    subtitle: string;
    icon: LucideIcon;
    connectedCount?: number;
    connected?: boolean;
    onConnect?: () => void;
}

export default function AccountPlatformCard({
    title,
    subtitle,
    icon: Icon,
    connectedCount = 0,
    connected = false,
    onConnect,
}: AccountPlatformCardProps) {
    return (
        <div className="glass-card p-5 sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-[#141d4f] text-[#7e79ff]">
                        <Icon className="h-7 w-7" />
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-white">{title}</h3>
                        <p className="mt-1 text-sm text-white/55">{subtitle}</p>
                    </div>
                </div>

                <div>
                    {connected ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-green-400/20 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-300">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Connected
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-yellow-400/20 bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-300">
                            <AlertCircle className="h-3.5 w-3.5" />
                            Not connected
                        </span>
                    )}
                </div>
            </div>

            <div className="mb-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/60">Connected accounts</p>
                <p className="mt-1 text-2xl font-black text-white">{connectedCount}</p>
            </div>

            <Button fullWidth variant={connected ? "secondary" : "primary"} onClick={onConnect}>
                {connected ? "Manage Connection" : "Connect Account"}
            </Button>
        </div>
    );
}