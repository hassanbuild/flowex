"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAppAccount } from "@/components/AppAccountProvider";
import RouteGuard from "@/components/RouteGuard";

export default function BillingPage() {
  const { plan } = useAppAccount();
  const searchParams = useSearchParams();



  const hasPremiumAccess =
    plan === "trial" || plan === "pro";

  const fromLeadCapture =
    searchParams.get("from") === "lead-capture";

  const returnPath =
    fromLeadCapture
      ? "/lead-capture/dashboard"
      : hasPremiumAccess
        ? "/dashboard"
        : "/home";

  const planName =
    plan === "trial"
      ? "Flowex Pro Trial"
      : plan === "pro"
        ? "Flowex Pro"
        : "Free";

  const status =
    plan === "trial"
      ? "Trial Active"
      : plan === "pro"
        ? "Active"
        : "No Active Plan";

  const nextBillingDate =
    plan === "trial"
      ? "After 7-day trial"
      : plan === "pro"
        ? "Sep 9, 2026"
        : "—";

  const billingCycle =
    hasPremiumAccess
      ? "Monthly"
      : "—";


  return (
    <RouteGuard access="signed-in">
      <main className="min-h-screen bg-[#f8fafc] text-gray-900 transition-colors duration-300 app-dark:bg-[#0b0f14] app-dark:text-slate-100">

      {/* NAVBAR */}

      <header className="border-b border-gray-200/70 bg-white/90 backdrop-blur-xl transition-colors duration-300 app-dark:border-slate-800/80 app-dark:bg-[linear-gradient(90deg,#0b0f14_0%,#172033_8%,#252b70_25%,#006454_50%,#252b70_75%,#172033_92%,#0b0f14_100%)]">

        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-6 lg:px-8">

          <Link href={returnPath}>
            <Image
              src="/flowex-logo.png"
              alt="Flowex"
              width={120}
              height={34}
              priority
            />
          </Link>

          <Link
            href={returnPath}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 app-dark:border-slate-700 app-dark:bg-[#11161d] app-dark:text-slate-300 app-dark:hover:bg-slate-800"
          >
            Back
          </Link>

        </div>

      </header>

      {/* CONTENT */}

      <section className="px-4 py-10 sm:px-6 lg:px-8">

        <div className="mx-auto max-w-4xl">

          <div>

            <p className="text-sm font-semibold text-emerald-600 app-dark:text-emerald-400">
              BILLING
            </p>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl app-dark:text-white">
              Plan & Billing
            </h1>

            <p className="mt-2 text-gray-500 app-dark:text-slate-400">
              Manage your Flowex subscription and payment details.
            </p>

          </div>

          {/* CURRENT PLAN */}

          <div className="mt-8 rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm transition-colors duration-300 sm:p-8 app-dark:border-slate-800 app-dark:bg-[#11161d]">

            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">

              <div>

                <p className="text-sm font-semibold text-gray-500 app-dark:text-slate-400">
                  CURRENT PLAN
                </p>

                <h2 className="mt-2 text-2xl font-bold app-dark:text-white">
                  {planName}
                </h2>

                <p className="mt-2 text-sm text-gray-500 app-dark:text-slate-400">
                  Everything you need to automate your lead capture.
                </p>

              </div>

              <div className="sm:text-right">

                {hasPremiumAccess ? (
                  <div className="flex items-end gap-2 sm:justify-end">

                    <span className="text-xl text-gray-400 line-through app-dark:text-slate-500">
                      $15
                    </span>

                    <span className="text-4xl font-black app-dark:text-white">
                      $10
                    </span>

                    <span className="pb-1 text-sm text-gray-500 app-dark:text-slate-400">
                      /month
                    </span>

                  </div>
                ) : (
                  <div className="flex items-end gap-2 sm:justify-end">

                    <span className="text-4xl font-black app-dark:text-white">
                      $0
                    </span>

                    <span className="pb-1 text-sm text-gray-500 app-dark:text-slate-400">
                      /month
                    </span>

                  </div>
                )}

              </div>

            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-3">

              <div className="rounded-2xl bg-gray-50 p-4 app-dark:bg-[#0b0f14]">

                <p className="text-xs text-gray-400 app-dark:text-slate-500">
                  Status
                </p>

                <p
                  className={`mt-2 font-semibold ${
                    plan === "free"
                      ? "text-gray-500 app-dark:text-slate-400"
                      : "text-emerald-600 app-dark:text-emerald-400"
                  }`}
                >
                  {status}
                </p>

              </div>

              <div className="rounded-2xl bg-gray-50 p-4 app-dark:bg-[#0b0f14]">

                <p className="text-xs text-gray-400 app-dark:text-slate-500">
                  Next Billing Date
                </p>

                <p className="mt-2 font-semibold app-dark:text-white">
                  {nextBillingDate}
                </p>

              </div>

              <div className="rounded-2xl bg-gray-50 p-4 app-dark:bg-[#0b0f14]">

                <p className="text-xs text-gray-400 app-dark:text-slate-500">
                  Billing Cycle
                </p>

                <p className="mt-2 font-semibold app-dark:text-white">
                  {billingCycle}
                </p>

              </div>

            </div>

            {plan === "free" ? (
              <Link
                href={fromLeadCapture ? "/upgrade?from=lead-capture" : "/upgrade"}
                className="mt-7 inline-flex rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5"
              >
                Manage Subscription
              </Link>
            ) : (
              <button className="mt-7 rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5">
                Manage Subscription
              </button>
            )}

          </div>

          {/* PAYMENT METHOD */}

          <div className="mt-6 rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm transition-colors duration-300 sm:p-8 app-dark:border-slate-800 app-dark:bg-[#11161d]">

            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">

              <div>

                <h2 className="text-xl font-bold app-dark:text-white">
                  Payment Method
                </h2>

                <p className="mt-1 text-sm text-gray-500 app-dark:text-slate-400">
                  Card used for your Flowex subscription.
                </p>

              </div>

              <button className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 app-dark:border-slate-700 app-dark:bg-[#0b0f14] app-dark:text-slate-300 app-dark:hover:bg-slate-800">
                Update Card
              </button>

            </div>

            {hasPremiumAccess ? (
              <div className="mt-6 flex items-center gap-4 rounded-2xl bg-gray-50 p-4 app-dark:bg-[#0b0f14]">

                <div className="flex h-11 w-16 items-center justify-center rounded-lg bg-white text-sm font-bold shadow-sm app-dark:bg-[#11161d] app-dark:text-white">
                  VISA
                </div>

                <div>

                  <p className="font-semibold app-dark:text-white">
                    •••• •••• •••• 4242
                  </p>

                  <p className="mt-1 text-xs text-gray-400 app-dark:text-slate-500">
                    Expires 08/29
                  </p>

                </div>

              </div>
            ) : (
              <div className="mt-6 flex items-center gap-4 rounded-2xl bg-gray-50 p-4 app-dark:bg-[#0b0f14]">

                <div className="flex h-11 w-16 items-center justify-center rounded-lg bg-white text-sm font-bold shadow-sm app-dark:bg-[#11161d] app-dark:text-white">
                  —
                </div>

                <div>

                  <p className="font-semibold app-dark:text-white">
                    No payment method
                  </p>

                  <p className="mt-1 text-xs text-gray-400 app-dark:text-slate-500">
                    Add a card when starting your Flowex trial.
                  </p>

                </div>

              </div>
            )}

          </div>

          {/* FUTURE PLANS */}

          <div className="mt-6 rounded-[28px] border border-gray-200 bg-gradient-to-br from-white via-cyan-50/40 to-indigo-50/40 p-6 shadow-sm transition-colors duration-300 sm:p-8 app-dark:border-slate-800 app-dark:from-[#11161d] app-dark:via-[#101821] app-dark:to-[#14162a]">

            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">

              <div>

                <h2 className="text-xl font-bold app-dark:text-white">
                  More plans are coming.
                </h2>

                <p className="mt-2 text-sm text-gray-500 app-dark:text-slate-400">
                  Advanced automation and team features are on the way.
                </p>

              </div>

              <span className="rounded-full bg-gray-900 px-4 py-2 text-xs font-semibold text-white app-dark:bg-white app-dark:text-[#0b0f14]">
                Coming Soon
              </span>

            </div>

          </div>

        </div>

      </section>

      </main>
    </RouteGuard>
  );
}