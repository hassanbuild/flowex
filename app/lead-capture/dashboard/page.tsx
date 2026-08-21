"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppTheme } from "@/components/AppThemeProvider";
import { useAppAccount } from "@/components/AppAccountProvider";
import { useFlowexLogout } from "@/components/useFlowexLogout";
import { createClient } from "@/lib/supabase/client";

export default function LeadCaptureDashboard() {
  const { theme, toggleTheme } = useAppTheme();

  const {
    name,
    email,
    profileImage,
    plan,
    authReady,
  } = useAppAccount();

  const {
    logout,
    isLoggingOut,
  } = useFlowexLogout();

  const router = useRouter();

  const [supabase] = useState(() =>
    createClient()
  );

  const [leadFlows, setLeadFlows] =
    useState<
      {
        id: string;
        name: string;
        slot: number;
        active: boolean;
      }[]
    >([]);

  const [selectedLeadFlowId, setSelectedLeadFlowId] =
    useState("");

  const [isLoadingLeadFlows, setIsLoadingLeadFlows] =
    useState(true);

  const [isCreatingLeadFlow, setIsCreatingLeadFlow] =
    useState(false);

  const [isLeadFlowMenuOpen, setIsLeadFlowMenuOpen] =
    useState(false);

  const [leadFlowError, setLeadFlowError] =
    useState("");

  const [leadsToday, setLeadsToday] =
    useState(0);

  const [totalLeads, setTotalLeads] =
    useState(0);

  const [recentLeads, setRecentLeads] =
    useState<
      {
        id: string;
        name: string;
        email: string;
        time: string;
        status: string;
      }[]
    >([]);

  const [activity, setActivity] =
    useState<
      {
        title: string;
        detail: string;
        time: string;
      }[]
    >([]);

  const [isLoadingLeadData, setIsLoadingLeadData] =
    useState(false);

  const hasPremiumAccess =
    plan === "trial" || plan === "pro";

  useEffect(() => {
    if (
      authReady &&
      !hasPremiumAccess
    ) {
      router.replace("/home");
    }
  }, [
    authReady,
    hasPremiumAccess,
    router,
  ]);

  useEffect(() => {
    let cancelled = false;

    const loadLeadFlows = async () => {
      if (
        !authReady ||
        !hasPremiumAccess
      ) {
        return;
      }

      setIsLoadingLeadFlows(true);
      setLeadFlowError("");

      const {
        data: {
          user,
        },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (
        cancelled ||
        userError ||
        !user
      ) {
        if (!cancelled) {
          setLeadFlowError(
            "Flowex could not load your Lead Flows."
          );
          setIsLoadingLeadFlows(false);
        }

        return;
      }

      let {
        data,
        error,
      } =
        await supabase
          .from("lead_flows")
          .select("id, name, slot, active")
          .eq("user_id", user.id)
          .order("slot", {
            ascending: true,
          });

      if (cancelled) {
        return;
      }

      if (error) {
        setLeadFlowError(
          "Flowex could not load your Lead Flows."
        );
        setIsLoadingLeadFlows(false);
        return;
      }

      const loadedFlows =
        data || [];

      setLeadFlows(
        loadedFlows
      );

      const savedLeadFlowId =
        localStorage.getItem(
          "flowex-selected-lead-flow"
        );

      const validSavedFlow =
        loadedFlows.find(
          (flow) =>
            flow.id === savedLeadFlowId
        );

      const nextSelectedId =
        validSavedFlow?.id ||
        loadedFlows[0]?.id ||
        "";

      setSelectedLeadFlowId(
        nextSelectedId
      );

      if (nextSelectedId) {
        localStorage.setItem(
          "flowex-selected-lead-flow",
          nextSelectedId
        );
      }

      setIsLoadingLeadFlows(false);
    };

    void loadLeadFlows();

    return () => {
      cancelled = true;
    };
  }, [
    authReady,
    hasPremiumAccess,
    supabase,
  ]);

  const selectLeadFlow = (
    leadFlowId: string
  ) => {
    setSelectedLeadFlowId(
      leadFlowId
    );

    setIsLeadFlowMenuOpen(
      false
    );

    localStorage.setItem(
      "flowex-selected-lead-flow",
      leadFlowId
    );
  };

  const createLeadFlow = async () => {
    if (
      isCreatingLeadFlow ||
      leadFlows.length >= 3
    ) {
      return;
    }

    setLeadFlowError("");
    setIsCreatingLeadFlow(true);

    try {
      const {
        data: {
          user,
        },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (
        userError ||
        !user
      ) {
        setLeadFlowError(
          "Your session could not be verified."
        );
        return;
      }

      const usedSlots =
        new Set(
          leadFlows.map(
            (flow) => flow.slot
          )
        );

      const nextSlot =
        [1, 2, 3].find(
          (slot) =>
            !usedSlots.has(slot)
        );

      if (!nextSlot) {
        return;
      }

      const {
        data,
        error,
      } =
        await supabase
          .from("lead_flows")
          .insert({
            user_id: user.id,
            name: `Lead Flow ${nextSlot}`,
            slot: nextSlot,
          })
          .select("id, name, slot, active")
          .single();

      if (
        error ||
        !data
      ) {
        setLeadFlowError(
          error?.message ||
            "Flowex could not create this Lead Flow."
        );
        return;
      }

      const nextFlows =
        [
          ...leadFlows,
          data,
        ].sort(
          (a, b) =>
            a.slot - b.slot
        );

      setLeadFlows(
        nextFlows
      );

      selectLeadFlow(
        data.id
      );

      router.push(
        `/lead-capture/manage?flowId=${encodeURIComponent(
          data.id
        )}`
      );
    } finally {
      setIsCreatingLeadFlow(
        false
      );
    }
  };

  const selectedLeadFlow =
    leadFlows.find(
      (flow) =>
        flow.id ===
        selectedLeadFlowId
    ) || leadFlows[0] || null;

  const needsFirstLeadFlow =
    !isLoadingLeadFlows &&
    leadFlows.length === 0;

  const manageHref =
    selectedLeadFlow
      ? `/lead-capture/manage?flowId=${encodeURIComponent(
          selectedLeadFlow.id
        )}`
      : "/lead-capture/manage";

  const leadsHref =
    selectedLeadFlow
      ? `/lead-capture/leads?flowId=${encodeURIComponent(
          selectedLeadFlow.id
        )}`
      : "/lead-capture/leads";


  const formatLeadTime = (
    createdAt: string
  ) => {
    const created =
      new Date(createdAt);

    const diffMs =
      Date.now() -
      created.getTime();

    const minutes =
      Math.max(
        0,
        Math.floor(
          diffMs / 60000
        )
      );

    if (minutes < 1) {
      return "Just now";
    }

    if (minutes < 60) {
      return `${minutes} min ago`;
    }

    const hours =
      Math.floor(
        minutes / 60
      );

    if (hours < 24) {
      return `${hours}h ago`;
    }

    const days =
      Math.floor(
        hours / 24
      );

    return `${days}d ago`;
  };

  const getLeadDisplayName = (
    fields: Record<string, unknown> | null,
    email: string | null,
    phone: string | null
  ) => {
    const entries =
      Object.entries(
        fields || {}
      );

    const preferred =
      entries.find(
        ([key, value]) => {
          if (
            typeof value !==
              "string" ||
            !value.trim()
          ) {
            return false;
          }

          const lower =
            key.toLowerCase();

          return (
            lower.includes(
              "name"
            ) ||
            lower.includes(
              "company"
            )
          );
        }
      );

    if (
      preferred &&
      typeof preferred[1] ===
        "string"
    ) {
      return preferred[1];
    }

    return (
      email ||
      phone ||
      "New Lead"
    );
  };

  useEffect(() => {
    let cancelled = false;

    const loadLeadData =
      async () => {
        if (
          !selectedLeadFlowId
        ) {
          setLeadsToday(0);
          setTotalLeads(0);
          setRecentLeads([]);
          setActivity([]);
          return;
        }

        setIsLoadingLeadData(
          true
        );

        const {
          data: {
            user,
          },
        } =
          await supabase.auth.getUser();

        if (
          cancelled ||
          !user
        ) {
          if (!cancelled) {
            setIsLoadingLeadData(
              false
            );
          }

          return;
        }

        const startOfToday =
          new Date();

        startOfToday.setHours(
          0,
          0,
          0,
          0
        );

        const [
          totalResult,
          todayResult,
          recentResult,
        ] =
          await Promise.all([
            supabase
              .from("leads")
              .select(
                "id",
                {
                  count: "exact",
                  head: true,
                }
              )
              .eq(
                "user_id",
                user.id
              )
              .eq(
                "lead_flow_id",
                selectedLeadFlowId
              ),

            supabase
              .from("leads")
              .select(
                "id",
                {
                  count: "exact",
                  head: true,
                }
              )
              .eq(
                "user_id",
                user.id
              )
              .eq(
                "lead_flow_id",
                selectedLeadFlowId
              )
              .gte(
                "created_at",
                startOfToday.toISOString()
              ),

            supabase
              .from("leads")
              .select(
                "id, email, phone, fields, created_at"
              )
              .eq(
                "user_id",
                user.id
              )
              .eq(
                "lead_flow_id",
                selectedLeadFlowId
              )
              .order(
                "created_at",
                {
                  ascending: false,
                }
              )
              .limit(4),
          ]);

        if (cancelled) {
          return;
        }

        setTotalLeads(
          totalResult.count || 0
        );

        setLeadsToday(
          todayResult.count || 0
        );

        const mappedLeads =
          (
            recentResult.data || []
          ).map(
            (lead) => ({
              id:
                lead.id,

              name:
                getLeadDisplayName(
                  lead.fields as Record<
                    string,
                    unknown
                  > | null,
                  lead.email,
                  lead.phone
                ),

              email:
                lead.email ||
                lead.phone ||
                "No contact",

              time:
                formatLeadTime(
                  lead.created_at
                ),

              status:
                "Captured",
            })
          );

        setRecentLeads(
          mappedLeads
        );

        setActivity(
          mappedLeads.map(
            (lead) => ({
              title:
                "Lead captured",

              detail:
                lead.name,

              time:
                lead.time,
            })
          )
        );

        setIsLoadingLeadData(
          false
        );
      };

    void loadLeadData();

    return () => {
      cancelled = true;
    };
  }, [
    selectedLeadFlowId,
    supabase,
  ]);

  if (
    !authReady ||
    !hasPremiumAccess
  ) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] text-gray-900 transition-colors duration-300 app-dark:bg-[#0b0f14] app-dark:text-slate-100">

      {/* ================= NAVBAR ================= */}

      <header className="sticky top-0 z-50 border-b border-gray-200/70 bg-white/90 backdrop-blur-xl transition-colors duration-300 app-dark:border-slate-800/80 app-dark:bg-[linear-gradient(90deg,#0b0f14_0%,#172033_8%,#252b70_25%,#006454_50%,#252b70_75%,#172033_92%,#0b0f14_100%)]">

        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-6 lg:px-8">

          <div className="flex items-center gap-6">

            <Link href="/dashboard">
              <Image
                src="/flowex-logo.png"
                alt="Flowex"
                width={120}
                height={34}
                priority
              />
            </Link>

            <div className="hidden h-6 w-px bg-gray-200 sm:block app-dark:bg-slate-700" />

            <Link
              href="/dashboard"
              className="hidden text-sm font-medium text-gray-500 transition hover:text-gray-900 sm:block app-dark:text-slate-300 app-dark:hover:text-white"
            >
              ← All Workflows
            </Link>

          </div>

          {/* ================= ACCOUNT ================= */}

          <div className="group relative">

           <button
  type="button"
  aria-label="Open account menu"
  className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 font-bold text-white shadow-md transition hover:scale-105"
>
  {profileImage ? (
    <img
      src={profileImage}
      alt="Profile"
      className="h-full w-full object-cover"
    />
  ) : (
    name.charAt(0).toUpperCase() || "H"
  )}
</button>
            <div className="invisible absolute right-0 top-12 z-50 w-56 translate-y-2 rounded-2xl border border-gray-200 bg-white p-2 opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 app-dark:border-slate-700 app-dark:bg-[#11161d] app-dark:shadow-[0_20px_60px_rgba(0,0,0,0.45)]">

              <div className="px-3 py-2">

                <p className="text-sm font-semibold app-dark:text-white">
                  {name}
                </p>

                <p className="truncate text-xs text-gray-400 app-dark:text-slate-400">
                  {email}
                </p>

                <p className="mt-1 text-xs font-semibold text-emerald-600 app-dark:text-emerald-400">
                  {plan === "trial" ? "Flowex Pro Trial" : "Flowex Pro"}
                </p>

              </div>

              <div className="my-1 h-px bg-gray-100 app-dark:bg-slate-700" />

              <Link
                href="/account?from=lead-capture"
                className="block rounded-xl px-3 py-2.5 text-sm text-gray-600 transition hover:bg-gray-50 app-dark:text-slate-300 app-dark:hover:bg-slate-800"
              >
                Account
              </Link>

              <Link
                href="/billing?from=lead-capture"
                className="block rounded-xl px-3 py-2.5 text-sm text-gray-600 transition hover:bg-gray-50 app-dark:text-slate-300 app-dark:hover:bg-slate-800"
              >
                Plan & Billing
              </Link>

              <Link
                href="/upgrade?from=lead-capture"
                className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-50 app-dark:text-emerald-400 app-dark:hover:bg-emerald-500/10"
              >
                Upgrade Plan
              </Link>

              <Link
                href="/settings?from=lead-capture"
                className="block rounded-xl px-3 py-2.5 text-sm text-gray-600 transition hover:bg-gray-50 app-dark:text-slate-300 app-dark:hover:bg-slate-800"
              >
                Settings
              </Link>

              {/* THEME */}

              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm text-gray-600 transition hover:bg-gray-50 app-dark:text-slate-300 app-dark:hover:bg-slate-800"
              >
                <span>Theme</span>

                <span className="text-lg leading-none text-gray-500 app-dark:text-slate-200">
                  {theme === "dark" ? "☾" : "☀"}
                </span>
              </button>

              <div className="my-1 h-px bg-gray-100 app-dark:bg-slate-700" />

              <button
  type="button"
  onClick={logout}
  disabled={isLoggingOut}
  className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 app-dark:text-red-400 app-dark:hover:bg-red-500/10"
>
  {isLoggingOut ? "Logging out..." : "Log out"}
</button>

            </div>

          </div>

        </div>

      </header>

      {/* ================= CONTENT ================= */}

      <section className="px-4 py-8 sm:px-6 lg:px-8">

        <div className="relative mx-auto max-w-7xl">

          <div
            className={
              needsFirstLeadFlow
                ? "pointer-events-none select-none blur-[3px]"
                : ""
            }
          >

          {/* ================= HEADER ================= */}

          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">

            <div>

              <p className="text-sm font-semibold text-emerald-600 app-dark:text-emerald-400">
                LEAD CAPTURE
              </p>

              <h1 className="mt-2 text-3xl font-black sm:text-4xl app-dark:text-white">
                Lead Capture Dashboard
              </h1>

              <p className="mt-2 text-gray-500 app-dark:text-slate-400">
                Monitor every lead and your automation from one place.
              </p>

            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">

              <div className="relative">

                <button
                  type="button"
                  onClick={() =>
                    setIsLeadFlowMenuOpen(
                      (current) =>
                        !current
                    )
                  }
                  disabled={
                    isLoadingLeadFlows ||
                    leadFlows.length === 0
                  }
                  className="flex min-w-[190px] items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 outline-none transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 app-dark:border-slate-700 app-dark:bg-[#11161d] app-dark:text-slate-200 app-dark:hover:bg-slate-800"
                >
                  <span>
                    {isLoadingLeadFlows
                      ? "Loading Lead Flows..."
                      : selectedLeadFlow?.name ||
                        "Select Lead Flow"}
                  </span>

                  <span className="text-xs text-gray-400">
                    {isLeadFlowMenuOpen
                      ? "▲"
                      : "▼"}
                  </span>
                </button>

                {isLeadFlowMenuOpen && (
                  <div className="absolute right-0 top-[calc(100%+8px)] z-40 w-full min-w-[220px] overflow-hidden rounded-2xl border border-gray-200 bg-white p-2 shadow-xl app-dark:border-slate-700 app-dark:bg-[#11161d]">

                    {leadFlows.map(
                      (flow) => (
                        <button
                          key={flow.id}
                          type="button"
                          onClick={() =>
                            selectLeadFlow(
                              flow.id
                            )
                          }
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                            flow.id ===
                            selectedLeadFlowId
                              ? "bg-emerald-50 text-emerald-700 app-dark:bg-emerald-500/10 app-dark:text-emerald-400"
                              : "text-gray-600 hover:bg-gray-50 app-dark:text-slate-300 app-dark:hover:bg-slate-800"
                          }`}
                        >
                          <span>
                            {flow.name}
                          </span>

                          {flow.id ===
                            selectedLeadFlowId && (
                            <span>
                              ✓
                            </span>
                          )}
                        </button>
                      )
                    )}

                    {leadFlows.length < 3 && (
                      <>
                        <div className="my-2 h-px bg-gray-100 app-dark:bg-slate-700" />

                        <button
                          type="button"
                          onClick={() => {
                            setIsLeadFlowMenuOpen(
                              false
                            );

                            void createLeadFlow();
                          }}
                          disabled={
                            isCreatingLeadFlow
                          }
                          className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#4b52f7] transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60 app-dark:text-[#7c83ff] app-dark:hover:bg-indigo-500/10"
                        >
                          {isCreatingLeadFlow
                            ? "Creating..."
                            : "+ Create Lead Flow"}
                        </button>
                      </>
                    )}

                  </div>
                )}

              </div>

              <Link
                href={manageHref}
                className="rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 px-5 py-3 text-center text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5"
              >
                Manage Automation
              </Link>

            </div>

          </div>

          {leadFlowError && (
            <p className="mt-4 text-sm font-medium text-red-500 app-dark:text-red-400">
              {leadFlowError}
            </p>
          )}

          {/* ================= STATS ================= */}

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            {/* LEADS TODAY */}

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-colors duration-300 app-dark:border-slate-800 app-dark:bg-[#11161d]">

              <p className="text-sm text-gray-500 app-dark:text-slate-400">
                Leads Today
              </p>

              <div className="mt-3 flex items-end justify-between">

                <h2 className="text-3xl font-black app-dark:text-white">
                  {isLoadingLeadData ? "—" : leadsToday}
                </h2>

                <span className="text-xs text-gray-400 app-dark:text-slate-500">
                  Today
                </span>

              </div>

            </div>

            {/* TOTAL LEADS */}

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-colors duration-300 app-dark:border-slate-800 app-dark:bg-[#11161d]">

              <p className="text-sm text-gray-500 app-dark:text-slate-400">
                Total Leads
              </p>

              <div className="mt-3 flex items-end justify-between">

                <h2 className="text-3xl font-black app-dark:text-white">
                  {isLoadingLeadData ? "—" : totalLeads}
                </h2>

                <span className="text-xs text-gray-400 app-dark:text-slate-500">
                  All time
                </span>

              </div>

            </div>

            {/* AVERAGE REPLY */}

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-colors duration-300 app-dark:border-slate-800 app-dark:bg-[#11161d]">

              <p className="text-sm text-gray-500 app-dark:text-slate-400">
                Average Reply Time
              </p>

              <div className="mt-3 flex items-end justify-between">

                <h2 className="text-3xl font-black app-dark:text-white">
                  —
                </h2>

                <span className="text-xs text-gray-400 app-dark:text-slate-500">
                  Coming next
                </span>

              </div>

            </div>

            {/* AUTOMATION */}

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-colors duration-300 app-dark:border-slate-800 app-dark:bg-[#11161d]">

              <p className="text-sm text-gray-500 app-dark:text-slate-400">
                Automation
              </p>

              <div className="mt-3 flex items-end justify-between">

                <h2 className="text-3xl font-black app-dark:text-white">
                  {selectedLeadFlow?.active === false
                    ? "Inactive"
                    : "Active"}
                </h2>

                <span
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    selectedLeadFlow?.active === false
                      ? "bg-amber-50 text-amber-600 app-dark:bg-amber-500/10 app-dark:text-amber-400"
                      : "bg-emerald-50 text-emerald-600 app-dark:bg-emerald-500/10 app-dark:text-emerald-400"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      selectedLeadFlow?.active === false
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                  />

                  {selectedLeadFlow?.active === false
                    ? "Paused"
                    : "Live"}

                </span>

              </div>

            </div>

          </div>

          {/* ================= AUTOMATION STATUS ================= */}

          <div className="mt-6 rounded-[26px] border border-gray-200 bg-gradient-to-br from-white via-cyan-50/50 to-indigo-50/50 p-6 shadow-sm transition-colors duration-300 app-dark:border-slate-800 app-dark:from-[#11161d] app-dark:via-[#101821] app-dark:to-[#14162a]">

            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">

              <div>

                <div className="flex items-center gap-3">

                  <span
                    className={`h-3 w-3 rounded-full ${
                      selectedLeadFlow?.active === false
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                  />

                  <h2 className="text-xl font-bold app-dark:text-white">
                    {selectedLeadFlow?.name || "Lead Capture Automation"}
                  </h2>

                </div>

                <p className="mt-2 text-sm text-gray-500 app-dark:text-slate-400">
                  Capture Lead → Instant Reply → Notify Team → Save Lead
                </p>

              </div>

              <div className="flex items-center gap-3">

                <span
                  className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                    selectedLeadFlow?.active === false
                      ? "bg-amber-100 text-amber-700 app-dark:bg-amber-500/10 app-dark:text-amber-400"
                      : "bg-emerald-100 text-emerald-700 app-dark:bg-emerald-500/10 app-dark:text-emerald-400"
                  }`}
                >
                  {selectedLeadFlow?.active === false
                    ? "Inactive"
                    : "Active"}
                </span>

                <Link
                  href={manageHref}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 app-dark:border-slate-700 app-dark:bg-[#0b0f14] app-dark:text-slate-300 app-dark:hover:bg-slate-800"
                >
                  Manage
                </Link>

              </div>

            </div>

          </div>

          {/* ================= LEADS + ACTIVITY ================= */}

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_1fr]">

            {/* ================= LEADS ================= */}

            <div className="rounded-[26px] border border-gray-200 bg-white p-6 shadow-sm transition-colors duration-300 app-dark:border-slate-800 app-dark:bg-[#11161d]">

              <div className="flex items-center justify-between">

                <div>

                  <h2 className="text-xl font-bold app-dark:text-white">
                    Recent Leads
                  </h2>

                  <p className="mt-1 text-sm text-gray-500 app-dark:text-slate-400">
                    Latest leads captured by Flowex.
                  </p>

                </div>

                <Link
                  href={leadsHref}
                  className="text-sm font-semibold text-gray-500 transition hover:text-gray-900 app-dark:text-slate-400 app-dark:hover:text-white"
                >
                  View All
                </Link>

              </div>

              <div className="mt-5 divide-y divide-gray-100 app-dark:divide-slate-800">

                {recentLeads.length === 0 ? (
                  <p className="py-6 text-sm text-gray-400 app-dark:text-slate-500">
                    {isLoadingLeadData
                      ? "Loading leads..."
                      : "No leads captured in this Lead Flow yet."}
                  </p>
                ) : (
                  recentLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="flex items-center justify-between gap-4 py-4"
                    >

                      <div className="min-w-0">

                        <p className="font-semibold app-dark:text-white">
                          {lead.name}
                        </p>

                        <p className="truncate text-sm text-gray-500 app-dark:text-slate-400">
                          {lead.email}
                        </p>

                      </div>

                      <div className="shrink-0 text-right">

                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600 app-dark:bg-emerald-500/10 app-dark:text-emerald-400">
                          {lead.status}
                        </span>

                        <p className="mt-2 text-xs text-gray-400 app-dark:text-slate-500">
                          {lead.time}
                        </p>

                      </div>

                    </div>
                  ))
                )}

              </div>

            </div>

            {/* ================= ACTIVITY ================= */}

            <div className="rounded-[26px] border border-gray-200 bg-white p-6 shadow-sm transition-colors duration-300 app-dark:border-slate-800 app-dark:bg-[#11161d]">

              <h2 className="text-xl font-bold app-dark:text-white">
                Recent Activity
              </h2>

              <p className="mt-1 text-sm text-gray-500 app-dark:text-slate-400">
                Latest automation events.
              </p>

              <div className="mt-5 space-y-3">

                {activity.length === 0 ? (
                  <p className="text-sm text-gray-400 app-dark:text-slate-500">
                    {isLoadingLeadData
                      ? "Loading activity..."
                      : "No recent activity for this Lead Flow yet."}
                  </p>
                ) : (
                  activity.map((item) => (
                    <div
                      key={`${item.title}-${item.detail}-${item.time}`}
                      className="flex gap-3 rounded-2xl bg-gray-50 p-4 transition-colors duration-300 app-dark:bg-[#0b0f14]"
                    >

                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-600 app-dark:bg-emerald-500/10 app-dark:text-emerald-400">
                        ✓
                      </div>

                      <div>

                        <p className="font-semibold app-dark:text-white">
                          {item.title}
                        </p>

                        <p className="mt-1 text-sm text-gray-500 app-dark:text-slate-400">
                          {item.detail}
                        </p>

                        <p className="mt-1 text-xs text-gray-400 app-dark:text-slate-500">
                          {item.time}
                        </p>

                      </div>

                    </div>
                  ))
                )}

              </div>

            </div>

          </div>

          </div>

          {needsFirstLeadFlow && (
            <div className="absolute inset-0 z-30 flex items-center justify-center px-4">
              <div className="w-full max-w-md rounded-[28px] border border-gray-200 bg-white/95 p-8 text-center shadow-2xl backdrop-blur-xl app-dark:border-slate-700 app-dark:bg-[#11161d]/95">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 via-cyan-100 to-indigo-100 text-2xl app-dark:from-emerald-500/15 app-dark:via-cyan-500/15 app-dark:to-indigo-500/15">
                  ⚡
                </div>

                <p className="mt-5 text-sm font-semibold text-emerald-600 app-dark:text-emerald-400">
                  LEAD CAPTURE
                </p>

                <h2 className="mt-2 text-2xl font-black app-dark:text-white">
                  Create your first Lead Flow
                </h2>

                <p className="mt-3 text-sm leading-6 text-gray-500 app-dark:text-slate-400">
                  Set up where leads come from, then configure how Flowex handles them.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    void createLeadFlow()
                  }
                  disabled={
                    isCreatingLeadFlow
                  }
                  className="mt-6 w-full rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCreatingLeadFlow
                    ? "Creating Lead Flow..."
                    : "Create Lead Flow"}
                </button>

              </div>
            </div>
          )}

        </div>

      </section>

      {/* ================= FOOTER ================= */}

      <footer className="mt-10 border-t border-gray-200/70 bg-white/90 transition-colors duration-300 app-dark:border-slate-800/80 app-dark:bg-[linear-gradient(90deg,#0b0f14_0%,#172033_8%,#252b70_25%,#006454_50%,#252b70_75%,#172033_92%,#0b0f14_100%)]">

        <div className="mx-auto flex min-h-[68px] max-w-7xl flex-col items-center justify-between gap-4 px-6 py-3 md:flex-row lg:px-8">

          <Image
            src="/flowex-logo.png"
            alt="Flowex"
            width={105}
            height={30}
          />

          <div className="flex items-center gap-6 text-sm font-medium text-gray-500 app-dark:text-slate-200">

  <Link
    href="/dashboard"
    className="transition hover:text-gray-900 app-dark:hover:text-white"
  >
    Dashboard
  </Link>

  <Link
    href="/account?from=lead-capture"
    className="transition hover:text-gray-900 app-dark:hover:text-white"
  >
    Account
  </Link>

  <Link
    href="/settings?from=lead-capture"
    className="transition hover:text-gray-900 app-dark:hover:text-white"
  >
    Settings
  </Link>

  <Link
    href="/billing?from=lead-capture"
    className="transition hover:text-gray-900 app-dark:hover:text-white"
  >
    Billing
  </Link>

</div>
          <p className="text-xs text-gray-400 app-dark:text-slate-300">
            © 2026 Flowex.
          </p>

        </div>

      </footer>

    </main>
  );
}