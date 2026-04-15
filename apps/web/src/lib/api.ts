const rawBaseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

const API_BASE_URL = rawBaseUrl.endsWith("/")
    ? rawBaseUrl.slice(0, -1)
    : rawBaseUrl;

export const API_URL = API_BASE_URL;

type RequestOptions = {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    body?: any;
    token?: string | null;
};

type ApiFetchOptions = Omit<RequestInit, "body"> & {
    auth?: boolean;
    body?: BodyInit | object | null;
};

async function apiRequest<T = any>(
    endpoint: string,
    options: RequestOptions = {}
): Promise<T> {
    const { method = "GET", body, token } = options;

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        credentials: "include",
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data?.message || data?.error || "Something went wrong");
    }

    return data;
}

export const saveToken = (token: string) => {
    if (typeof window !== "undefined") {
        localStorage.setItem("token", token);
    }
};

export const getToken = () => {
    if (typeof window !== "undefined") {
        return (
            localStorage.getItem("token") ||
            localStorage.getItem("accessToken") ||
            localStorage.getItem("authToken")
        );
    }
    return null;
};

export const isAuthenticated = (): boolean => {
    const token = getToken();
    if (!token) return false;

    return !isTokenExpired(token);
};

export const removeToken = () => {
    if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("authToken");
    }
};

export const logoutUser = () => {
    removeToken();
    if (typeof window !== "undefined") {
        window.location.href = "/auth/login";
    }
};

export const isTokenExpired = (token: string): boolean => {
    try {
        const payloadStr = atob(token.split(".")[1]);
        const payload = JSON.parse(payloadStr);
        return !!(payload.exp && Date.now() >= payload.exp * 1000);
    } catch {
        return true;
    }
};

export const buildLoginRedirectUrl = (currentPath?: string): string => {
    const baseUrl = "/auth/login";
    if (currentPath && currentPath !== "/") {
        return `${baseUrl}?redirect=${encodeURIComponent(currentPath)}`;
    }
    return baseUrl;
};

/**
 * Returns auth headers.
 * Pass false if you do NOT want Content-Type added.
 */
export const getAuthHeaders = (includeContentType: boolean = true) => {
    const token = getToken();

    return {
        ...(includeContentType ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

export const apiFetch = async <T = any>(
    endpoint: string,
    options: ApiFetchOptions = {}
): Promise<T> => {
    const {
        auth = false,
        headers,
        body,
        credentials = "include",
        ...rest
    } = options;

    const normalizedHeaders = new Headers(headers || {});

    if (auth) {
        const authHeaders = getAuthHeaders(
            !(
                body instanceof FormData ||
                body instanceof Blob ||
                body instanceof ArrayBuffer
            )
        );

        Object.entries(authHeaders).forEach(([key, value]) => {
            if (!normalizedHeaders.has(key)) {
                normalizedHeaders.set(key, value);
            }
        });
    } else if (
        body &&
        !(body instanceof FormData) &&
        !(body instanceof Blob) &&
        !(body instanceof ArrayBuffer) &&
        !normalizedHeaders.has("Content-Type")
    ) {
        normalizedHeaders.set("Content-Type", "application/json");
    }

    const finalBody =
        body &&
        typeof body === "object" &&
        !(body instanceof FormData) &&
        !(body instanceof Blob) &&
        !(body instanceof ArrayBuffer)
            ? JSON.stringify(body)
            : (body as BodyInit | null | undefined);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...rest,
        headers: normalizedHeaders,
        body: finalBody,
        credentials,
    });

    const contentType = response.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");

    const data = isJson
        ? await response.json().catch(() => ({}))
        : await response.text().catch(() => "");

    if (!response.ok) {
        const message =
            typeof data === "object" && data
                ? data.message || data.error || "Something went wrong"
                : "Something went wrong";

        throw new Error(message);
    }

    return data as T;
};

export const loginUser = async (payload: {
    email: string;
    password: string;
}) => {
    return apiRequest("/api/auth/login", {
        method: "POST",
        body: payload,
    });
};

export const signupUser = async (payload: {
    name: string;
    email: string;
    password: string;
}) => {
    return apiRequest("/api/auth/signup", {
        method: "POST",
        body: payload,
    });
};

export const forgotPassword = async (payload: { email: string }) => {
    return apiRequest("/api/auth/forgot-password", {
        method: "POST",
        body: payload,
    });
};

export const resetPassword = async (payload: {
    email: string;
    otp: string;
    password: string;
}) => {
    return apiRequest("/api/auth/reset-password", {
        method: "POST",
        body: payload,
    });
};

export const getDashboardStats = async () => {
    return apiRequest("/api/dashboard/stats", {
        token: getToken(),
    });
};

export const getAccounts = async () => {
    return apiRequest("/api/accounts", {
        token: getToken(),
    });
};

export const createManualAccount = async (payload: {
    platform: string;
    accountName: string;
}) => {
    return apiRequest("/api/accounts", {
        method: "POST",
        token: getToken(),
        body: payload,
    });
};

export const deleteAccount = async (accountId: string) => {
    return apiRequest(`/api/accounts/${accountId}`, {
        method: "DELETE",
        token: getToken(),
    });
};

export const getPosts = async () => {
    return apiRequest("/api/scheduled-posts", {
        token: getToken(),
    });
};

export const createPost = async (payload: {
    accountId: string;
    caption: string;
    scheduledTime?: string;
    mediaUrls?: string[];
}) => {
    return apiRequest("/api/scheduled-posts", {
        method: "POST",
        token: getToken(),
        body: payload,
    });
};

export const updatePost = async (
    postId: string,
    payload: {
        caption?: string;
        scheduledTime?: string;
        mediaUrls?: string[];
        mediaUrl?: string;
    }
) => {
    return apiRequest(`/api/scheduled-posts/${postId}`, {
        method: "PATCH",
        token: getToken(),
        body: payload,
    });
};

export const deletePost = async (postId: string) => {
    return apiRequest(`/api/scheduled-posts/${postId}`, {
        method: "DELETE",
        token: getToken(),
    });
};

export const getCampaigns = async () => {
    return apiRequest("/api/campaigns", {
        token: getToken(),
    });
};

export const createCampaign = async (payload: {
    name: string;
    description?: string;
    startDate?: string;
    endDate?: string;
}) => {
    return apiRequest("/api/campaigns", {
        method: "POST",
        token: getToken(),
        body: payload,
    });
};

export const uploadMedia = async (file: File) => {
    const token = getToken();
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: "POST",
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
        credentials: "include",
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data?.message || data?.error || "Upload failed");
    }

    return data;
};

export const uploadMultipleMedia = async (files: File[]) => {
    const token = getToken();
    const formData = new FormData();

    files.forEach((file) => {
        formData.append("files", file);
    });

    const response = await fetch(`${API_BASE_URL}/api/upload/multiple`, {
        method: "POST",
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
        credentials: "include",
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data?.message || data?.error || "Multiple upload failed");
    }

    return data;
};

export const connectPlatform = (platform: string) => {
    if (typeof window !== "undefined") {
        window.location.href = `${API_BASE_URL}/api/oauth/${platform}/connect?token=${getToken()}`;
    }
};