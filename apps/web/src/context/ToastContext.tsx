"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

type ToastType = "success" | "error" | "info";

type ToastState = {
    show: boolean;
    type: ToastType;
    message: string;
};

type ToastContextType = {
    toast: ToastState;
    showToast: (message: string, type?: ToastType) => void;
    hideToast: () => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastContextProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [toast, setToast] = useState<ToastState>({
        show: false,
        type: "info",
        message: "",
    });

    const hideToast = useCallback(() => {
        setToast((prev) => ({ ...prev, show: false }));
    }, []);

    const showToast = useCallback((message: string, type: ToastType = "info") => {
        setToast({
            show: true,
            type,
            message,
        });

        setTimeout(() => {
            setToast((prev) => ({ ...prev, show: false }));
        }, 2500);
    }, []);

    const value = useMemo(
        () => ({
            toast,
            showToast,
            hideToast,
        }),
        [toast, showToast, hideToast]
    );

    return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
    const context = useContext(ToastContext);

    if (!context) {
        throw new Error("useToast must be used inside ToastContextProvider");
    }

    return context;
}