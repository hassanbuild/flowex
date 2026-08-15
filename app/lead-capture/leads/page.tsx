"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppAccount } from "@/components/AppAccountProvider";
import { useEffect, useState } from "react";

const leads = [
  {
    id: 1,
    name: "Sarah Johnson",
    email: "sarah@example.com",
    phone: "+1 202 555 0142",
    source: "Website Form",
    status: "Replied",
    received: "2 min ago",
  },
  {
    id: 2,
    name: "Daniel Carter",
    email: "daniel@example.com",
    phone: "+1 202 555 0187",
    source: "Flowex Form",
    status: "Replied",
    received: "12 min ago",
  },
  {
    id: 3,
    name: "Emma Wilson",
    email: "emma@example.com",
    phone: "+1 202 555 0164",
    source: "Website Form",
    status: "Follow-up",
    received: "28 min ago",
  },
  {
    id: 4,
    name: "James Miller",
    email: "james@example.com",
    phone: "+1 202 555 0199",
    source: "Flowex Form",
    status: "Replied",
    received: "41 min ago",
  },
  {
    id: 5,
    name: "Olivia Brown",
    email: "olivia@example.com",
    phone: "+1 202 555 0121",
    source: "Website Form",
    status: "New",
    received: "1 hr ago",
  },
];

export default function LeadsPage() {
  const { plan } = useAppAccount();
  const router = useRouter();

  const hasPremiumAccess =
    plan === "trial" || plan === "pro";

  useEffect(() => {
    if (!hasPremiumAccess) {
      router.replace("/home");
    }
  }, [hasPremiumAccess, router]);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.email.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      status === "All" || lead.status === status;

    return matchesSearch && matchesStatus;
  });

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

          {/* HEADER */}

          <div>

            <p className="text-sm font-semibold text-emerald-600 app-dark:text-emerald-400">
              LEAD CAPTURE
            </p>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl app-dark:text-white">
              Leads
            </h1>

            <p className="mt-2 text-gray-500 app-dark:text-slate-400">
              Monitor every lead captured by your Flowex automation.
            </p>

          </div>

          {/* ================= SUMMARY ================= */}

          <div className="mt-8 grid gap-4 sm:grid-cols-3">

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-colors duration-300 app-dark:border-slate-800 app-dark:bg-[#11161d]">

              <p className="text-sm text-gray-500 app-dark:text-slate-400">
                Total Leads
              </p>

              <p className="mt-2 text-3xl font-black app-dark:text-white">
                127
              </p>

            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-colors duration-300 app-dark:border-slate-800 app-dark:bg-[#11161d]">

              <p className="text-sm text-gray-500 app-dark:text-slate-400">
                Today
              </p>

              <p className="mt-2 text-3xl font-black app-dark:text-white">
                18
              </p>

            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-colors duration-300 app-dark:border-slate-800 app-dark:bg-[#11161d]">

              <p className="text-sm text-gray-500 app-dark:text-slate-400">
                Replied
              </p>

              <div className="mt-2 flex items-center gap-3">

                <p className="text-3xl font-black app-dark:text-white">
                  124
                </p>

                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600 app-dark:bg-emerald-500/10 app-dark:text-emerald-400">
                  97.6%
                </span>

              </div>

            </div>

          </div>

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
                onChange={(e) => setStatus(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 outline-none app-dark:border-slate-700 app-dark:bg-[#0b0f14] app-dark:text-slate-300"
              >
                <option value="All">
                  All Statuses
                </option>

                <option value="New">
                  New
                </option>

                <option value="Replied">
                  Replied
                </option>

                <option value="Follow-up">
                  Follow-up
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

                      {/* LEAD */}

                      <td className="px-6 py-5">

                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 via-cyan-100 to-indigo-100 text-sm font-bold text-gray-700 app-dark:from-[#00c297]/30 app-dark:via-cyan-500/20 app-dark:to-[#4b52f7]/30 app-dark:text-white">
                            {lead.name.charAt(0)}
                          </div>

                          <p className="font-semibold app-dark:text-white">
                            {lead.name}
                          </p>

                        </div>

                      </td>

                      {/* CONTACT */}

                      <td className="px-6 py-5">

                        <p className="text-sm font-medium app-dark:text-slate-200">
                          {lead.email}
                        </p>

                        <p className="mt-1 text-xs text-gray-400 app-dark:text-slate-500">
                          {lead.phone}
                        </p>

                      </td>

                      {/* SOURCE */}

                      <td className="px-6 py-5 text-sm text-gray-500 app-dark:text-slate-400">
                        {lead.source}
                      </td>

                      {/* STATUS */}

                      <td className="px-6 py-5">
                        <StatusBadge status={lead.status} />
                      </td>

                      {/* RECEIVED */}

                      <td className="px-6 py-5 text-sm text-gray-400 app-dark:text-slate-500">
                        {lead.received}
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

                    <div className="flex items-center gap-3">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 via-cyan-100 to-indigo-100 text-sm font-bold text-gray-700 app-dark:from-[#00c297]/30 app-dark:via-cyan-500/20 app-dark:to-[#4b52f7]/30 app-dark:text-white">
                        {lead.name.charAt(0)}
                      </div>

                      <div>

                        <p className="font-semibold app-dark:text-white">
                          {lead.name}
                        </p>

                        <p className="mt-1 text-sm text-gray-500 app-dark:text-slate-400">
                          {lead.email}
                        </p>

                      </div>

                    </div>

                    <StatusBadge status={lead.status} />

                  </div>

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
                        {lead.received}
                      </p>

                    </div>

                  </div>

                </div>
              ))}

            </div>

            {/* ================= NO RESULTS ================= */}

            {filteredLeads.length === 0 && (
              <div className="px-6 py-16 text-center">

                <p className="font-semibold text-gray-700 app-dark:text-slate-200">
                  No leads found
                </p>

                <p className="mt-1 text-sm text-gray-400 app-dark:text-slate-500">
                  Try changing your search or status filter.
                </p>

              </div>
            )}

          </div>

        </div>

      </section>

    </main>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  if (status === "Replied") {
    return (
      <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600 app-dark:bg-emerald-500/10 app-dark:text-emerald-400">
        Replied
      </span>
    );
  }

  if (status === "Follow-up") {
    return (
      <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-600 app-dark:bg-amber-500/10 app-dark:text-amber-300">
        Follow-up
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-600 app-dark:bg-cyan-500/10 app-dark:text-cyan-400">
      New
    </span>
  );
}