"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAppAccount } from "@/components/AppAccountProvider";
import RouteGuard from "@/components/RouteGuard";

export default function UpgradePage() {
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

  const planStatus =
    plan === "trial"
      ? "TRIAL PLAN"
      : plan === "pro"
        ? "CURRENT PLAN"
        : "AVAILABLE PLAN";

  const buttonLabel =
    plan === "trial"
      ? "7-Day Trial Active"
      : plan === "pro"
        ? "Current Plan"
        : "Start 7-Day Free Trial";

  return (
    <RouteGuard access="signed-in">

      <main className="min-h-screen bg-[#f8fafc] text-gray-900 transition-colors duration-300 app-dark:bg-[#0b0f14] app-dark:text-slate-100">

        {/* ================= HEADER ================= */}

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

        {/* ================= UPGRADE ================= */}

        <section className="px-4 py-10 sm:px-6 lg:px-8">

          <div className="mx-auto max-w-5xl">

            <p className="text-sm font-semibold text-emerald-600 app-dark:text-emerald-400">
              UPGRADE
            </p>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl app-dark:text-white">
              Upgrade Your Plan
            </h1>

            <p className="mt-2 text-gray-500 app-dark:text-slate-400">
              More powerful Flowex plans are coming soon.
            </p>

            <div className="mt-8 grid gap-5 md:grid-cols-3">

              {/* ================= FLOWEX PLUS ================= */}

              <div className="rounded-[26px] border border-gray-200 bg-white/60 p-6 opacity-55 transition-colors duration-300 app-dark:border-slate-800 app-dark:bg-[#11161d]/70">

                <p className="text-sm font-semibold text-gray-400 app-dark:text-slate-500">
                  COMING SOON
                </p>

                <h2 className="mt-3 text-xl font-bold app-dark:text-slate-300">
                  Flowex Plus
                </h2>

                <p className="mt-2 text-sm text-gray-500 app-dark:text-slate-500">
                  More workflows and team features.
                </p>

              </div>

              {/* ================= FLOWEX PRO ================= */}

              <div className="rounded-[28px] border-2 border-emerald-400 bg-white p-7 shadow-xl transition-colors duration-300 app-dark:bg-[#11161d] app-dark:shadow-[0_20px_60px_rgba(0,0,0,0.35)]">

                <p className="text-sm font-semibold text-emerald-600 app-dark:text-emerald-400">
                  {planStatus}
                </p>

                <h2 className="mt-3 text-2xl font-bold app-dark:text-white">
                  Flowex Pro
                </h2>

                <div className="mt-5 flex items-end gap-2">

                  <span className="text-lg text-gray-400 line-through app-dark:text-slate-500">
                    $15
                  </span>

                  <span className="text-5xl font-black app-dark:text-white">
                    $10
                  </span>

                  <span className="pb-1 text-sm text-gray-500 app-dark:text-slate-400">
                    /month
                  </span>

                </div>

                <p className="mt-5 text-sm text-gray-500 app-dark:text-slate-400">
                  Your current launch plan.
                </p>

                {/* ================= PLAN ACTION ================= */}

                {plan === "free" ? (

                  <Link
                    href="/checkout"
                    className="mt-6 block w-full rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 py-3 text-center text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5"
                  >
                    {buttonLabel}
                  </Link>

                ) : (

                  <button
                    type="button"
                    disabled
                    className="mt-6 w-full cursor-default rounded-xl bg-gray-100 py-3 text-sm font-semibold text-gray-500 app-dark:bg-slate-800 app-dark:text-slate-400"
                  >
                    {buttonLabel}
                  </button>

                )}

              </div>

              {/* ================= ENTERPRISE ================= */}

              <div className="rounded-[26px] border border-gray-200 bg-white/60 p-6 opacity-55 transition-colors duration-300 app-dark:border-slate-800 app-dark:bg-[#11161d]/70">

                <p className="text-sm font-semibold text-gray-400 app-dark:text-slate-500">
                  COMING SOON
                </p>

                <h2 className="mt-3 text-xl font-bold app-dark:text-slate-300">
                  Flowex Enterprise
                </h2>

                <p className="mt-2 text-sm text-gray-500 app-dark:text-slate-500">
                  Advanced automation for larger teams.
                </p>

              </div>

            </div>

          </div>

        </section>

      </main>

    </RouteGuard>
  );
}