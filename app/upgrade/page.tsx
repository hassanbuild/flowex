"use client";

import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAppAccount } from "@/components/AppAccountProvider";
import RouteGuard from "@/components/RouteGuard";

function UpgradePageContent() {
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

      <main className="min-h-screen bg-background text-foreground transition-colors duration-300 app-dark:bg-surface app-dark:text-gray-100">

        {/* ================= HEADER ================= */}

        <header className="border-b border-border-subtle/70 bg-white/90 backdrop-blur-xl transition-colors duration-300 app-dark:border-border-subtle/80 app-dark:bg-surface">

          <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-6 lg:px-8">

            <Link href={returnPath}>
              <Image
                src="/flowex-logo-brand.png"
                alt="Flowex"
                width={120}
                height={34}
                priority
              />
            </Link>

            <Link
              href={returnPath}
              className="rounded-xl border border-border-subtle bg-white px-4 py-2 text-sm font-semibold text-muted transition hover:bg-gray-50 app-dark:border-border-subtle app-dark:bg-surface app-dark:text-muted app-dark:hover:bg-surface"
            >
              Back
            </Link>

          </div>

        </header>

        {/* ================= UPGRADE ================= */}

        <section className="px-4 py-10 sm:px-6 lg:px-8">

          <div className="mx-auto max-w-5xl">

            <p className="text-sm font-semibold text-brand-primary app-dark:text-brand-primary">
              UPGRADE
            </p>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl app-dark:text-gray-100">
              Upgrade Your Plan
            </h1>

            <p className="mt-2 text-gray-500 app-dark:text-muted">
              More powerful Flowex plans are coming soon.
            </p>

            <div className="mt-8 grid gap-5 md:grid-cols-3">

              {/* ================= FLOWEX PLUS ================= */}

              <div className="rounded-[26px] border border-border-subtle bg-white/60 p-6 opacity-55 transition-colors duration-300 app-dark:border-border-subtle app-dark:bg-surface/70">

                <p className="text-sm font-semibold text-muted app-dark:text-slate-500">
                  COMING SOON
                </p>

                <h2 className="mt-3 text-xl font-bold app-dark:text-muted">
                  Flowex Plus
                </h2>

                <p className="mt-2 text-sm text-gray-500 app-dark:text-slate-500">
                  More workflows and team features.
                </p>

              </div>

              {/* ================= FLOWEX PRO ================= */}

              <div className="rounded-[28px] border-2 border-border-subtle bg-white p-7 shadow-sm transition-colors duration-300 app-dark:bg-surface ">

                <p className="text-sm font-semibold text-brand-primary app-dark:text-brand-primary">
                  {planStatus}
                </p>

                <h2 className="mt-3 text-2xl font-bold app-dark:text-gray-100">
                  Flowex Pro
                </h2>

                <div className="mt-5 flex items-end gap-2">

                  <span className="text-lg text-muted line-through app-dark:text-slate-500">
                    $15
                  </span>

                  <span className="text-5xl font-black app-dark:text-gray-100">
                    $10
                  </span>

                  <span className="pb-1 text-sm text-gray-500 app-dark:text-muted">
                    /month
                  </span>

                </div>

                <p className="mt-5 text-sm text-gray-500 app-dark:text-muted">
                  Your current launch plan.
                </p>

                {/* ================= PLAN ACTION ================= */}

                {plan === "free" ? (

                  <Link
                    href="/checkout"
                    className="mt-6 block w-full rounded-xl bg-brand-primary    py-3 text-center text-sm font-semibold text-gray-100 shadow-sm transition hover:-translate-y-0.5"
                  >
                    {buttonLabel}
                  </Link>

                ) : (

                  <button
                    type="button"
                    disabled
                    className="mt-6 w-full cursor-default rounded-xl bg-gray-100 py-3 text-sm font-semibold text-gray-500 app-dark:bg-surface app-dark:text-muted"
                  >
                    {buttonLabel}
                  </button>

                )}

              </div>

              {/* ================= ENTERPRISE ================= */}

              <div className="rounded-[26px] border border-border-subtle bg-white/60 p-6 opacity-55 transition-colors duration-300 app-dark:border-border-subtle app-dark:bg-surface/70">

                <p className="text-sm font-semibold text-muted app-dark:text-slate-500">
                  COMING SOON
                </p>

                <h2 className="mt-3 text-xl font-bold app-dark:text-muted">
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

export default function UpgradePage() {
  return (
    <Suspense fallback={null}>
      <UpgradePageContent />
    </Suspense>
  );
}