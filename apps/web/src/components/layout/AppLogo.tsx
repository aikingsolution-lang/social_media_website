import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function AppLogo({ href = "/" }: { href?: string }) {
    return (
        <Link href={href} className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 shadow-lg shadow-violet-900/30">
                <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
                <p className="text-base font-black tracking-wide text-white">
                    SocialAuto
                </p>
                <p className="text-xs text-white/45">Professional Dashboard</p>
            </div>
        </Link>
    );
}