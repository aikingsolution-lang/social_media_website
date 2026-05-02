"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import AccountCard from "@/components/accounts/AccountCard";
import ConnectPlatformButtons from "@/components/accounts/ConnectPlatformButtons";
import { deleteAccount, getAccounts } from "@/lib/api";

type Account = {
  id: string;
  platform: string;
  accountName: string;
  platformUserId?: string | null;
  status?: string;
  followers?: string;
  createdAt?: string;
};

type AccountSummary = {
  platform: string;
  connected: number;
  limit: number;
  remaining: number;
  active: number;
  needsReconnect: number;
  expired: number;
  failed: number;
};

const platforms = [
  "linkedin",
  "instagram",
  "facebook",
  "twitter",
  "threads",
  "youtube",
];

function AccountsPageContent() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [summary, setSummary] = useState<AccountSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadAccounts = async () => {
    try {
      setLoading(true);

      const res = await getAccounts();

      setAccounts(res?.accounts || []);
      setSummary(res?.summary || []);
    } catch (error: any) {
      console.error(error.message);
      alert(error.message || "Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleDisconnect = async (id: string) => {
    const ok = window.confirm(
      "Are you sure you want to disconnect this account?"
    );

    if (!ok) return;

    try {
      await deleteAccount(id);
      setAccounts((prev) => prev.filter((item) => item.id !== id));
      alert("Account disconnected successfully");
      loadAccounts();
    } catch (error: any) {
      alert(error.message || "Failed to disconnect account");
    }
  };

  const filteredAccounts = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return accounts;

    return accounts.filter(
      (account) =>
        account.platform.toLowerCase().includes(q) ||
        account.accountName.toLowerCase().includes(q) ||
        account.platformUserId?.toLowerCase().includes(q)
    );
  }, [accounts, search]);

  const groupedAccounts = useMemo(() => {
    return platforms.reduce<Record<string, Account[]>>((acc, platform) => {
      acc[platform] = filteredAccounts.filter(
        (account) => account.platform === platform
      );
      return acc;
    }, {});
  }, [filteredAccounts]);

  const summaryMap = useMemo(() => {
    return summary.reduce<Record<string, AccountSummary>>((acc, item) => {
      acc[item.platform] = item;
      return acc;
    }, {});
  }, [summary]);

  return (
    <div className="space-y-6">
      <section className="glass-card-strong p-6 sm:p-8">
        <span className="badge-soft">
          <Sparkles className="mr-2 h-3.5 w-3.5" />
          Social Account Management
        </span>

        <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
          Connected Accounts
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-7 text-white/60">
          Connect and manage up to 10 LinkedIn, Instagram, Facebook, Twitter/X,
          Threads and YouTube accounts.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3 2xl:grid-cols-6">
        {platforms.map((platform) => {
          const item = summaryMap[platform];

          return (
            <div key={platform} className="glass-card p-5">
              <p className="text-sm font-semibold capitalize text-white/60">
                {platform}
              </p>

              <h2 className="mt-2 text-3xl font-black text-white">
                {item?.connected || 0}/10
              </h2>

              <p className="mt-1 text-xs text-white/45">
                Remaining: {item?.remaining ?? 10}
              </p>

              <div className="mt-4 space-y-1 text-xs text-white/55">
                <p>Active: {item?.active || 0}</p>
                <p>Reconnect: {item?.needsReconnect || 0}</p>
                <p>Expired: {item?.expired || 0}</p>
                <p>Failed: {item?.failed || 0}</p>
              </div>
            </div>
          );
        })}
      </section>

      <Suspense
        fallback={
          <div className="glass-card p-6 text-white/60">
            Loading connect options...
          </div>
        }
      >
        <ConnectPlatformButtons />
      </Suspense>

      <section className="glass-card p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />

          <input
            type="text"
            placeholder="Search connected accounts..."
            className="input-dark pl-11"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </section>

      {loading ? (
        <div className="glass-card p-6 text-white/60">Loading accounts...</div>
      ) : filteredAccounts.length === 0 ? (
        <div className="glass-card p-6 text-white/60">No accounts found</div>
      ) : (
        <div className="space-y-8">
          {platforms.map((platform) => {
            const platformAccounts = groupedAccounts[platform] || [];

            if (platformAccounts.length === 0) return null;

            return (
              <section key={platform}>
                <h2 className="mb-4 text-xl font-black capitalize text-white">
                  {platform} Accounts ({platformAccounts.length}/10)
                </h2>

                <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
                  {platformAccounts.map((account) => (
                    <AccountCard
                      key={account.id}
                      id={account.id}
                      platform={account.platform}
                      username={account.accountName}
                      status={
                        account.status === "active"
                          ? "Connected"
                          : account.status === "needs_reconnect"
                          ? "Reconnect Required"
                          : account.status || "Pending"
                      }
                      followers={account.followers || "0"}
                      onDisconnect={handleDisconnect}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AccountsPage() {
  return (
    <Suspense
      fallback={
        <div className="glass-card p-6 text-white/60">
          Loading accounts page...
        </div>
      }
    >
      <AccountsPageContent />
    </Suspense>
  );
}