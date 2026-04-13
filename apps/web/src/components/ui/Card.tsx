import React from "react";

interface CardProps {
    title?: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
    children: React.ReactNode;
}

export default function Card({
    title,
    description,
    action,
    className = "",
    children,
}: CardProps) {
    return (
        <section className={`glass-card p-5 sm:p-6 ${className}`}>
            {(title || description || action) && (
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        {title ? <h3 className="text-xl font-bold text-white">{title}</h3> : null}
                        {description ? (
                            <p className="mt-1 text-sm text-white/60">{description}</p>
                        ) : null}
                    </div>
                    {action ? <div>{action}</div> : null}
                </div>
            )}
            {children}
        </section>
    );
}