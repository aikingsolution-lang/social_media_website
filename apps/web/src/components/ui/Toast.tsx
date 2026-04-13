"use client";

import { X, CheckCircle2, AlertTriangle, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface ToastProps {
    show: boolean;
    type?: ToastType;
    message: string;
    onClose: () => void;
}

export default function Toast({
    show,
    type = "info",
    message,
    onClose,
}: ToastProps) {
    if (!show) return null;

    const config = {
        success: {
            icon: CheckCircle2,
            className: "border-green-500/20 bg-green-500/10 text-green-300",
        },
        error: {
            icon: AlertTriangle,
            className: "border-red-500/20 bg-red-500/10 text-red-300",
        },
        info: {
            icon: Info,
            className: "border-blue-500/20 bg-blue-500/10 text-blue-300",
        },
    };

    const Icon = config[type].icon;

    return (
        <div className="fixed right-4 top-4 z-[999] w-[calc(100%-2rem)] max-w-sm sm:right-6 sm:top-6">
            <div
                className={`flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-xl ${config[type].className}`}
            >
                <Icon className="mt-0.5 h-5 w-5 shrink-0" />
                <p className="flex-1 text-sm font-medium">{message}</p>
                <button
                    onClick={onClose}
                    className="text-current/80 transition hover:text-current"
                    type="button"
                    aria-label="Close toast"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}