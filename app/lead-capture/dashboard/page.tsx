"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppTheme } from "@/components/AppThemeProvider";
import { useAppAccount } from "@/components/AppAccountProvider";
import { useFlowexLogout } from "@/components/useFlowexLogout";
import { createClient } from "@/lib/supabase/client";
import { FlowexAppShell } from "@/components/FlowexAppShell";

type LeadTrendPoint = {
  label: string;
  value: number;
};

function buildLeadTrend(
  leads: { created_at: string }[]
): LeadTrendPoint[] {
  const days = Array.from({ length: 14 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (13 - index));
    return date;
  });

  return days.map((date) => {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    return {
      label: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      value: leads.filter((lead) => {
        const capturedAt = new Date(lead.created_at);
        return capturedAt >= date && capturedAt < nextDay;
      }).length,
    };
  });
}

function LeadTrendChart({ points }: { points: LeadTrendPoint[] }) {
  const maximum = Math.max(1, ...points.map((point) => point.value));
  const coordinates = points.map((point, index) => {
    const x = 24 + (index / Math.max(1, points.length - 1)) * 512;
    const y = 142 - (point.value / maximum) * 104;
    return `${x},${y}`;
  }).join(" ");
  const fillCoordinates = `24,142 ${coordinates} 536,142`;

  return (
    <div className="mt-5" aria-label="Leads captured during the last 14 days">
      <svg viewBox="0 0 560 166" className="h-36 w-full overflow-visible sm:h-44" role="img">
        {[38, 90, 142].map((y) => (
          <line key={y} x1="24" x2="536" y1={y} y2={y} stroke="currentColor" className="text-border-subtle" strokeDasharray="3 5" />
        ))}
        <polygon points={fillCoordinates} fill="currentColor" className="text-brand-primary/10" />
        <polyline points={coordinates} fill="none" stroke="currentColor" className="text-brand-primary" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point, index) => {
          const x = 24 + (index / Math.max(1, points.length - 1)) * 512;
          const y = 142 - (point.value / maximum) * 104;
          return <circle key={point.label} cx={x} cy={y} r="3.5" fill="currentColor" className="text-brand-primary" />;
        })}
      </svg>
      <div className="flex justify-between px-1 text-xs text-muted">
        <span>{points[0]?.label}</span>
        <span>{points[Math.floor(points.length / 2)]?.label}</span>
        <span>{points.at(-1)?.label}</span>
      </div>
    </div>
  );
}

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

  const [isLeadFlowNameModalOpen, setIsLeadFlowNameModalOpen] =
    useState(false);

  const [newLeadFlowName, setNewLeadFlowName] =
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

  const [leadTrend, setLeadTrend] =
    useState<LeadTrendPoint[]>([]);

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

  const openLeadFlowNameModal = () => {
    if (
      isCreatingLeadFlow ||
      leadFlows.length >= 3
    ) {
      return;
    }

    setLeadFlowError("");
    setNewLeadFlowName("");
    setIsLeadFlowNameModalOpen(true);
  };

  const createLeadFlow = async () => {
    const requestedName =
      newLeadFlowName.trim();

    if (
      isCreatingLeadFlow ||
      leadFlows.length >= 3 ||
      !requestedName
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
            name: requestedName,
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

      setIsLeadFlowNameModalOpen(false);
      setNewLeadFlowName("");

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
          setLeadTrend([]);
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
          trendResult,
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

            supabase
              .from("leads")
              .select("created_at")
              .eq("user_id", user.id)
              .eq("lead_flow_id", selectedLeadFlowId)
              .gte(
                "created_at",
                (() => {
                  const trendStart = new Date();
                  trendStart.setHours(0, 0, 0, 0);
                  trendStart.setDate(trendStart.getDate() - 13);
                  return trendStart.toISOString();
                })()
              ),
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

        setLeadTrend(
          buildLeadTrend(
            trendResult.data || []
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
    <main className="min-h-screen bg-background text-foreground transition-colors duration-300 app-dark:bg-surface app-dark:text-gray-100">
      <FlowexAppShell />

      {/* ================= NAVBAR ================= */}

      <header className="sticky top-0 z-50 border-b border-border-subtle/70 bg-white/90 backdrop-blur-xl transition-colors duration-300 app-dark:border-border-subtle/80 app-dark:bg-surface">

        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-6 lg:px-8">

          <div className="flex items-center gap-6">

            <Link href="/dashboard">
              <Image
                src="/flowex-logo-brand.png"
                alt="Flowex"
                width={120}
                height={34}
                priority
              />
            </Link>

            <div className="hidden h-6 w-px bg-gray-200 sm:block app-dark:bg-slate-700" />

            <Link
              href="/dashboard"
              className="hidden text-sm font-medium text-gray-500 transition hover:text-foreground sm:block app-dark:text-muted app-dark:hover:text-gray-100"
            >
              ← All Workflows
            </Link>

          </div>

          {/* ================= ACCOUNT ================= */}

          <div className="group relative">

           <button
  type="button"
  aria-label="Open account menu"
  className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-brand-primary    font-bold text-gray-100 shadow-md transition hover:scale-105"
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
            <div className="invisible absolute right-0 top-12 z-50 w-56 translate-y-2 rounded-2xl border border-border-subtle bg-white p-2 opacity-0 shadow-sm transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 app-dark:border-border-subtle app-dark:bg-surface ">

              <div className="px-3 py-2">

                <p className="text-sm font-semibold app-dark:text-gray-100">
                  {name}
                </p>

                <p className="truncate text-xs text-muted app-dark:text-muted">
                  {email}
                </p>

                <p className="mt-1 text-xs font-semibold text-brand-primary app-dark:text-brand-primary">
                  {plan === "trial" ? "Flowex Pro Trial" : "Flowex Pro"}
                </p>

              </div>

              <div className="my-1 h-px bg-gray-100 app-dark:bg-slate-700" />

              <Link
                href="/account?from=lead-capture"
                className="block rounded-xl px-3 py-2.5 text-sm text-muted transition hover:bg-gray-50 app-dark:text-muted app-dark:hover:bg-surface"
              >
                Account
              </Link>

              <Link
                href="/connections"
                className="block rounded-xl px-3 py-2.5 text-sm text-muted transition hover:bg-gray-50 app-dark:text-muted app-dark:hover:bg-surface"
              >
                Connections
              </Link>

              <Link
                href="/billing?from=lead-capture"
                className="block rounded-xl px-3 py-2.5 text-sm text-muted transition hover:bg-gray-50 app-dark:text-muted app-dark:hover:bg-surface"
              >
                Plan & Billing
              </Link>

              <Link
                href="/upgrade?from=lead-capture"
                className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-brand-primary transition hover:bg-surface-subtle app-dark:text-brand-primary app-dark:hover:bg-surface-subtle/10"
              >
                Upgrade Plan
              </Link>

              <Link
                href="/settings?from=lead-capture"
                className="block rounded-xl px-3 py-2.5 text-sm text-muted transition hover:bg-gray-50 app-dark:text-muted app-dark:hover:bg-surface"
              >
                Settings
              </Link>

              {/* THEME */}

              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm text-muted transition hover:bg-gray-50 app-dark:text-muted app-dark:hover:bg-surface"
              >
                <span>Theme</span>

                <span className="text-lg leading-none text-gray-500 app-dark:text-gray-100">
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

              <p className="text-sm font-semibold text-brand-primary app-dark:text-brand-primary">
                LEAD CAPTURE
              </p>

              <h1 className="mt-2 text-3xl font-black sm:text-4xl app-dark:text-gray-100">
                Lead Capture Dashboard
              </h1>

              <p className="mt-2 text-gray-500 app-dark:text-muted">
                Monitor every lead and your automation from one place.
              </p>

            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">

              <div className="relative w-full sm:w-auto">

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
                  className="flex w-full min-w-0 items-center justify-between gap-3 rounded-xl border border-border-subtle bg-white px-4 py-3 text-sm font-semibold text-gray-700 outline-none transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-[190px] app-dark:border-border-subtle app-dark:bg-surface app-dark:text-gray-100 app-dark:hover:bg-brand-primary"
                >
                  <span className="min-w-0 truncate">
                    {isLoadingLeadFlows
                      ? "Loading Lead Flows..."
                      : selectedLeadFlow?.name ||
                        "Select Lead Flow"}
                  </span>

                  <span className="text-xs text-muted">
                    {isLeadFlowMenuOpen
                      ? "▲"
                      : "▼"}
                  </span>
                </button>

                {isLeadFlowMenuOpen && (
                  <div className="absolute right-0 top-[calc(100%+8px)] z-40 w-full min-w-0 overflow-hidden rounded-2xl border border-border-subtle bg-white p-2 shadow-sm sm:min-w-[220px] app-dark:border-border-subtle app-dark:bg-surface">

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
                              ? "bg-surface-subtle text-brand-primary app-dark:bg-surface-subtle/10 app-dark:text-brand-primary"
                              : "text-muted hover:bg-gray-50 app-dark:text-muted app-dark:hover:bg-surface"
                          }`}
                        >
                          <span className="min-w-0 truncate">
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

                            openLeadFlowNameModal();
                          }}
                          disabled={
                            isCreatingLeadFlow
                          }
                          className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-brand-primary transition hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-60 app-dark:text-brand-primary app-dark:hover:bg-surface-subtle/10"
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
                className="rounded-xl bg-brand-primary    px-5 py-3 text-center text-sm font-semibold text-gray-100 shadow-sm transition hover:-translate-y-0.5"
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

            <div className="rounded-2xl border border-border-subtle bg-white p-5 shadow-sm transition-colors duration-300 app-dark:border-border-subtle app-dark:bg-surface">

              <p className="text-sm text-gray-500 app-dark:text-muted">
                Leads Today
              </p>

              <div className="mt-3 flex items-end justify-between">

                <h2 className="text-3xl font-black app-dark:text-gray-100">
                  {isLoadingLeadData ? "—" : leadsToday}
                </h2>

                <span className="text-xs text-muted app-dark:text-slate-500">
                  Today
                </span>

              </div>

            </div>

            {/* TOTAL LEADS */}

            <div className="rounded-2xl border border-border-subtle bg-white p-5 shadow-sm transition-colors duration-300 app-dark:border-border-subtle app-dark:bg-surface">

              <p className="text-sm text-gray-500 app-dark:text-muted">
                Total Leads
              </p>

              <div className="mt-3 flex items-end justify-between">

                <h2 className="text-3xl font-black app-dark:text-gray-100">
                  {isLoadingLeadData ? "—" : totalLeads}
                </h2>

                <span className="text-xs text-muted app-dark:text-slate-500">
                  All time
                </span>

              </div>

            </div>

            {/* AVERAGE REPLY */}

            <div className="rounded-2xl border border-border-subtle bg-white p-5 shadow-sm transition-colors duration-300 app-dark:border-border-subtle app-dark:bg-surface">

              <p className="text-sm text-gray-500 app-dark:text-muted">
                Average Reply Time
              </p>

              <div className="mt-3 flex items-end justify-between">

                <h2 className="text-3xl font-black app-dark:text-gray-100">
                  —
                </h2>

                <span className="text-xs text-muted app-dark:text-slate-500">
                  Coming next
                </span>

              </div>

            </div>

            {/* AUTOMATION */}

            <div className="rounded-2xl border border-border-subtle bg-white p-5 shadow-sm transition-colors duration-300 app-dark:border-border-subtle app-dark:bg-surface">

              <p className="text-sm text-gray-500 app-dark:text-muted">
                Automation
              </p>

              <div className="mt-3 flex items-end justify-between">

                <h2 className="text-3xl font-black app-dark:text-gray-100">
                  {selectedLeadFlow?.active === false
                    ? "Inactive"
                    : "Active"}
                </h2>

                <span
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    selectedLeadFlow?.active === false
                      ? "bg-amber-50 text-amber-600 app-dark:bg-amber-500/10 app-dark:text-amber-400"
                      : "bg-surface-subtle text-brand-primary app-dark:bg-surface-subtle/10 app-dark:text-brand-primary"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      selectedLeadFlow?.active === false
                        ? "bg-amber-500"
                        : "bg-surface-subtle"
                    }`}
                  />

                  {selectedLeadFlow?.active === false
                    ? "Paused"
                    : "Live"}

                </span>

              </div>

            </div>

          </div>

          <section className="mt-6 rounded-[26px] border border-border-subtle bg-white p-6 shadow-sm transition-colors duration-300 app-dark:border-border-subtle app-dark:bg-surface">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold app-dark:text-gray-100">Lead trend</h2>
                <p className="mt-1 text-sm text-gray-500 app-dark:text-muted">Leads captured in this Lead Flow over the last 14 days.</p>
              </div>
              <span className="rounded-full bg-surface-subtle px-3 py-1 text-xs font-semibold text-brand-primary app-dark:bg-surface-subtle/10">Last 14 days</span>
            </div>
            {isLoadingLeadData ? (
              <div className="mt-5 h-44 animate-pulse rounded-xl bg-surface-subtle" />
            ) : (
              <LeadTrendChart points={leadTrend} />
            )}
          </section>

          {/* ================= AUTOMATION STATUS ================= */}

          <div className="mt-6 rounded-[26px] border border-border-subtle bg-surface    p-6 shadow-sm transition-colors duration-300 app-dark:border-border-subtle   ">

            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">

              <div>

                <div className="flex items-center gap-3">

                  <span
                    className={`h-3 w-3 rounded-full ${
                      selectedLeadFlow?.active === false
                        ? "bg-amber-500"
                        : "bg-surface-subtle"
                    }`}
                  />

                  <h2 className="text-xl font-bold app-dark:text-gray-100">
                    {selectedLeadFlow?.name || "Lead Capture Automation"}
                  </h2>

                </div>

                <p className="mt-2 text-sm text-gray-500 app-dark:text-muted">
                  Capture Lead → Instant Reply → Notify Team → Save Lead
                </p>

              </div>

              <div className="flex items-center gap-3">

                <span
                  className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                    selectedLeadFlow?.active === false
                      ? "bg-amber-100 text-amber-700 app-dark:bg-amber-500/10 app-dark:text-amber-400"
                      : "bg-surface-subtle text-brand-primary app-dark:bg-surface-subtle/10 app-dark:text-brand-primary"
                  }`}
                >
                  {selectedLeadFlow?.active === false
                    ? "Inactive"
                    : "Active"}
                </span>

                <Link
                  href={manageHref}
                  className="rounded-xl border border-border-subtle bg-white px-4 py-2 text-sm font-semibold text-muted transition hover:bg-gray-50 app-dark:border-border-subtle app-dark:bg-surface app-dark:text-muted app-dark:hover:bg-surface"
                >
                  Manage
                </Link>

              </div>

            </div>

          </div>

          {/* ================= LEADS + ACTIVITY ================= */}

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_1fr]">

            {/* ================= LEADS ================= */}

            <div className="rounded-[26px] border border-border-subtle bg-white p-6 shadow-sm transition-colors duration-300 app-dark:border-border-subtle app-dark:bg-surface">

              <div className="flex items-center justify-between">

                <div>

                  <h2 className="text-xl font-bold app-dark:text-gray-100">
                    Recent Leads
                  </h2>

                  <p className="mt-1 text-sm text-gray-500 app-dark:text-muted">
                    Latest leads captured by Flowex.
                  </p>

                </div>

                <Link
                  href={leadsHref}
                  className="text-sm font-semibold text-gray-500 transition hover:text-foreground app-dark:text-muted app-dark:hover:text-gray-100"
                >
                  View All
                </Link>

              </div>

              <div className="mt-5 divide-y divide-gray-100 app-dark:divide-slate-800">

                {recentLeads.length === 0 ? (
                  <p className="py-6 text-sm text-muted app-dark:text-slate-500">
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

                        <p className="font-semibold app-dark:text-gray-100">
                          {lead.name}
                        </p>

                        <p className="truncate text-sm text-gray-500 app-dark:text-muted">
                          {lead.email}
                        </p>

                      </div>

                      <div className="shrink-0 text-right">

                        <span className="rounded-full bg-surface-subtle px-2.5 py-1 text-xs font-semibold text-brand-primary app-dark:bg-surface-subtle/10 app-dark:text-brand-primary">
                          {lead.status}
                        </span>

                        <p className="mt-2 text-xs text-muted app-dark:text-slate-500">
                          {lead.time}
                        </p>

                      </div>

                    </div>
                  ))
                )}

              </div>

            </div>

            {/* ================= ACTIVITY ================= */}

            <div className="rounded-[26px] border border-border-subtle bg-white p-6 shadow-sm transition-colors duration-300 app-dark:border-border-subtle app-dark:bg-surface">

              <h2 className="text-xl font-bold app-dark:text-gray-100">
                Recent Activity
              </h2>

              <p className="mt-1 text-sm text-gray-500 app-dark:text-muted">
                Latest automation events.
              </p>

              <div className="mt-5 space-y-3">

                {activity.length === 0 ? (
                  <p className="text-sm text-muted app-dark:text-slate-500">
                    {isLoadingLeadData
                      ? "Loading activity..."
                      : "No recent activity for this Lead Flow yet."}
                  </p>
                ) : (
                  activity.map((item) => (
                    <div
                      key={`${item.title}-${item.detail}-${item.time}`}
                      className="flex gap-3 rounded-2xl bg-gray-50 p-4 transition-colors duration-300 app-dark:bg-surface"
                    >

                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-subtle text-sm font-bold text-brand-primary app-dark:bg-surface-subtle/10 app-dark:text-brand-primary">
                        ✓
                      </div>

                      <div>

                        <p className="font-semibold app-dark:text-gray-100">
                          {item.title}
                        </p>

                        <p className="mt-1 text-sm text-gray-500 app-dark:text-muted">
                          {item.detail}
                        </p>

                        <p className="mt-1 text-xs text-muted app-dark:text-slate-500">
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
              <div className="w-full max-w-md rounded-[28px] border border-border-subtle bg-white/95 p-8 text-center shadow-md backdrop-blur-xl app-dark:border-border-subtle app-dark:bg-surface/95">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface    text-2xl   ">
                  ⚡
                </div>

                <p className="mt-5 text-sm font-semibold text-brand-primary app-dark:text-brand-primary">
                  LEAD CAPTURE
                </p>

                <h2 className="mt-2 text-2xl font-black app-dark:text-gray-100">
                  Create your first Lead Flow
                </h2>

                <p className="mt-3 text-sm leading-6 text-gray-500 app-dark:text-muted">
                  Set up where leads come from, then configure how Flowex handles them.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    openLeadFlowNameModal()
                  }
                  disabled={
                    isCreatingLeadFlow
                  }
                  className="mt-6 w-full rounded-xl bg-brand-primary    px-5 py-3 text-sm font-semibold text-gray-100 shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
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

      {isLeadFlowNameModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4 py-4 backdrop-blur-sm">
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-[28px] border border-border-subtle bg-white p-5 shadow-md sm:p-7 app-dark:border-border-subtle app-dark:bg-surface">
            <h2 className="text-2xl font-black app-dark:text-gray-100">
              Name your Lead Flow
            </h2>

            <p className="mt-2 text-sm text-gray-500 app-dark:text-muted">
              Give this Lead Flow a name you will recognize later.
            </p>

            <input
              type="text"
              value={newLeadFlowName}
              onChange={(event) =>
                setNewLeadFlowName(event.target.value)
              }
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  newLeadFlowName.trim() &&
                  !isCreatingLeadFlow
                ) {
                  void createLeadFlow();
                }
              }}
              maxLength={80}
              autoFocus
              placeholder="e.g. Website Leads"
              className="mt-5 w-full rounded-xl border border-border-subtle bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 app-dark:border-border-subtle app-dark:bg-surface app-dark:text-gray-100 app-dark:focus:border-brand-primary app-dark:focus:ring-brand-primary/10"
            />

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  if (!isCreatingLeadFlow) {
                    setIsLeadFlowNameModalOpen(false);
                    setNewLeadFlowName("");
                  }
                }}
                disabled={isCreatingLeadFlow}
                className="rounded-xl border border-border-subtle px-4 py-2.5 text-sm font-semibold text-muted transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 app-dark:border-border-subtle app-dark:text-muted app-dark:hover:bg-surface"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void createLeadFlow()}
                disabled={
                  isCreatingLeadFlow ||
                  !newLeadFlowName.trim()
                }
                className="rounded-xl bg-brand-primary    px-5 py-2.5 text-sm font-semibold text-gray-100 shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreatingLeadFlow
                  ? "Creating..."
                  : "Create Lead Flow"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= FOOTER ================= */}

      <footer className="mt-10 border-t border-border-subtle/70 bg-white/90 transition-colors duration-300 app-dark:border-border-subtle/80 app-dark:bg-surface">

        <div className="mx-auto flex min-h-[68px] max-w-7xl flex-col items-center justify-between gap-4 px-6 py-3 md:flex-row lg:px-8">

          <Image
            src="/flowex-logo-brand.png"
            alt="Flowex"
            width={105}
            height={30}
          />

          <div className="flex items-center gap-6 text-sm font-medium text-gray-500 app-dark:text-gray-100">

  <Link
    href="/dashboard"
    className="transition hover:text-foreground app-dark:hover:text-gray-100"
  >
    Dashboard
  </Link>

  <Link
    href="/account?from=lead-capture"
    className="transition hover:text-foreground app-dark:hover:text-gray-100"
  >
    Account
  </Link>

  <Link
    href="/settings?from=lead-capture"
    className="transition hover:text-foreground app-dark:hover:text-gray-100"
  >
    Settings
  </Link>

  <Link
    href="/billing?from=lead-capture"
    className="transition hover:text-foreground app-dark:hover:text-gray-100"
  >
    Billing
  </Link>

</div>
          <p className="text-xs text-muted app-dark:text-muted">
            © 2026 Flowex.
          </p>

        </div>

      </footer>

    </main>
  );
}
