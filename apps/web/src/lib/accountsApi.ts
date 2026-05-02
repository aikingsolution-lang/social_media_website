const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export type SocialAccount = {
  id: string;
  platform: string;
  accountName: string;
  platformUserId?: string | null;
  pageId?: string | null;
  instagramBusinessAccountId?: string | null;
  tokenExpiresAt?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

function getToken() {
  if (typeof window === "undefined") return "";

  return (
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken") ||
    ""
  );
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}

export const accountsApi = {
  getAccounts: () => request("/api/accounts"),

  addAccount: (body: {
    platform: string;
    accountName: string;
    platformUserId: string;
    accessToken?: string;
    refreshToken?: string;
    pageId?: string;
    instagramBusinessAccountId?: string;
    tokenExpiresAt?: string;
  }) =>
    request("/api/accounts", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateStatus: (id: string, status: string) =>
    request(`/api/accounts/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  deleteAccount: (id: string) =>
    request(`/api/accounts/${id}`, {
      method: "DELETE",
    }),
};