export const getPublicBackendBaseUrl = () => {
    return (
        process.env.PUBLIC_BACKEND_URL ||
        process.env.APP_BASE_URL ||
        process.env.NGROK_URL ||
        "http://localhost:4000"
    ).replace(/\/+$/, "");
};

export const toPublicMediaUrl = (urlOrPath?: string | null) => {
    if (!urlOrPath || typeof urlOrPath !== "string") return null;

    const value = urlOrPath.trim();
    if (!value) return null;

    if (/^https?:\/\//i.test(value)) {
        if (
            value.includes("localhost") ||
            value.includes("127.0.0.1") ||
            value.includes("0.0.0.0")
        ) {
            const parsed = new URL(value);
            return `${getPublicBackendBaseUrl()}${parsed.pathname}`;
        }

        return value;
    }

    const normalizedPath = value.startsWith("/") ? value : `/${value}`;
    return `${getPublicBackendBaseUrl()}${normalizedPath}`;
};