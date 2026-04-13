export const normalizeAccessToken = (token?: string | null) => {
    if (!token || typeof token !== "string") return "";

    return token
        .replace(/^Bearer\s+/i, "")
        .replace(/^"+|"+$/g, "")
        .replace(/^'+|'+$/g, "")
        .trim();
};