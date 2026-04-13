import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export default function Input({
    label,
    error,
    className = "",
    ...props
}: InputProps) {
    return (
        <div className="w-full">
            {label ? <label className="label-text">{label}</label> : null}
            <input className={`input-dark ${className}`} {...props} />
            {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
        </div>
    );
}