"use client";

import { Search, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AccountCard from "@/components/accounts/AccountCard";
import ConnectPlatformButtons from "@/components/accounts/ConnectPlatformButtons";
import { deleteAccount, getAccounts } from "@/lib/api";

type Account = {
  id: string;
  platform: string;
  accountName: string;
  status?: string;
  followers?: string;
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const res = await getAccounts();
      setAccounts(res?.accounts || res || []);
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
    const ok = window.confirm("Are you sure you want to disconnect this account?");
    if (!ok) return;

    try {
      await deleteAccount(id);
      setAccounts((prev) => prev.filter((item) => item.id !== id));
      alert("Account disconnected successfully");
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
        account.accountName.toLowerCase().includes(q)
    );
  }, [accounts, search]);

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
          Connect new platforms and manage all active social accounts from one
          professional SaaS dashboard.
        </p>
      </section>

      <ConnectPlatformButtons />

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
        <section className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {filteredAccounts.map((account) => (
            <AccountCard
              key={account.id}
              id={account.id}
              platform={account.platform}
              username={account.accountName}
              status={account.status === "active" ? "Connected" : "Pending"}
              followers={account.followers || "0"}
              onDisconnect={handleDisconnect}
            />
          ))}
        </section>
      )}
    </div>
  );
}