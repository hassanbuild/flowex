"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { useFlowexLogout } from "@/components/useFlowexLogout";
import { useAppTheme } from "@/components/AppThemeProvider";
import { useAppAccount } from "@/components/AppAccountProvider";
import RouteGuard from "@/components/RouteGuard";

export default function Home() {
  const {
    logout,
    isLoggingOut,
  } = useFlowexLogout();

  const {
    theme,
    toggleTheme,
  } = useAppTheme();

  const {
    name,
    email,
    profileImage,
    plan,
  } = useAppAccount();

  const [leadsCount, setLeadsCount] =
    useState(0);

  const [replyTime, setReplyTime] =
    useState(0);

  const [successRate, setSuccessRate] =
    useState(0);

  useEffect(() => {
    const duration = 1400;
    const steps = 40;
    const intervalTime =
      duration / steps;

    let currentStep = 0;

    const counter =
      setInterval(() => {
        currentStep += 1;

        const progress =
          currentStep / steps;

        setLeadsCount(
          Math.round(
            127 * progress
          )
        );

        setReplyTime(
          Number(
            (
              1.8 * progress
            ).toFixed(1)
          )
        );

        setSuccessRate(
          Math.round(
            99 * progress
          )
        );

        if (
          currentStep >=
          steps
        ) {
          setLeadsCount(127);
          setReplyTime(1.8);
          setSuccessRate(99);

          clearInterval(
            counter
          );
        }
      }, intervalTime);

    return () =>
      clearInterval(
        counter
      );
  }, []);

  const firstName =
    name.trim().split(" ")[0] ||
    "there";

  return (
    <RouteGuard access="free">

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#fbfcfd] text-gray-900 transition-colors duration-300 app-dark:bg-[#0b0f14] app-dark:text-slate-100">

      {/* ================= AMBIENT BACKGROUND ================= */}

      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">

        {/* Emerald glow - top left */}
       <div className="absolute -left-40 top-20 h-[500px] w-[500px] animate-[float1_18s_ease-in-out_infinite] rounded-full bg-emerald-300/20 blur-[150px]" />

        {/* Cyan glow - hero center */}
       <div className="absolute left-[40%] top-[250px] h-[420px] w-[420px] animate-[float2_22s_ease-in-out_infinite] rounded-full bg-cyan-300/20 blur-[160px]" />

       {/* Indigo glow - top right */}
       <div className="absolute -right-40 top-10 h-[500px] w-[500px] animate-[float3_20s_ease-in-out_infinite] rounded-full bg-indigo-300/20 blur-[160px]" />

      </div>

      {/* ================= NAVBAR ================= */}

      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-gray-200/70 bg-white/85 backdrop-blur-xl app-dark:border-slate-800/80 app-dark:bg-[linear-gradient(90deg,#0b0f14_0%,#172033_8%,#252b70_25%,#006454_50%,#252b70_75%,#172033_92%,#0b0f14_100%)]">

        <div className="mx-auto flex h-[55px] max-w-8xl items-center justify-between px-6 lg:px-8">

          <Image
            src="/flowex-logo.png"
            alt="Flowex"
            width={125}
            height={34}
            priority
          />

          <div className="hidden items-center gap-10 lg:flex">

            <a
              href="#product"
             className="transition hover:text-gray-900 app-dark:hover:text-white"
            >
              Product
           </a>

            <a
              href="#solutions"
              className="transition hover:text-gray-900 app-dark:hover:text-white"
            >
              Solutions
           </a>

            <a
             href="#pricing"
             className="transition hover:text-gray-900 app-dark:hover:text-white"
            >
             Pricing
           </a>


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

             <div className="invisible absolute right-0 top-12 z-50 w-56 translate-y-2 rounded-2xl border border-gray-200 bg-white p-2 opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 app-dark:border-slate-700 app-dark:bg-[#11161d] app-dark:shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
               <div className="px-3 py-2">
                 <p className="text-sm font-semibold app-dark:text-white">{name}</p>
                 <p className="truncate text-xs text-gray-400 app-dark:text-slate-400">{email}</p>
                 <p className="mt-1 text-xs font-semibold text-emerald-600 app-dark:text-emerald-400">
                   {plan === "pro"
                     ? "Flowex Pro"
                     : plan === "trial"
                       ? "Flowex Pro Trial"
                       : "Free"}
                 </p>
               </div>

               <div className="my-1 h-px bg-gray-100 app-dark:bg-slate-700" />

               <Link href="/account" className="block rounded-xl px-3 py-2.5 text-sm text-gray-600 transition hover:bg-gray-50 app-dark:text-slate-300 app-dark:hover:bg-slate-800">Account</Link>
               <Link href="/billing" className="block rounded-xl px-3 py-2.5 text-sm text-gray-600 transition hover:bg-gray-50 app-dark:text-slate-300 app-dark:hover:bg-slate-800">Plan & Billing</Link>
               <Link href="/upgrade" className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-50 app-dark:text-emerald-400 app-dark:hover:bg-emerald-500/10">Upgrade Plan</Link>
               <Link href="/settings" className="block rounded-xl px-3 py-2.5 text-sm text-gray-600 transition hover:bg-gray-50 app-dark:text-slate-300 app-dark:hover:bg-slate-800">Settings</Link>

               <button type="button" onClick={toggleTheme} className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm text-gray-600 transition hover:bg-gray-50 app-dark:text-slate-300 app-dark:hover:bg-slate-800">
                 <span>Theme</span>
                 <span className="text-lg leading-none text-gray-500 app-dark:text-slate-200">{theme === "dark" ? "☾" : "☀"}</span>
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

      </nav>

      {/* ================= HERO ================= */}

      <section className="mx-auto max-w-7xl px-8 pt-16 pb-12">

        <div className="grid items-center gap-20 lg:grid-cols-2">

          {/* LEFT */}

          <div>

            <div className="mb-3">
              <span className="inline-flex rounded-full border border-gray-200 bg-white/80 px-4 py-1.5 text-xs font-semibold text-gray-600 shadow-sm backdrop-blur app-dark:border-slate-700 app-dark:bg-slate-900/80 app-dark:text-slate-300">
                Welcome back, {firstName}
              </span>
            </div>

            <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 p-[1px] text-sm font-semibold text-emerald-700 app-dark:border-0 app-dark:bg-gradient-to-r app-dark:from-[#00c297] app-dark:to-[#4b52f7]">
              <span className="rounded-full px-5 py-2 app-dark:bg-[#0b0f14] app-dark:text-white">
               Setup in under 2 minutes
             </span>
           </span>

            <h1 className="mt-1 text-5xl font-black leading-tight md:text-6xl">

              Never Lose

              <br />

              Another

              <br />

              <span className="bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 bg-clip-text text-transparent">

                Lead

              </span>

            </h1>

            <p className="mt-6 max-w-lg text-lg leading-8 text-gray-600 app-dark:text-slate-300">

              Flowex captures every lead, replies instantly, notifies your team,
              and keeps your business running 24/7—so you never miss another customer.

            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">

              <Link
  href="/checkout"
  className="rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 px-8 py-4 text-center font-semibold text-white shadow-xl transition hover:-translate-y-1"
>
  Start 7-Day Free Trial
</Link>

            </div>

            <div className="mt-10 flex flex-wrap gap-8 text-sm font-medium text-gray-500 app-dark:text-slate-400">

              <span>✓ Setup in 2 Minutes</span>

              <span>✓ 7-Day Free Trial</span>

              <span>✓ Cancel Anytime</span>

            </div>

          </div>

{/* RIGHT */}

<div className="relative">

  {/* Dashboard Glow */}
  <div className="pointer-events-none absolute -inset-8 -z-10 rounded-[40px] bg-gradient-to-br from-emerald-200/30 via-cyan-200/30 to-indigo-200/30 blur-3xl" />

  {/* Dashboard Card */}
  <div className="animate-[dashboard_8s_ease-in-out_infinite] rounded-[36px] border border-white/50 bg-white/90 app-dark:border-slate-700/70 app-dark:bg-slate-900/90 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.08)] backdrop-blur">

    <div className="mb-8 flex items-center justify-between">

      <div>
        <p className="text-sm text-gray-500 app-dark:text-slate-400">
          Flowex Dashboard
        </p>

        <h3 className="text-2xl font-bold">
          Lead Automation
        </h3>
      </div>

      <div className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700 app-dark:bg-gradient-to-r app-dark:from-[#00c297] app-dark:to-[#4b52f7] app-dark:p-[1px]">
       <span className="rounded-full app-dark:bg-[#0b0f14] app-dark:px-[11px] app-dark:py-[3px] app-dark:text-white">
         ● Active
       </span>
      </div>

    </div>

    <div className="space-y-6">

      {/* Stats */}

      <div className="grid grid-cols-3 gap-4">

        <div className="rounded-2xl bg-slate-50 p-4 app-dark:bg-slate-800">
          <p className="text-xs text-gray-500 app-dark:text-slate-400">Leads</p>
          <h4 className="mt-2 text-3xl font-black">
           {leadsCount}
         </h4>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4 app-dark:bg-slate-800">
          <p className="text-xs text-gray-500 app-dark:text-slate-400">Reply Time</p>
          <h4 className="mt-2 text-3xl font-black">
           {replyTime.toFixed(1)}s
         </h4>
        </div>

        <div className="rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 p-4 text-white app-dark:from-emerald-700 app-dark:via-cyan-700 app-dark:to-indigo-700">
            <p className="text-xs opacity-80 app-dark:opacity-100">
              Success
           </p>

            <h4 className="mt-2 text-3xl font-black">
             {successRate}%
           </h4>
        </div>

      </div>

      {/* Workflow */}

      <div className="rounded-3xl border border-gray-100 p-6 app-dark:border-slate-700">

        <p className="font-semibold">
          Latest Automation
        </p>

        <div className="mt-5 space-y-4">

          <div className="flex items-center justify-between">
            <span>New Lead</span>
            <span className="font-medium text-gray-500 app-dark:text-slate-400">
              Acme Marketing
            </span>
          </div>

          <div className="h-px bg-gray-100 app-dark:bg-slate-700" />

          <div className="flex items-center justify-between">
            <span>Reply Sent</span>
            <span className="text-emerald-600">✓</span>
          </div>

          <div className="h-px bg-gray-100 app-dark:bg-slate-700" />

          <div className="flex items-center justify-between">
            <span>CRM Updated</span>
            <span className="text-emerald-600">✓</span>
          </div>

          <div className="h-px bg-gray-100 app-dark:bg-slate-700" />

          <div className="flex items-center justify-between">
            <span>Team Notified</span>
            <span className="text-emerald-600">✓</span>
          </div>

        </div>

      </div>

    </div>

  </div>
</div>

 </div>

  </section>
{/* ================= PRICING ================= */}

<section
  id="pricing"
  className="relative scroll-mt-[52px] overflow-hidden border-y border-gray-200/70 bg-gradient-to-br from-emerald-50/70 via-cyan-50/30 to-indigo-50/60 app-dark:border-slate-800 app-dark:from-emerald-950/30 app-dark:via-slate-950 app-dark:to-indigo-950/30 py-5"
>
     <div className="pointer-events-none absolute left-1/2 top-1/2 -z-0 h-[350px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-200/20 blur-[120px]" />

    <div className="relative z-10 mx-auto max-w-6xl px-8">

    <div className="mt-1 grid gap-5 lg:grid-cols-3">

      {/* PLAN 1 */}

      <div className="relative scale-[0.92] rounded-[24px] border border-gray-200 bg-white p-5 app-dark:border-slate-700 app-dark:bg-slate-900 opacity-50 blur-[1.5px]">

        <span className="absolute right-5 top-5 rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold text-white">
          Coming Soon
        </span>

        <h3 className="text-2xl font-bold">
          Flowex Plus
        </h3>

        <p className="mt-3 text-gray-500 app-dark:text-slate-400">
          For growing teams needing multiple workflows.
        </p>

        <div className="mt-8">

          <span className="text-5xl font-black">
            —
          </span>

        </div>

        <div className="mt-8 space-y-4 text-gray-600 app-dark:text-slate-300">

          <p>✓ Multiple Automations</p>

          <p>✓ Team Members</p>

          <p>✓ Advanced Analytics</p>

          <p>✓ Shared Workspace</p>

        </div>

      </div>

      {/* PLAN 2 */}

      <div className="relative rounded-[28px] border-2 border-emerald-500 bg-white px-7 py-5 app-dark:bg-slate-900 shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl">

        <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 px-5 py-2 text-sm font-bold text-white shadow-lg">
          MOST POPULAR
        </span>

        <h3 className="text-3xl font-bold">
          Flowex Pro
        </h3>

        <p className="mt-3 text-gray-500 app-dark:text-slate-400">
          Everything you need to automate your lead capture.
        </p>

        <div className="mt-8 flex items-end gap-3">

          <span className="text-2xl text-gray-400 app-dark:text-slate-500 line-through">
            $15
          </span>

          <span className="text-5xl font-black">
            $10
          </span>

          <span className="pb-2 text-gray-500 app-dark:text-slate-400">
            /month
          </span>

        </div>
         <div className="mt-3 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700 app-dark:bg-gradient-to-r app-dark:from-[#00c297] app-dark:to-[#4b52f7] app-dark:p-[1px]">
           <span className="rounded-full app-dark:bg-[#0b0f14] app-dark:px-[11px] app-dark:py-[3px] app-dark:text-white">
             • 33% OFF
           </span>
         </div>

        <div className="mt-5 space-y-2 text-gray-700 app-dark:text-slate-200">

          <p>✓ Unlimited Leads</p>

          <p>✓ Instant Customer Replies</p>

          <p>✓ CRM Sync</p>

          <p>✓ Email Notifications</p>

          <p>✓ Live Dashboard</p>

        </div>

        <Link
  href="/checkout"
  className="mt-10 block w-full rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 py-3.5 text-center font-semibold text-white transition hover:scale-[1.02]"
>
  Start 7-Day Free Trial
</Link>

        <p className="mt-4 text-center text-sm text-gray-500 app-dark:text-slate-400">
         7-day free trial • Cancel anytime
        </p>

      </div>

      {/* PLAN 3 */}

      <div className="relative scale-[0.92] rounded-[24px] border border-gray-200 bg-white p-5 app-dark:border-slate-700 app-dark:bg-slate-900 opacity-50 blur-[1.5px]">

        <span className="absolute right-5 top-5 rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold text-white">
          Coming Soon
        </span>

        <h3 className="text-2xl font-bold">
         Flowex 
        </h3>
        <h3 className="text-2xl font-bold">
         Enterprise
        </h3>

        <p className="mt-3 text-gray-500 app-dark:text-slate-400">
          AI-powered automation and advanced business workflows.
        </p>

        <div className="mt-8">

          <span className="text-5xl font-black">
            Custom
          </span>

        </div>

        <div className="mt-8 space-y-4 text-gray-600 app-dark:text-slate-300">

          <p>✓ AI Agents</p>

          <p>✓ Custom Integrations</p>

          <p>✓ Priority Support</p>

          <p>✓ Unlimited Workflows</p>

        </div>

      </div>

    </div>

  </div>

</section>

{/* ================= PRODUCT ================= */}

<section
  id="product"
  className="relative scroll-mt-[50px] px-6 py-16 sm:px-6 lg:px-8"
>
  <div className="mx-auto max-w-8xl">

    {/* HEADING */}

    <div className="mx-auto max-w-2xl text-center">
      <h2 className="mt-6 text-5xl font-black">
        <span className="bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 bg-clip-text text-transparent">
           {" "}PRODUCTS
         </span>
     </h2>

      <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
        Automation that grows with you.
      </h2>

      <p className="mt-3 text-gray-500 app-dark:text-slate-400">
        Start with lead capture. More Flowex automations are on the way.
      </p>
    </div>

    {/* PRODUCT CARDS */}

    <div className="mt-9 grid gap-5 md:grid-cols-3">

      {/* LEAD CAPTURE */}

      <div className="group relative overflow-hidden rounded-[26px] border border-emerald-200 bg-white p-6 app-dark:border-emerald-900/60 app-dark:bg-slate-900 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">

        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-200/30 blur-3xl" />

        <div className="relative">

          <div className="flex items-start justify-between">

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-cyan-100 text-lg app-dark:from-[#00c297]/40 app-dark:to-[#4b52f7]/40">
             ⚡
           </div>

            <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 app-dark:bg-gradient-to-r app-dark:from-[#00c297] app-dark:to-[#4b52f7] app-dark:p-[1px]">
             <span className="flex items-center gap-1.5 rounded-full app-dark:bg-[#0b0f14] app-dark:px-[11px] app-dark:py-[3px] app-dark:text-white">
               <span className="h-2 w-2 rounded-full bg-emerald-500" />
                 Available
               </span>
             </span>

          </div>

          <h3 className="mt-6 text-xl font-bold">
            Lead Capture
          </h3>

          <p className="mt-2 text-sm leading-6 text-gray-500 app-dark:text-slate-400">
            Capture every lead, reply instantly, notify your team and follow up automatically.
          </p>

          <div className="mt-6 border-t border-gray-100 pt-5">

           <Link
  href="/checkout"
  className="inline-flex items-center text-sm font-semibold text-emerald-600 transition hover:text-emerald-700"
>
  Get started
  <span className="ml-2">→</span>
</Link>

          </div>

        </div>
      </div>

      {/* AI ASSISTANT */}

      <div className="relative overflow-hidden rounded-[26px] border border-gray-200 bg-white/70 p-6 app-dark:border-slate-700 app-dark:bg-slate-900/80">

        <div className="absolute inset-0 bg-gray-50/30 app-dark:bg-slate-800/20" />

        <div className="relative">

          <div className="flex items-start justify-between">

           <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-cyan-100 text-lg app-dark:from-[#00c297]/40 app-dark:to-[#4b52f7]/40">
             ✦
           </div>
            <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500 app-dark:bg-gradient-to-r app-dark:from-[#00c297] app-dark:to-[#4b52f7] app-dark:p-[1px]">
              <span className="rounded-full app-dark:bg-[#0b0f14] app-dark:px-[11px] app-dark:py-[3px] app-dark:text-white">
               Coming Soon
             </span>
           </span>

          </div>

          <h3 className="mt-6 text-xl font-bold text-gray-700 app-dark:text-slate-200">
            AI Assistant
          </h3>

          <p className="mt-2 text-sm leading-6 text-gray-500 app-dark:text-slate-400">
            An AI assistant that handles customer questions and conversations automatically.
          </p>

          <div className="mt-6 border-t border-gray-100 pt-5">

            <span className="text-sm font-semibold text-gray-400 app-dark:text-slate-500">
              In development
            </span>

          </div>

        </div>
      </div>

      {/* APPOINTMENT AUTOMATION */}

      <div className="relative overflow-hidden rounded-[26px] border border-gray-200 bg-white/70 p-6 app-dark:border-slate-700 app-dark:bg-slate-900/80">

        <div className="absolute inset-0 bg-gray-50/30 app-dark:bg-slate-800/20" />

        <div className="relative">

          <div className="flex items-start justify-between">

           <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-cyan-100 text-lg app-dark:from-[#00c297]/40 app-dark:to-[#4b52f7]/40">
             ◷
           </div>
            <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500 app-dark:bg-gradient-to-r app-dark:from-[#00c297] app-dark:to-[#4b52f7] app-dark:p-[1px]">
              <span className="rounded-full app-dark:bg-[#0b0f14] app-dark:px-[11px] app-dark:py-[3px] app-dark:text-white">
               Coming Soon
             </span>
           </span>

          </div>

          <h3 className="mt-6 text-xl font-bold text-gray-700 app-dark:text-slate-200">
            Appointment Automation
          </h3>

          <p className="mt-2 text-sm leading-6 text-gray-500 app-dark:text-slate-400">
            Automate bookings, confirmations and reminders without the manual work.
          </p>

          <div className="mt-6 border-t border-gray-100 pt-5">

            <span className="text-sm font-semibold text-gray-400 app-dark:text-slate-500">
              Coming soon
            </span>

          </div>

        </div>
      </div>

    </div>

  </div>
</section>

      {/* ================= HOW IT WORKS ================= */}

      <section
        id="solutions"
       className="relative scroll-mt-[95px] border-y border-slate-100 bg-slate-50/70 app-dark:border-slate-800 app-dark:bg-slate-950/60 py-10"
      >    
        <div className="mx-auto max-w-7xl px-8">

          <div className="text-center">

            <h2 className="mt-6 text-5xl font-black">

              Automation in

              <span className="bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 bg-clip-text text-transparent">

                {" "}4 simple steps

              </span>

            </h2>

          </div>

          <div className="mt-20 grid gap-8 md:grid-cols-2 xl:grid-cols-4">

            {[
              {
                number: "01",
                title: "Connect",
                desc: "Connect your website, forms or CRM in minutes.",
              },
              {
                number: "02",
                title: "Capture",
                desc: "Every customer inquiry enters Flowex instantly.",
              },
              {
                number: "03",
                title: "Respond",
                desc: "Automatic replies are sent within seconds.",
              },
              {
                number: "04",
                title: "Grow",
                desc: "Your team stays informed while Flowex keeps working.",
              },
            ].map((step) => (

              <div
                key={step.number}
                className="rounded-[30px] border border-gray-100 bg-white p-8 app-dark:border-slate-700 app-dark:bg-slate-900 shadow-lg transition duration-300 hover:-translate-y-2 hover:shadow-2xl"
              >

                <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 text-xl font-bold text-white">

                  {step.number}

                </div>

                <h3 className="text-2xl font-bold">

                  {step.title}

                </h3>

                <p className="mt-4 leading-8 text-gray-600 app-dark:text-slate-300">

                  {step.desc}

                </p>

              </div>

            ))}

          </div>

        </div>

      </section>
{/* ================= SIMPLE PLAN ================= */}

<section className="relative overflow-hidden bg-gradient-to-br from-white via-cyan-50/40 to-indigo-50/40 app-dark:from-slate-950 app-dark:via-cyan-950/20 app-dark:to-indigo-950/20 py-8">

  <div className="relative z-10 mx-auto max-w-5xl px-6 lg:px-8">

    <div className="text-center">

      <h2 className="text-3xl font-black">
        One plan.
        <span className="bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 bg-clip-text text-transparent">
          {" "}Everything included.
        </span>
      </h2>

      <p className="mt-2 text-sm text-gray-500 app-dark:text-slate-400">
        No hidden fees. No contracts. Cancel anytime.
      </p>

    </div>

    <div className="mx-auto mt-6 max-w-3xl rounded-[26px] border border-gray-200/80 bg-white/90 app-dark:border-slate-700 app-dark:bg-slate-900/90 px-8 py-6 shadow-xl backdrop-blur">

      <div className="grid items-center gap-8 md:grid-cols-[0.8fr_1.2fr]">

        {/* PRICE */}

        <div className="text-center md:text-left">

          <h3 className="text-xl font-bold">
            Flowex Pro
          </h3>

          <div className="mt-3 flex items-end justify-center gap-2 md:justify-start">

            <span className="text-lg text-gray-400 app-dark:text-slate-500 line-through">
              $15
            </span>

            <span className="text-5xl font-black">
              $10
            </span>

            <span className="pb-1 text-sm text-gray-500 app-dark:text-slate-400">
              /month
            </span>

          </div>

          <div className="mt-3 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700 app-dark:bg-gradient-to-r app-dark:from-[#00c297] app-dark:to-[#4b52f7] app-dark:p-[1px]">
            <span className="rounded-full app-dark:bg-[#0b0f14] app-dark:px-[11px] app-dark:py-[3px] app-dark:text-white">
             • Save 33%
           </span>
         </div>

        </div>

        {/* FEATURES */}

        <div>

          <div className="grid grid-cols-2 gap-x-5 gap-y-2.5 text-sm text-gray-700 app-dark:text-slate-200">

            <span>✓ Unlimited Leads</span>
            <span>✓ Instant Replies</span>
            <span>✓ CRM Integration</span>
            <span>✓ Notifications</span>
            <span>✓ Live Dashboard</span>
            <span>✓ Cancel Anytime</span>

          </div>

          <Link
  href="/checkout"
  className="mt-5 block w-full rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 py-3 text-center font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5"
>
  Start 7-Day Free Trial
</Link>

          <p className="mt-2 text-center text-xs text-gray-400 app-dark:text-slate-500">
            7-day free trial • Cancel anytime
          </p>

        </div>

      </div>

    </div>

  </div>

</section>
{/* ================= FAQ ================= */}

<section id="faq" className=" py-9">

  <div className="mx-auto max-w-6xl px-8">

    <div className="text-center">

      <h2 className="mt-6 text-5xl font-black">
        Frequently Asked
        <span className="bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 bg-clip-text text-transparent">
          {" "}Questions
        </span>
      </h2>

      <p className="mt-5 text-lg text-gray-600 app-dark:text-slate-300">
        Everything you need to know before getting started.
      </p>

    </div>

    <div className="mt-14 space-y-5">

      {[
        {
          q: "How long does setup take?",
          a: "Most businesses are connected and receiving leads in under 2 minutes.",
        },
        {
          q: "Do I need coding experience?",
          a: "No. Flowex is built for non-technical users. Just connect your apps and you're ready.",
        },
        {
          q: "Can I cancel anytime?",
          a: "Yes. There are no contracts or hidden fees. Cancel whenever you want.",
        },
        {
          q: "Which platforms can I connect?",
          a: "Website forms, Facebook, Instagram, WhatsApp, CRM systems, Slack and more.",
        },
      ].map((faq) => (

        <details
          key={faq.q}
          className="group rounded-3xl border border-gray-100 bg-white p-7 app-dark:border-slate-700 app-dark:bg-slate-900 shadow-sm transition hover:shadow-lg transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
        >

          <summary className="cursor-pointer list-none text-lg font-bold flex items-center justify-between">

            {faq.q}

            <span className="text-2xl transition group-open:rotate-45">
              +
            </span>

          </summary>

          <p className="mt-5 leading-8 text-gray-600 app-dark:text-slate-300">
            {faq.a}
          </p>

        </details>

      ))}

    </div>

  </div>

</section>
{/* ================= FOOTER ================= */}

<footer className="border-t border-gray-200/70 bg-white/85 backdrop-blur-xl app-dark:border-slate-800/80 app-dark:bg-[linear-gradient(90deg,#0b0f14_0%,#172033_8%,#252b70_25%,#006454_50%,#252b70_75%,#172033_92%,#0b0f14_100%)]">
  <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">

    {/* LEFT */}

    <div className="flex items-center gap-4">
      <Image
        src="/flowex-logo.png"
        alt="Flowex"
        width={110}
        height={30}
      />

      <span className="hidden text-sm text-gray-400 app-dark:text-slate-200 lg:block">
        Automate your business.
      </span>
    </div>

    {/* LINKS */}

    <div className="flex items-center gap-6 text-sm font-medium text-gray-500 app-dark:text-slate-200">

      <a
        href="#pricing"
        className="transition-colors hover:text-gray-900 app-dark:hover:text-white"
      >
        Pricing
      </a>

      <a
        href="/resources"
        className="transition-colors hover:text-gray-900 app-dark:hover:text-white"
      >
        Resources
      </a>

      <a
        href="/contact"
        className="transition-colors hover:text-gray-900 app-dark:hover:text-white"
      >
        Contact
      </a>

      <a
        href="/privacy"
        className="transition-colors hover:text-gray-900 app-dark:hover:text-white"
      >
        Privacy
      </a>

      <a
        href="/terms"
        className="transition-colors hover:text-gray-900 app-dark:hover:text-white"
      >
        Terms
      </a>

    </div>

    {/* COPYRIGHT */}

    <p className="text-xs text-gray-400 app-dark:text-slate-300">
      © 2026 Flowex. All rights reserved.
    </p>

  </div>
</footer>

          </main>

    </RouteGuard>
  );
}