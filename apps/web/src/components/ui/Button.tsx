import React from "react";

type ButtonVariant = "primary" | "secondary" | "danger";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    fullWidth?: boolean;
    children: React.ReactNode;
}

export default function Button({
    variant = "primary",
    fullWidth = false,
    className = "",
    children,
    ...props
}: ButtonProps) {
    const variantClass =
        variant === "primary"
            ? "primary-btn"
            : variant === "danger"
                ? "danger-btn"
                : "secondary-btn";

    return (
        <button
            className={`${variantClass} ${fullWidth ? "w-full" : ""} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}