"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

import { useAppTheme } from "@/components/AppThemeProvider";
import { useAppAccount } from "@/components/AppAccountProvider";
import { useFlowexLogout } from "@/components/useFlowexLogout";
import RouteGuard from "@/components/RouteGuard";

export default function DashboardPage() {
  const { theme, toggleTheme } =
    useAppTheme();

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

  const [supabase] =
    useState(() =>
      createClient()
    );

  const [leadsToday, setLeadsToday] =
    useState(0);

  const [isLoadingLeadsToday, setIsLoadingLeadsToday] =
    useState(true);

  useEffect(() => {
    if (!authReady) {
      return;
    }

    let cancelled = false;

    const loadLeadsToday =
      async () => {
        setIsLoadingLeadsToday(true);

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
            setLeadsToday(0);
            setIsLoadingLeadsToday(false);
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

        /*
          Count every lead captured today for this user,
          across all of their Lead Flows.
        */
        const {
          count,
          error,
        } =
          await supabase
            .from("leads")
            .select(
              "*",
              {
                count: "exact",
                head: true,
              }
            )
            .eq(
              "user_id",
              user.id
            )
            .gte(
              "created_at",
              startOfToday.toISOString()
            );

        if (error) {
          console.error(
            "Flowex dashboard lead count error:",
            error.message
          );
        }

        if (cancelled) {
          return;
        }

        setLeadsToday(
          error
            ? 0
            : count || 0
        );

        setIsLoadingLeadsToday(false);
      };

    void loadLeadsToday();

    return () => {
      cancelled = true;
    };
  }, [
    authReady,
    supabase,
  ]);

  const planName =
    plan === "trial"
      ? "Flowex Pro Trial"
      : plan === "pro"
        ? "Flowex Pro"
        : "Free";

  return (
    <RouteGuard access="premium">
      
    <main className="min-h-screen bg-[#f8fafc] text-gray-900 transition-colors duration-300 app-dark:bg-[#0b0f14] app-dark:text-slate-100">

      {/* ================= NAVBAR ================= */}

      <header className="sticky top-0 z-50 border-b border-gray-200/70 bg-white/90 backdrop-blur-xl transition-colors duration-300 app-dark:border-slate-800/80 app-dark:bg-[linear-gradient(90deg,#0b0f14_0%,#172033_8%,#252b70_25%,#006454_50%,#252b70_75%,#172033_92%,#0b0f14_100%)]">

        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-6 lg:px-8">

          {/* LOGO */}

          <Link href="/dashboard">
            <Image
              src="/flowex-logo.png"
              alt="Flowex"
              width={120}
              height={34}
              priority
            />
          </Link>

          {/* MAIN NAVIGATION */}

          <nav className="hidden items-center gap-1 md:flex">

            <Link
              href="/dashboard"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-900 transition hover:bg-gray-100 app-dark:text-white app-dark:hover:bg-white/10"
            >
              Dashboard
            </Link>

            <a
              href="#automations"
              className="rounded-xl px-4 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 app-dark:text-slate-300 app-dark:hover:bg-white/10 app-dark:hover:text-white"
            >
              Automations
            </a>

            <Link
              href="/lead-capture/leads"
              className="rounded-xl px-4 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 app-dark:text-slate-300 app-dark:hover:bg-white/10 app-dark:hover:text-white"
            >
              Leads
            </Link>

          </nav>

          {/* ACCOUNT */}

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

                <span
                  className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    plan === "trial"
                      ? "bg-cyan-100 text-cyan-700 app-dark:bg-cyan-500/10 app-dark:text-cyan-400"
                      : plan === "pro"
                        ? "bg-emerald-100 text-emerald-700 app-dark:bg-emerald-500/10 app-dark:text-emerald-400"
                        : "bg-gray-100 text-gray-500 app-dark:bg-slate-800 app-dark:text-slate-300"
                  }`}
                >
                  {planName}
                </span>

              </div>

              <div className="my-1 h-px bg-gray-100 app-dark:bg-slate-700" />

              <Link
                href="/account"
                className="block rounded-xl px-3 py-2.5 text-sm text-gray-600 transition hover:bg-gray-50 app-dark:text-slate-300 app-dark:hover:bg-slate-800"
              >
                Account
              </Link>

              <Link
                href="/billing"
                className="block rounded-xl px-3 py-2.5 text-sm text-gray-600 transition hover:bg-gray-50 app-dark:text-slate-300 app-dark:hover:bg-slate-800"
              >
                Plan & Billing
              </Link>

              <Link
                href="/upgrade"
                className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-50 app-dark:text-emerald-400 app-dark:hover:bg-emerald-500/10"
              >
                Upgrade Plan
              </Link>

              <Link
                href="/settings"
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

      <section className="px-4 py-10 sm:px-6 lg:px-8">

        <div className="mx-auto max-w-7xl">

          {/* HEADING */}

          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">

            <div>

              <p className="text-sm font-semibold text-emerald-600 app-dark:text-emerald-400">
                DASHBOARD
              </p>

              <h1 className="mt-2 text-3xl font-black sm:text-4xl app-dark:text-white">
                Welcome back.
              </h1>

              <p className="mt-2 text-gray-500 app-dark:text-slate-400">
                Manage your Flowex automations from one place.
              </p>

            </div>

            {/* WORKSPACE STATUS */}

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-600 shadow-sm app-dark:border-slate-700 app-dark:bg-[#11161d] app-dark:text-slate-300">

              <span className="h-2 w-2 rounded-full bg-emerald-500" />

              1 automation active

            </div>

          </div>

          {/* ================= WORKFLOWS ================= */}

          <div
            id="automations"
            className="mt-8 scroll-mt-24 grid gap-5 md:grid-cols-2 lg:grid-cols-3"
          >

            {/* LEAD CAPTURE */}

            <div className="group relative overflow-hidden rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl app-dark:border-slate-800 app-dark:bg-[#11161d] app-dark:shadow-[0_15px_45px_rgba(0,0,0,0.20)] app-dark:hover:border-slate-700">

              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-200/30 blur-3xl app-dark:bg-emerald-500/10" />

              <div className="relative">

                <div className="flex items-start justify-between">

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-cyan-100 text-xl app-dark:from-[#00c297]/40 app-dark:to-[#4b52f7]/40">
                    ⚡
                  </div>

                  <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 app-dark:bg-gradient-to-r app-dark:from-[#00c297] app-dark:to-[#4b52f7] app-dark:p-[1px]">

                    <span className="flex items-center gap-1.5 rounded-full app-dark:bg-[#0b0f14] app-dark:px-[11px] app-dark:py-[3px] app-dark:text-white">

                      <span className="h-2 w-2 rounded-full bg-emerald-500" />

                      Active

                    </span>

                  </span>

                </div>

                <h2 className="mt-6 text-xl font-bold app-dark:text-white">
                  Lead Capture
                </h2>

                <p className="mt-2 min-h-[48px] text-sm leading-6 text-gray-500 app-dark:text-slate-400">
                  Capture every lead, reply instantly and keep your team notified.
                </p>

                <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-5 app-dark:border-slate-700">

                  <div>

                    <p className="text-xs text-gray-400 app-dark:text-slate-500">
                      Leads today
                    </p>

                    <p className="mt-1 text-xl font-black app-dark:text-white">
                      {isLoadingLeadsToday
                        ? "—"
                        : leadsToday}
                    </p>

                  </div>

                  <Link
                    href="/lead-capture/dashboard"
                    className="rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5"
                  >
                    Open
                  </Link>

                </div>

              </div>

            </div>

            {/* AI ASSISTANT */}

            <div className="relative overflow-hidden rounded-[28px] border border-gray-200 bg-white/70 p-6 transition-colors duration-300 app-dark:border-slate-800 app-dark:bg-[#11161d]/80">

              <div className="absolute inset-0 bg-gray-50/40 backdrop-blur-[1px] app-dark:bg-slate-950/20" />

              <div className="relative">

                <div className="flex items-start justify-between">

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-xl app-dark:bg-indigo-500/15">
                    ✦
                  </div>

                  <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500 app-dark:bg-gradient-to-r app-dark:from-[#00c297] app-dark:to-[#4b52f7] app-dark:p-[1px]">

                    <span className="rounded-full app-dark:bg-[#0b0f14] app-dark:px-[11px] app-dark:py-[3px] app-dark:text-white">
                      Coming Soon
                    </span>

                  </span>

                </div>

                <h2 className="mt-6 text-xl font-bold text-gray-600 app-dark:text-slate-300">
                  AI Assistant
                </h2>

                <p className="mt-2 min-h-[48px] text-sm leading-6 text-gray-400 app-dark:text-slate-500">
                  An AI assistant that helps handle customer questions automatically.
                </p>

                <div className="mt-6 border-t border-gray-100 pt-5 app-dark:border-slate-700">

                  <button
                    disabled
                    className="w-full cursor-not-allowed rounded-xl bg-gray-100 py-2.5 text-sm font-semibold text-gray-400 app-dark:bg-slate-800 app-dark:text-slate-500"
                  >
                    Coming Soon
                  </button>

                </div>

              </div>

            </div>

            {/* APPOINTMENT AUTOMATION */}

            <div className="relative overflow-hidden rounded-[28px] border border-gray-200 bg-white/70 p-6 transition-colors duration-300 app-dark:border-slate-800 app-dark:bg-[#11161d]/80">

              <div className="absolute inset-0 bg-gray-50/40 backdrop-blur-[1px] app-dark:bg-slate-950/20" />

              <div className="relative">

                <div className="flex items-start justify-between">

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100 text-xl app-dark:bg-cyan-500/15">
                    ◷
                  </div>

                  <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500 app-dark:bg-gradient-to-r app-dark:from-[#00c297] app-dark:to-[#4b52f7] app-dark:p-[1px]">

                    <span className="rounded-full app-dark:bg-[#0b0f14] app-dark:px-[11px] app-dark:py-[3px] app-dark:text-white">
                      Coming Soon
                    </span>

                  </span>

                </div>

                <h2 className="mt-6 text-xl font-bold text-gray-600 app-dark:text-slate-300">
                  Appointment Automation
                </h2>

                <p className="mt-2 min-h-[48px] text-sm leading-6 text-gray-400 app-dark:text-slate-500">
                  Automate bookings, confirmations and customer reminders.
                </p>

                <div className="mt-6 border-t border-gray-100 pt-5 app-dark:border-slate-700">

                  <button
                    disabled
                    className="w-full cursor-not-allowed rounded-xl bg-gray-100 py-2.5 text-sm font-semibold text-gray-400 app-dark:bg-slate-800 app-dark:text-slate-500"
                  >
                    Coming Soon
                  </button>

                </div>

              </div>

            </div>

          </div>

          {/* ================= MORE COMING ================= */}

          <div className="mt-6 rounded-[26px] border border-dashed border-gray-300 bg-white/50 px-6 py-5 text-center transition-colors duration-300 app-dark:border-slate-700 app-dark:bg-[#11161d]/50">

            <p className="text-sm font-semibold text-gray-600 app-dark:text-slate-300">
              More Flowex automations are on the way.
            </p>

            <p className="mt-1 text-xs text-gray-400 app-dark:text-slate-500">
              New workflows will appear here as they become available.
            </p>

          </div>

          {/* ================= QUICK HELP ================= */}

          <div className="mt-5 flex flex-col items-start justify-between gap-4 rounded-[22px] border border-gray-200 bg-white px-6 py-5 sm:flex-row sm:items-center app-dark:border-slate-800 app-dark:bg-[#11161d]">

            <div>

              <p className="text-sm font-semibold text-gray-800 app-dark:text-slate-200">
                Need help setting up Flowex?
              </p>

              <p className="mt-1 text-xs text-gray-400 app-dark:text-slate-500">
                Browse setup guides, integrations and automation resources.
              </p>

            </div>

            <Link
              href="/resources"
              className="text-sm font-semibold text-[#4b52f7] transition hover:opacity-70 app-dark:text-[#7c83ff]"
            >
              Open Resources →
            </Link>

          </div>

        </div>

      </section>

      {/* ================= FOOTER ================= */}

      <footer className="mt-10 border-t border-gray-200/70 bg-white/90 transition-colors duration-300 app-dark:border-slate-800/80 app-dark:bg-[linear-gradient(90deg,#0b0f14_0%,#172033_8%,#252b70_25%,#006454_50%,#252b70_75%,#172033_92%,#0b0f14_100%)]">

        <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8">

          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">

            {/* BRAND */}

            <div className="flex items-center gap-4">

              <Image
                src="/flowex-logo.png"
                alt="Flowex"
                width={105}
                height={30}
              />

              <span className="hidden text-sm text-gray-400 app-dark:text-slate-300 lg:block">
                Automate your business.
              </span>

            </div>

            {/* LINKS */}

            <div className="flex items-center gap-6 text-sm font-medium text-gray-500 app-dark:text-slate-200">

  <Link
    href="/dashboard"
    className="transition hover:text-gray-900 app-dark:hover:text-white"
  >
    Dashboard
  </Link>

  <Link
    href="/account"
    className="transition hover:text-gray-900 app-dark:hover:text-white"
  >
    Account
  </Link>

  <Link
    href="/settings"
    className="transition hover:text-gray-900 app-dark:hover:text-white"
  >
    Settings
  </Link>

  <Link
    href="/billing"
    className="transition hover:text-gray-900 app-dark:hover:text-white"
  >
    Billing
  </Link>

</div>

            {/* COPYRIGHT */}

            <p className="text-xs text-gray-400 app-dark:text-slate-300">
              © 2026 Flowex.
            </p>

          </div>

        </div>

      </footer>

    </main>

   </RouteGuard>
  );
}