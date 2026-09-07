"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAppAccount } from "@/components/AppAccountProvider";
import { useAppTheme } from "@/components/AppThemeProvider";
import { useFlowexLogout } from "@/components/useFlowexLogout";
import { createClient } from "@/lib/supabase/client";
import RouteGuard from "@/components/RouteGuard";

type ProviderKey = "sheets" | "airtable" | "excel" | "notion" | "hubspot";

type Connection = {
  key: ProviderKey;
  name: string;
  description: string;
  connected: boolean;
  detail: string;
  connectPath: string;
};

const providerMeta: Record<
  ProviderKey,
  {
    name: string;
    description: string;
    connectPath: string;
  }
> = {
  sheets: {
    name: "Google",
    description: "Google Sheets and Google account access",
    connectPath: "/api/integrations/google/connect",
  },
  airtable: {
    name: "Airtable",
    description: "Airtable bases and tables",
    connectPath: "/api/integrations/airtable/connect",
  },
  excel: {
    name: "Microsoft",
    description: "Microsoft Excel and OneDrive",
    connectPath: "/api/integrations/microsoft/connect",
  },
  notion: {
    name: "Notion",
    description: "Notion pages and databases",
    connectPath: "/api/integrations/notion/connect",
  },
  hubspot: {
    name: "HubSpot",
    description: "HubSpot CRM",
    connectPath: "/api/integrations/hubspot/connect",
  },
};

function ProviderLogo({ provider }: { provider: ProviderKey }) {
  if (provider === "sheets") {
    return (
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-gray-200 app-dark:ring-slate-700">
        <svg viewBox="0 0 48 48" className="h-7 w-7" aria-label="Google">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3A12 12 0 1 1 32 15.1l5.7-5.7A20 20 0 1 0 44 24c0-1.2-.1-2.4-.4-3.5Z"/>
          <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8A12 12 0 0 1 32 15.1l5.7-5.7A20 20 0 0 0 6.3 14.7Z"/>
          <path fill="#4CAF50" d="M24 44a20 20 0 0 0 13.5-5.2l-6.2-5.2A12 12 0 0 1 12.9 28.5l-6.5 5A20 20 0 0 0 24 44Z"/>
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4 5.6l6.2 5.2C41.2 35.4 44 30.4 44 24c0-1.2-.1-2.4-.4-3.5Z"/>
        </svg>
      </div>
    );
  }

  if (provider === "airtable") {
    return (
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-gray-200 app-dark:ring-slate-700">
        <svg viewBox="0 0 48 48" className="h-8 w-8" aria-label="Airtable">
          <path fill="#FCB400" d="M21.7 5.2 5.8 11.8c-1.1.5-1.1 2 0 2.4l15.9 6.3c1.5.6 3.1.6 4.6 0l15.9-6.3c1.1-.4 1.1-2 0-2.4L26.3 5.2a6.1 6.1 0 0 0-4.6 0Z"/>
          <path fill="#18BFFF" d="M25.7 24.1v17.2c0 1.2 1.2 2 2.3 1.5l17.7-6.9c.7-.3 1.2-1 1.2-1.8V17c0-1.2-1.2-2-2.3-1.5l-17.7 6.9c-.7.3-1.2 1-1.2 1.7Z"/>
          <path fill="#F82B60" d="M20.2 24.9 3.5 18.3c-1.1-.4-2.2.4-2.2 1.5v14.4c0 .7.4 1.3 1 1.6l16.7 6.6c1.1.4 2.2-.4 2.2-1.5V26.4c0-.7-.4-1.3-1-1.5Z"/>
        </svg>
      </div>
    );
  }

  if (provider === "excel") {
    return (
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-gray-200 app-dark:ring-slate-700">
        <svg viewBox="0 0 48 48" className="h-8 w-8" aria-label="Microsoft">
          <path fill="#F25022" d="M4 4h18v18H4z"/>
          <path fill="#7FBA00" d="M26 4h18v18H26z"/>
          <path fill="#00A4EF" d="M4 26h18v18H4z"/>
          <path fill="#FFB900" d="M26 26h18v18H26z"/>
        </svg>
      </div>
    );
  }

  if (provider === "notion") {
    return (
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-gray-200 app-dark:ring-slate-700">
        <svg viewBox="0 0 48 48" className="h-8 w-8" aria-label="Notion">
          <rect x="5" y="5" width="38" height="38" rx="4" fill="white" stroke="black" strokeWidth="3"/>
          <path fill="black" d="M14 14.5v3.2l3.6.5v15.2l-3.6.7v3h10v-3l-3.5-.7V21.2L32.8 37H36V18.3l3-.6v-3.2h-9.4v3.2l3.3.6v11.8L20.8 14.5H14Z"/>
        </svg>
      </div>
    );
  }

  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-gray-200 app-dark:ring-slate-700">
      <svg viewBox="0 0 48 48" className="h-8 w-8" aria-label="HubSpot">
        <circle cx="24" cy="25" r="8" fill="#FF7A59"/>
        <circle cx="24" cy="25" r="3.5" fill="white"/>
        <path stroke="#FF7A59" strokeWidth="4" strokeLinecap="round" d="M24 17V9m0 0 5-4M17 22l-7-5m21 5 6-5"/>
        <circle cx="8" cy="16" r="4" fill="#FF7A59"/>
        <circle cx="38" cy="15" r="4" fill="#FF7A59"/>
        <circle cx="30" cy="5" r="4" fill="#FF7A59"/>
      </svg>
    </div>
  );
}

export default function ConnectionsPage() {
  const { theme, toggleTheme } = useAppTheme();
  const { name, email, profileImage, plan, authReady } = useAppAccount();
  const { logout, isLoggingOut } = useFlowexLogout();
  const [supabase] = useState(() => createClient());
  const [loading, setLoading] = useState(true);
  const [busyProvider, setBusyProvider] = useState<ProviderKey | "">("");
  const [error, setError] = useState("");
  const [connections, setConnections] = useState<Connection[]>(() =>
    (Object.keys(providerMeta) as ProviderKey[]).map((key) => ({
      key,
      ...providerMeta[key],
      connected: false,
      detail: "",
    }))
  );

  const hasPremiumAccess = plan === "trial" || plan === "pro";
  const connectedCount = useMemo(
    () => connections.filter((connection) => connection.connected).length,
    [connections]
  );

  const loadConnections = async () => {
    setLoading(true);
    setError("");

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("Your session could not be verified. Please log in again.");
      }

      const endpoints: Record<ProviderKey, string> = {
        sheets: "/api/integrations/google/connect",
        airtable: "/api/integrations/airtable/connect",
        excel: "/api/integrations/microsoft/connect",
        notion: "/api/integrations/notion/connect",
        hubspot: "/api/integrations/hubspot/connect",
      };

      const results = await Promise.all(
        (Object.keys(endpoints) as ProviderKey[]).map(async (key) => {
          try {
            const response = await fetch(endpoints[key], {
              method: "GET",
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
              cache: "no-store",
            });

            const result = await response.json().catch(() => ({}));

            let detail = "";
            if (typeof result?.email === "string") detail = result.email;
            if (key === "notion" && typeof result?.workspaceName === "string") {
              detail = result.workspaceName || detail;
            }
            if (key === "hubspot" && typeof result?.hubId === "string") {
              detail = `Hub ID ${result.hubId}`;
            }

            return {
              key,
              ...providerMeta[key],
              connected: response.ok && result?.connected === true,
              detail,
            } satisfies Connection;
          } catch {
            return {
              key,
              ...providerMeta[key],
              connected: false,
              detail: "",
            } satisfies Connection;
          }
        })
      );

      setConnections(results);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Flowex could not load your connections."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authReady && hasPremiumAccess) {
      void loadConnections();
    }
  }, [authReady, hasPremiumAccess]);

  const connectProvider = async (provider: ProviderKey) => {
    if (busyProvider) return;
    setBusyProvider(provider);
    setError("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Your session could not be verified.");

      const response = await fetch(providerMeta[provider].connectPath, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          returnTo: "/connections",
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          typeof result?.error === "string"
            ? result.error
            : `Flowex could not connect ${providerMeta[provider].name}.`
        );
      }

      const authorizationUrl =
        typeof result?.url === "string"
          ? result.url
          : typeof result?.authorizationUrl === "string"
            ? result.authorizationUrl
            : "";

      if (!authorizationUrl) {
        await loadConnections();
        return;
      }

      window.location.assign(authorizationUrl);
    } catch (connectError) {
      setError(
        connectError instanceof Error
          ? connectError.message
          : "Flowex could not start the connection."
      );
      setBusyProvider("");
    }
  };

  const disconnectProvider = async (provider: ProviderKey) => {
    if (busyProvider) return;

    const confirmed = window.confirm(
      `Disconnect ${providerMeta[provider].name} from Flowex? Destinations using this account will stop receiving leads until you reconnect. Flowex will not delete your external files, bases, databases, workbooks or CRM data.`
    );

    if (!confirmed) return;

    setBusyProvider(provider);
    setError("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Your session could not be verified.");

      const response = await fetch("/api/integrations/disconnect", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ provider }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          typeof result?.error === "string"
            ? result.error
            : `Flowex could not disconnect ${providerMeta[provider].name}.`
        );
      }

      await loadConnections();
    } catch (disconnectError) {
      setError(
        disconnectError instanceof Error
          ? disconnectError.message
          : "Flowex could not disconnect this account."
      );
    } finally {
      setBusyProvider("");
    }
  };

  if (!authReady || !hasPremiumAccess) return null;

  return (
    <RouteGuard access="premium">
      <main className="min-h-screen bg-[#f8fafc] text-gray-900 transition-colors duration-300 app-dark:bg-[#0b0f14] app-dark:text-slate-100">
      <header className="sticky top-0 z-50 border-b border-gray-200/70 bg-white/90 backdrop-blur-xl transition-colors duration-300 app-dark:border-slate-800/80 app-dark:bg-[linear-gradient(90deg,#0b0f14_0%,#172033_8%,#252b70_25%,#006454_50%,#252b70_75%,#172033_92%,#0b0f14_100%)]">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Link href="/dashboard">
              <Image src="/flowex-logo.png" alt="Flowex" width={120} height={34} priority />
            </Link>
            <div className="hidden h-6 w-px bg-gray-200 sm:block app-dark:bg-slate-700" />
            <Link
              href="/dashboard"
              className="hidden text-sm font-medium text-gray-500 transition hover:text-gray-900 sm:block app-dark:text-slate-300 app-dark:hover:text-white"
            >
              ← Dashboard
            </Link>
          </div>

          <div className="group relative">
            <button
              type="button"
              aria-label="Open account menu"
              className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 font-bold text-white shadow-md transition hover:scale-105"
            >
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                name.charAt(0).toUpperCase() || "H"
              )}
            </button>

            <div className="invisible absolute right-0 top-12 z-50 w-56 translate-y-2 rounded-2xl border border-gray-200 bg-white p-2 opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 app-dark:border-slate-700 app-dark:bg-[#11161d]">
              <div className="px-3 py-2">
                <p className="text-sm font-semibold app-dark:text-white">{name}</p>
                <p className="truncate text-xs text-gray-400 app-dark:text-slate-400">{email}</p>
                <p className="mt-1 text-xs font-semibold text-emerald-600 app-dark:text-emerald-400">
                  {plan === "trial" ? "Flowex Pro Trial" : "Flowex Pro"}
                </p>
              </div>

              <div className="my-1 h-px bg-gray-100 app-dark:bg-slate-700" />

              <Link href="/account?from=connections" className="block rounded-xl px-3 py-2.5 text-sm text-gray-600 transition hover:bg-gray-50 app-dark:text-slate-300 app-dark:hover:bg-slate-800">
                Account
              </Link>
              <Link href="/connections" className="block rounded-xl bg-gray-50 px-3 py-2.5 text-sm font-semibold text-gray-900 app-dark:bg-slate-800 app-dark:text-white">
                Connections
              </Link>
              <Link href="/billing?from=connections" className="block rounded-xl px-3 py-2.5 text-sm text-gray-600 transition hover:bg-gray-50 app-dark:text-slate-300 app-dark:hover:bg-slate-800">
                Plan & Billing
              </Link>
              <Link href="/settings?from=connections" className="block rounded-xl px-3 py-2.5 text-sm text-gray-600 transition hover:bg-gray-50 app-dark:text-slate-300 app-dark:hover:bg-slate-800">
                Settings
              </Link>

              <button
                type="button"
                onClick={toggleTheme}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm text-gray-600 transition hover:bg-gray-50 app-dark:text-slate-300 app-dark:hover:bg-slate-800"
              >
                <span>Theme</span>
                <span>{theme === "dark" ? "☾" : "☀"}</span>
              </button>

              <div className="my-1 h-px bg-gray-100 app-dark:bg-slate-700" />

              <button
                type="button"
                onClick={logout}
                disabled={isLoggingOut}
                className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-red-500 transition hover:bg-red-50 disabled:opacity-60 app-dark:text-red-400 app-dark:hover:bg-red-500/10"
              >
                {isLoggingOut ? "Logging out..." : "Log out"}
              </button>
            </div>
          </div>
        </div>
      </header>

      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold text-emerald-600 app-dark:text-emerald-400">
                ACCOUNT
              </p>
              <h1 className="mt-2 text-3xl font-black sm:text-4xl app-dark:text-white">
                Connections
              </h1>
              <p className="mt-2 max-w-2xl text-gray-500 app-dark:text-slate-400">
                Manage the accounts connected to Flowex. Connections are shared across all of your Lead Flows.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 shadow-sm app-dark:border-slate-700 app-dark:bg-[#11161d] app-dark:text-slate-300">
              {loading ? "Checking..." : `${connectedCount} of ${connections.length} connected`}
            </div>
          </div>

          {error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 app-dark:border-red-500/30 app-dark:bg-red-500/10 app-dark:text-red-400">
              {error}
            </div>
          )}

          <div className="mt-8 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm app-dark:border-slate-700 app-dark:bg-[#11161d]">
            {connections.map((connection, index) => (
              <div
                key={connection.key}
                className={`flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between ${
                  index !== connections.length - 1
                    ? "border-b border-gray-100 app-dark:border-slate-800"
                    : ""
                }`}
              >
                <div className="flex min-w-0 items-center gap-4">
                  <ProviderLogo provider={connection.key} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold app-dark:text-white">{connection.name}</p>
                      {!loading && connection.connected && (
                        <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-600 app-dark:bg-emerald-500/10 app-dark:text-emerald-400">
                          Connected
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500 app-dark:text-slate-400">
                      {connection.connected && connection.detail
                        ? connection.detail
                        : connection.description}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {loading ? (
                    <div className="h-9 w-24 animate-pulse rounded-xl bg-gray-100 app-dark:bg-slate-800" />
                  ) : connection.connected ? (
                    <button
                      type="button"
                      onClick={() => void disconnectProvider(connection.key)}
                      disabled={Boolean(busyProvider)}
                      className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 app-dark:border-red-500/30 app-dark:bg-[#11161d] app-dark:text-red-400 app-dark:hover:bg-red-500/10"
                    >
                      {busyProvider === connection.key ? "Disconnecting..." : "Disconnect"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void connectProvider(connection.key)}
                      disabled={Boolean(busyProvider)}
                      className="rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {busyProvider === connection.key ? "Connecting..." : "Connect"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 text-sm text-gray-500 app-dark:border-slate-700 app-dark:bg-[#11161d] app-dark:text-slate-400">
            Disconnecting an account removes its Flowex connection and stored authorization. It does not delete your external Sheets, Airtable bases, Excel workbooks, Notion databases or HubSpot data.
          </div>
        </div>
      </section>
      </main>
    </RouteGuard>
  );
}
