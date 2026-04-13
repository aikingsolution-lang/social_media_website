import { Request } from "express";

export function getFrontendBaseUrl() {
    return (
        process.env.FRONTEND_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        "http://localhost:3000"
    );
}

export function getFrontendAccountsUrl(query?: string) {
    const base = getFrontendBaseUrl();
    return `${base}/dashboard/accounts${query ? `?${query}` : ""}`;
}

export function safeBase64UrlDecode(value: string) {
    try {
        return Buffer.from(value, "base64url").toString("utf8");
    } catch {
        return null;
    }
}

export function safeBase64Decode(value: string) {
    try {
        return Buffer.from(value, "base64").toString("utf8");
    } catch {
        return null;
    }
}

export function getBearerTokenFromQuery(req: Request) {
    const tokenFromQuery = req.query.token as string | undefined;
    const tokenFromHeader = req.headers.authorization?.split(" ")[1];
    return tokenFromQuery || tokenFromHeader || "";
}