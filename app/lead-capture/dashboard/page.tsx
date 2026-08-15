"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppTheme } from "@/components/AppThemeProvider";
import { useAppAccount } from "@/components/AppAccountProvider";
import { useFlowexLogout } from "@/components/useFlowexLogout";

export default function LeadCaptureDashboard() {
  const { theme, toggleTheme } = useAppTheme();

  const {
    name,
    email,
    profileImage,
    plan,
  } = useAppAccount();

  const {
    logout,
    isLoggingOut,
  } = useFlowexLogout();

  const router = useRouter();

  const hasPremiumAccess =
    plan === "trial" || plan === "pro";

  useEffect(() => {
    if (!hasPremiumAccess) {
      router.replace("/home");
    }
  }, [hasPremiumAccess, router]);

  const recentLeads = [
    {
      name: "Acme Marketing",
      email: "hello@acme.com",
      time: "2 min ago",
      status: "Replied",
    },
    {
      name: "Northstar Realty",
      email: "leads@northstar.com",
      time: "12 min ago",
      status: "Replied",
    },
    {
      name: "Apex Consulting",
      email: "hello@apex.com",
      time: "28 min ago",
      status: "Replied",
    },
    {
      name: "Nova Studio",
      email: "contact@nova.com",
      time: "41 min ago",
      status: "Replied",
    },
  ];

  const activity = [
    {
      title: "Instant reply sent",
      detail: "Acme Marketing",
      time: "2 min ago",
    },
    {
      title: "Lead saved",
      detail: "Northstar Realty",
      time: "12 min ago",
    },
    {
      title: "Team notified",
      detail: "Apex Consulting",
      time: "28 min ago",
    },
    {
      title: "Follow-up scheduled",
      detail: "Nova Studio",
      time: "41 min ago",
    },
  ];

  if (!hasPremiumAccess) {
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

        <div className="mx-auto max-w-7xl">

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

            <Link
              href="/lead-capture/manage"
              className="rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5"
            >
              Manage Automation
            </Link>

          </div>

          {/* ================= STATS ================= */}

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            {/* LEADS TODAY */}

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-colors duration-300 app-dark:border-slate-800 app-dark:bg-[#11161d]">

              <p className="text-sm text-gray-500 app-dark:text-slate-400">
                Leads Today
              </p>

              <div className="mt-3 flex items-end justify-between">

                <h2 className="text-3xl font-black app-dark:text-white">
                  18
                </h2>

                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600 app-dark:bg-emerald-500/10 app-dark:text-emerald-400">
                  +12%
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
                  127
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
                  1.8s
                </h2>

                <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-600 app-dark:bg-cyan-500/10 app-dark:text-cyan-400">
                  Fast
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
                  Active
                </h2>

                <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600 app-dark:bg-emerald-500/10 app-dark:text-emerald-400">

                  <span className="h-2 w-2 rounded-full bg-emerald-500" />

                  Live

                </span>

              </div>

            </div>

          </div>

          {/* ================= AUTOMATION STATUS ================= */}

          <div className="mt-6 rounded-[26px] border border-gray-200 bg-gradient-to-br from-white via-cyan-50/50 to-indigo-50/50 p-6 shadow-sm transition-colors duration-300 app-dark:border-slate-800 app-dark:from-[#11161d] app-dark:via-[#101821] app-dark:to-[#14162a]">

            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">

              <div>

                <div className="flex items-center gap-3">

                  <span className="h-3 w-3 rounded-full bg-emerald-500" />

                  <h2 className="text-xl font-bold app-dark:text-white">
                    Lead Capture Automation
                  </h2>

                </div>

                <p className="mt-2 text-sm text-gray-500 app-dark:text-slate-400">
                  Capture Lead → Instant Reply → Notify Team → Save Lead
                </p>

              </div>

              <div className="flex items-center gap-3">

                <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-semibold text-emerald-700 app-dark:bg-emerald-500/10 app-dark:text-emerald-400">
                  Active
                </span>

                <Link
                  href="/lead-capture/manage"
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
                  href="/lead-capture/leads"
                  className="text-sm font-semibold text-gray-500 transition hover:text-gray-900 app-dark:text-slate-400 app-dark:hover:text-white"
                >
                  View All
                </Link>

              </div>

              <div className="mt-5 divide-y divide-gray-100 app-dark:divide-slate-800">

                {recentLeads.map((lead) => (
                  <div
                    key={lead.email}
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
                ))}

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

                {activity.map((item) => (
                  <div
                    key={`${item.title}-${item.detail}`}
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
                ))}

              </div>

            </div>

          </div>

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