import React from "react";

interface PageHeaderProps {
    title: string;
    description?: string;
    actions?: React.ReactNode;
}

export default function PageHeader({
    title,
    description,
    actions,
}: PageHeaderProps) {
    return (
        <div className="page-header">
            <div>
                <h1 className="section-title">{title}</h1>
                {description ? <p className="section-subtitle">{description}</p> : null}
            </div>

            {actions ? <div className="page-header-actions">{actions}</div> : null}
        </div>
    );
}