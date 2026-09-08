"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppAccount } from "@/components/AppAccountProvider";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type LeadStatus = "new" | "contacted" | "closed";

type LeadRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: string;
  status: LeadStatus;
  receivedAt: string;
  followUpDueAt: string | null;
  followUpSentAt: string | null;
};

function formatLeadTime(value: string) {
  const created = new Date(value);
  const diffMs = Math.max(0, Date.now() - created.getTime());
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function sourceLabel(sourceType: string | null) {
  if (sourceType === "flowex_form") return "Flowex Form";
  if (sourceType === "external_form") return "Lovable Form";
  return "Lead Form";
}

function fieldDisplayName(fields: unknown) {
  if (!fields || typeof fields !== "object") return "";

  const record = fields as Record<string, unknown>;
  const preferredKeys = [
    "name",
    "full_name",
    "fullName",
    "fullname",
    "first_name",
    "firstName",
    "contact_name",
  ];

  for (const key of preferredKeys) {
    const value = record[key];
    if (
      typeof value === "string" &&
      value.trim()
    ) {
      return value.trim();
    }
  }

  for (const [key, value] of Object.entries(record)) {
    if (
      /name/i.test(key) &&
      typeof value === "string" &&
      value.trim()
    ) {
      return value.trim();
    }
  }

  return "";
}

function formatCountdown(
  dueAt: string,
  nowMs: number
) {
  const remaining =
    new Date(dueAt).getTime() - nowMs;

  if (remaining <= 0) {
    return "Follow-up due";
  }

  const totalSeconds =
    Math.floor(remaining / 1000);

  const hours =
    Math.floor(totalSeconds / 3600);

  const minutes =
    Math.floor((totalSeconds % 3600) / 60);

  const seconds =
    totalSeconds % 60;

  return `Follow-up in ${String(hours).padStart(2, "0")}:${String(
    minutes
  ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function LeadsPage() {
  const { plan } = useAppAccount();
  const router = useRouter();

  const hasPremiumAccess =
    plan === "trial" || plan === "pro";

  const [supabase] = useState(() => createClient());
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [updatingLeadId, setUpdatingLeadId] = useState("");
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!hasPremiumAccess) {
      router.replace("/home");
    }
  }, [hasPremiumAccess, router]);

  useEffect(() => {
    const timer = window.setInterval(
      () => setNowMs(Date.now()),
      1000
    );

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!hasPremiumAccess) return;

    let cancelled = false;

    const loadLeads = async () => {
      setIsLoading(true);
      setLoadError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (userError || !user) {
        setLoadError("Your session could not be verified.");
        setIsLoading(false);
        return;
      }

      const cutoff = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000
      ).toISOString();

      const flowId =
        new URLSearchParams(window.location.search)
          .get("flowId")
          ?.trim() || "";

      let query = supabase
        .from("leads")
        .select(
          "id, name, email, phone, fields, source_type, status, created_at, follow_up_due_at, follow_up_sent_at"
        )
        .eq("user_id", user.id)
        .gte("created_at", cutoff)
        .order("created_at", { ascending: false });

      if (flowId) {
        query = query.eq("lead_flow_id", flowId);
      }

      const { data, error } = await query;

      if (cancelled) return;

      if (error) {
        setLoadError(error.message || "Flowex could not load your leads.");
        setLeads([]);
        setIsLoading(false);
        return;
      }

      setLeads(
        (data || []).map((lead) => ({
          id: String(lead.id),
          name:
            typeof lead.name === "string" && lead.name.trim()
              ? lead.name.trim()
              : fieldDisplayName(lead.fields) ||
                lead.email ||
                lead.phone ||
                "New Lead",
          email:
            typeof lead.email === "string" && lead.email.trim()
              ? lead.email
              : null,
          phone:
            typeof lead.phone === "string" && lead.phone.trim()
              ? lead.phone
              : null,
          source: sourceLabel(
            typeof lead.source_type === "string"
              ? lead.source_type
              : null
          ),
          status:
            lead.status === "contacted" || lead.status === "closed"
              ? lead.status
              : "new",
          receivedAt: lead.created_at,
          followUpDueAt:
            typeof lead.follow_up_due_at === "string"
              ? lead.follow_up_due_at
              : null,
          followUpSentAt:
            typeof lead.follow_up_sent_at === "string"
              ? lead.follow_up_sent_at
              : null,
        }))
      );

      setIsLoading(false);
    };

    void loadLeads();

    return () => {
      cancelled = true;
    };
  }, [hasPremiumAccess, supabase]);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | LeadStatus>("all");

  const filteredLeads = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return leads.filter((lead) => {
      const matchesSearch =
        !needle ||
        lead.name.toLowerCase().includes(needle) ||
        (lead.email || "").toLowerCase().includes(needle) ||
        (lead.phone || "").toLowerCase().includes(needle);

      const matchesStatus =
        status === "all" || lead.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [leads, search, status]);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayCount = leads.filter(
    (lead) =>
      new Date(lead.receivedAt).getTime() >=
      todayStart.getTime()
  ).length;

  const contactedCount = leads.filter(
    (lead) => lead.status === "contacted"
  ).length;

  const updateLeadStatus = async (
    leadId: string,
    nextStatus: LeadStatus
  ) => {
    if (updatingLeadId) return;

    setUpdatingLeadId(leadId);
    setLoadError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoadError("Your session could not be verified.");
      setUpdatingLeadId("");
      return;
    }

    const contactedAt =
      nextStatus === "contacted" || nextStatus === "closed"
        ? new Date().toISOString()
        : null;

    const statusUpdate =
      nextStatus === "contacted" || nextStatus === "closed"
        ? {
            status: nextStatus,
            contacted_at: contactedAt,
            follow_up_due_at: null,
          }
        : {
            status: nextStatus,
            contacted_at: null,
          };

    const { error } = await supabase
      .from("leads")
      .update(statusUpdate)
      .eq("id", leadId)
      .eq("user_id", user.id);

    if (error) {
      setLoadError(
        error.message || "Flowex could not update this lead."
      );
      setUpdatingLeadId("");
      return;
    }

    setLeads((current) =>
      current.map((lead) =>
        lead.id === leadId
          ? {
              ...lead,
              status: nextStatus,
              followUpDueAt:
                nextStatus === "contacted" ||
                nextStatus === "closed"
                  ? null
                  : lead.followUpDueAt,
            }
          : lead
      )
    );

    setUpdatingLeadId("");
  };

  if (!hasPremiumAccess) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] text-gray-900 transition-colors duration-300 app-dark:bg-[#0b0f14] app-dark:text-slate-100">

      {/* ================= NAVBAR ================= */}

      <header className="sticky top-0 z-50 border-b border-gray-200/70 bg-white/90 backdrop-blur-xl transition-colors duration-300 app-dark:border-slate-800/80 app-dark:bg-[linear-gradient(90deg,#0b0f14_0%,#172033_8%,#252b70_25%,#006454_50%,#252b70_75%,#172033_92%,#0b0f14_100%)]">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-6 lg:px-8">

          <Link href="/dashboard">
            <Image
              src="/flowex-logo.png"
              alt="Flowex"
              width={120}
              height={34}
              priority
            />
          </Link>

          <Link
            href="/lead-capture/dashboard"
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 app-dark:border-slate-700 app-dark:bg-[#11161d] app-dark:text-slate-300 app-dark:hover:bg-slate-800"
          >
            Back
          </Link>

        </div>
      </header>

      {/* ================= CONTENT ================= */}

      <section className="px-4 py-10 sm:px-6 lg:px-8">

        <div className="mx-auto max-w-7xl">

          <div>

            <p className="text-sm font-semibold text-emerald-600 app-dark:text-emerald-400">
              LEAD CAPTURE
            </p>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl app-dark:text-white">
              Leads
            </h1>

            <p className="mt-2 text-gray-500 app-dark:text-slate-400">
              Your last 7 days of Flowex lead activity.
            </p>

          </div>

          {/* ================= SUMMARY ================= */}

          <div className="mt-8 grid gap-4 sm:grid-cols-3">

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-colors duration-300 app-dark:border-slate-800 app-dark:bg-[#11161d]">

              <p className="text-sm text-gray-500 app-dark:text-slate-400">
                Last 7 Days
              </p>

              <p className="mt-2 text-3xl font-black app-dark:text-white">
                {isLoading ? "—" : leads.length}
              </p>

            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-colors duration-300 app-dark:border-slate-800 app-dark:bg-[#11161d]">

              <p className="text-sm text-gray-500 app-dark:text-slate-400">
                Today
              </p>

              <p className="mt-2 text-3xl font-black app-dark:text-white">
                {isLoading ? "—" : todayCount}
              </p>

            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-colors duration-300 app-dark:border-slate-800 app-dark:bg-[#11161d]">

              <p className="text-sm text-gray-500 app-dark:text-slate-400">
                Contacted
              </p>

              <div className="mt-2 flex items-center gap-3">

                <p className="text-3xl font-black app-dark:text-white">
                  {isLoading ? "—" : contactedCount}
                </p>

                {!isLoading && leads.length > 0 && (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600 app-dark:bg-emerald-500/10 app-dark:text-emerald-400">
                    {Math.round((contactedCount / leads.length) * 100)}%
                  </span>
                )}

              </div>

            </div>

          </div>

          {loadError && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 app-dark:border-red-500/30 app-dark:bg-red-500/10 app-dark:text-red-400">
              {loadError}
            </div>
          )}

          {/* ================= LEADS ================= */}

          <div className="mt-6 overflow-hidden rounded-[26px] border border-gray-200 bg-white shadow-sm transition-colors duration-300 app-dark:border-slate-800 app-dark:bg-[#11161d]">

            {/* SEARCH + FILTER */}

            <div className="flex flex-col gap-3 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between app-dark:border-slate-800">

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search leads..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100 sm:max-w-sm app-dark:border-slate-700 app-dark:bg-[#0b0f14] app-dark:text-white app-dark:placeholder:text-slate-500 app-dark:focus:border-cyan-500 app-dark:focus:bg-[#0b0f14] app-dark:focus:ring-cyan-500/10"
              />

              <select
                value={status}
                onChange={(e) =>
                  setStatus(
                    e.target.value as "all" | LeadStatus
                  )
                }
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 outline-none app-dark:border-slate-700 app-dark:bg-[#0b0f14] app-dark:text-slate-300"
              >
                <option value="all">
                  All Statuses
                </option>

                <option value="new">
                  New
                </option>

                <option value="contacted">
                  Contacted
                </option>

                <option value="closed">
                  Closed
                </option>
              </select>

            </div>

            {/* ================= DESKTOP TABLE ================= */}

            <div className="hidden overflow-x-auto md:block">

              <table className="w-full">

                <thead className="bg-gray-50/80 app-dark:bg-[#0b0f14]">

                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-400 app-dark:text-slate-500">

                    <th className="px-6 py-4">
                      Lead
                    </th>

                    <th className="px-6 py-4">
                      Contact
                    </th>

                    <th className="px-6 py-4">
                      Source
                    </th>

                    <th className="px-6 py-4">
                      Status
                    </th>

                    <th className="px-6 py-4">
                      Received
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-gray-100 app-dark:divide-slate-800">

                  {filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="transition hover:bg-gray-50/70 app-dark:hover:bg-slate-900/60"
                    >

                      <td className="px-6 py-5">

                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 via-cyan-100 to-indigo-100 text-sm font-bold text-gray-700 app-dark:from-[#00c297]/30 app-dark:via-cyan-500/20 app-dark:to-[#4b52f7]/30 app-dark:text-white">
                            {lead.name.charAt(0).toUpperCase()}
                          </div>

                          <p className="font-semibold app-dark:text-white">
                            {lead.name}
                          </p>

                        </div>

                      </td>

                      <td className="px-6 py-5">

                        <p className="text-sm font-medium app-dark:text-slate-200">
                          {lead.email || lead.phone || "No contact"}
                        </p>

                        {lead.email && lead.phone && (
                          <p className="mt-1 text-xs text-gray-400 app-dark:text-slate-500">
                            {lead.phone}
                          </p>
                        )}

                      </td>

                      <td className="px-6 py-5 text-sm text-gray-500 app-dark:text-slate-400">
                        {lead.source}
                      </td>

                      <td className="px-6 py-5">

                        <div className="flex flex-col items-start gap-1.5">
                          <select
                            value={lead.status}
                            onChange={(e) =>
                              void updateLeadStatus(
                                lead.id,
                                e.target.value as LeadStatus
                              )
                            }
                            disabled={updatingLeadId === lead.id}
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold outline-none disabled:cursor-not-allowed disabled:opacity-60 ${statusClass(
                              lead.status
                            )}`}
                          >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="closed">Closed</option>
                          </select>

                          {lead.followUpSentAt ? (
                            <span className="text-[11px] font-medium text-amber-600 app-dark:text-amber-400">
                              Follow-up sent
                            </span>
                          ) : lead.status === "new" && lead.followUpDueAt ? (
                            <span className="text-[11px] font-semibold text-cyan-600 app-dark:text-cyan-400">
                              {formatCountdown(lead.followUpDueAt, nowMs)}
                            </span>
                          ) : lead.status !== "new" ? (
                            <span className="text-[11px] font-medium text-gray-400 app-dark:text-slate-500">
                              Follow-up cancelled
                            </span>
                          ) : null}
                        </div>

                      </td>

                      <td className="px-6 py-5 text-sm text-gray-400 app-dark:text-slate-500">
                        {formatLeadTime(lead.receivedAt)}
                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>

            {/* ================= MOBILE ================= */}

            <div className="divide-y divide-gray-100 md:hidden app-dark:divide-slate-800">

              {filteredLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="p-5"
                >

                  <div className="flex items-start justify-between gap-4">

                    <div className="flex min-w-0 items-center gap-3">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 via-cyan-100 to-indigo-100 text-sm font-bold text-gray-700 app-dark:from-[#00c297]/30 app-dark:via-cyan-500/20 app-dark:to-[#4b52f7]/30 app-dark:text-white">
                        {lead.name.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0">

                        <p className="truncate font-semibold app-dark:text-white">
                          {lead.name}
                        </p>

                        <p className="mt-1 truncate text-sm text-gray-500 app-dark:text-slate-400">
                          {lead.email || lead.phone || "No contact"}
                        </p>

                      </div>

                    </div>

                    <select
                      value={lead.status}
                      onChange={(e) =>
                        void updateLeadStatus(
                          lead.id,
                          e.target.value as LeadStatus
                        )
                      }
                      disabled={updatingLeadId === lead.id}
                      className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold outline-none disabled:opacity-60 ${statusClass(
                        lead.status
                      )}`}
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="closed">Closed</option>
                    </select>

                  </div>

                  {lead.followUpSentAt ? (
                    <p className="mt-3 text-xs font-medium text-amber-600 app-dark:text-amber-400">
                      Follow-up sent
                    </p>
                  ) : lead.status === "new" && lead.followUpDueAt ? (
                    <p className="mt-3 text-xs font-semibold text-cyan-600 app-dark:text-cyan-400">
                      {formatCountdown(lead.followUpDueAt, nowMs)}
                    </p>
                  ) : lead.status !== "new" ? (
                    <p className="mt-3 text-xs font-medium text-gray-400 app-dark:text-slate-500">
                      Follow-up cancelled
                    </p>
                  ) : null}

                  <div className="mt-4 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 app-dark:border-slate-800">

                    <div>

                      <p className="text-xs text-gray-400 app-dark:text-slate-500">
                        Source
                      </p>

                      <p className="mt-1 text-sm font-medium text-gray-600 app-dark:text-slate-300">
                        {lead.source}
                      </p>

                    </div>

                    <div className="text-right">

                      <p className="text-xs text-gray-400 app-dark:text-slate-500">
                        Received
                      </p>

                      <p className="mt-1 text-sm font-medium text-gray-600 app-dark:text-slate-300">
                        {formatLeadTime(lead.receivedAt)}
                      </p>

                    </div>

                  </div>

                </div>
              ))}

            </div>

            {/* ================= LOADING / NO RESULTS ================= */}

            {isLoading && (
              <div className="px-6 py-16 text-center">
                <p className="font-semibold text-gray-700 app-dark:text-slate-200">
                  Loading leads...
                </p>
              </div>
            )}

            {!isLoading && filteredLeads.length === 0 && (
              <div className="px-6 py-16 text-center">

                <p className="font-semibold text-gray-700 app-dark:text-slate-200">
                  No leads found
                </p>

                <p className="mt-1 text-sm text-gray-400 app-dark:text-slate-500">
                  Flowex only keeps this lightweight lead view for the last 7 days.
                </p>

              </div>
            )}

          </div>

        </div>

      </section>

    </main>
  );
}

function statusClass(status: LeadStatus) {
  if (status === "contacted") {
    return "border-emerald-200 bg-emerald-50 text-emerald-600 app-dark:border-emerald-500/30 app-dark:bg-emerald-500/10 app-dark:text-emerald-400";
  }

  if (status === "closed") {
    return "border-gray-200 bg-gray-100 text-gray-600 app-dark:border-slate-700 app-dark:bg-slate-800 app-dark:text-slate-300";
  }

  return "border-cyan-200 bg-cyan-50 text-cyan-600 app-dark:border-cyan-500/30 app-dark:bg-cyan-500/10 app-dark:text-cyan-400";
}
