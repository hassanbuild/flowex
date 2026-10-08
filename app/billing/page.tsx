"use client";

import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAppAccount } from "@/components/AppAccountProvider";
import RouteGuard from "@/components/RouteGuard";
import { FlowexAppShell } from "@/components/FlowexAppShell";

function BillingPageContent() {
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
      <main className="min-h-screen bg-background text-foreground transition-colors duration-300 app-dark:bg-surface app-dark:text-gray-100">
      <FlowexAppShell />

      {/* NAVBAR */}

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

      {/* CONTENT */}

      <section className="px-4 py-10 sm:px-6 lg:px-8">

        <div className="mx-auto max-w-4xl">

          <div>

            <p className="text-sm font-semibold text-brand-primary app-dark:text-brand-primary">
              BILLING
            </p>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl app-dark:text-gray-100">
              Plan & Billing
            </h1>

            <p className="mt-2 text-gray-500 app-dark:text-muted">
              Manage your Flowex subscription and payment details.
            </p>

          </div>

          {/* CURRENT PLAN */}

          <div className="mt-8 rounded-[28px] border border-border-subtle bg-white p-6 shadow-sm transition-colors duration-300 sm:p-8 app-dark:border-border-subtle app-dark:bg-surface">

            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">

              <div>

                <p className="text-sm font-semibold text-gray-500 app-dark:text-muted">
                  CURRENT PLAN
                </p>

                <h2 className="mt-2 text-2xl font-bold app-dark:text-gray-100">
                  {planName}
                </h2>

                <p className="mt-2 text-sm text-gray-500 app-dark:text-muted">
                  Everything you need to automate your lead capture.
                </p>

              </div>

              <div className="sm:text-right">

                {hasPremiumAccess ? (
                  <div className="flex items-end gap-2 sm:justify-end">

                    <span className="text-xl text-muted line-through app-dark:text-slate-500">
                      $15
                    </span>

                    <span className="text-4xl font-black app-dark:text-gray-100">
                      $10
                    </span>

                    <span className="pb-1 text-sm text-gray-500 app-dark:text-muted">
                      /month
                    </span>

                  </div>
                ) : (
                  <div className="flex items-end gap-2 sm:justify-end">

                    <span className="text-4xl font-black app-dark:text-gray-100">
                      $0
                    </span>

                    <span className="pb-1 text-sm text-gray-500 app-dark:text-muted">
                      /month
                    </span>

                  </div>
                )}

              </div>

            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-3">

              <div className="rounded-2xl bg-gray-50 p-4 app-dark:bg-surface">

                <p className="text-xs text-muted app-dark:text-slate-500">
                  Status
                </p>

                <p
                  className={`mt-2 font-semibold ${
                    plan === "free"
                      ? "text-gray-500 app-dark:text-muted"
                      : "text-brand-primary app-dark:text-brand-primary"
                  }`}
                >
                  {status}
                </p>

              </div>

              <div className="rounded-2xl bg-gray-50 p-4 app-dark:bg-surface">

                <p className="text-xs text-muted app-dark:text-slate-500">
                  Next Billing Date
                </p>

                <p className="mt-2 font-semibold app-dark:text-gray-100">
                  {nextBillingDate}
                </p>

              </div>

              <div className="rounded-2xl bg-gray-50 p-4 app-dark:bg-surface">

                <p className="text-xs text-muted app-dark:text-slate-500">
                  Billing Cycle
                </p>

                <p className="mt-2 font-semibold app-dark:text-gray-100">
                  {billingCycle}
                </p>

              </div>

            </div>

            {plan === "free" ? (
              <Link
                href={fromLeadCapture ? "/upgrade?from=lead-capture" : "/upgrade"}
                className="mt-7 inline-flex rounded-xl bg-brand-primary    px-6 py-3 text-sm font-semibold text-gray-100 shadow-sm transition hover:-translate-y-0.5"
              >
                Manage Subscription
              </Link>
            ) : (
              <button className="mt-7 rounded-xl bg-brand-primary    px-6 py-3 text-sm font-semibold text-gray-100 shadow-sm transition hover:-translate-y-0.5">
                Manage Subscription
              </button>
            )}

          </div>

          {/* PAYMENT METHOD */}

          <div className="mt-6 rounded-[28px] border border-border-subtle bg-white p-6 shadow-sm transition-colors duration-300 sm:p-8 app-dark:border-border-subtle app-dark:bg-surface">

            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">

              <div>

                <h2 className="text-xl font-bold app-dark:text-gray-100">
                  Payment Method
                </h2>

                <p className="mt-1 text-sm text-gray-500 app-dark:text-muted">
                  Card used for your Flowex subscription.
                </p>

              </div>

              <button className="rounded-xl border border-border-subtle bg-white px-4 py-2.5 text-sm font-semibold text-muted transition hover:bg-gray-50 app-dark:border-border-subtle app-dark:bg-surface app-dark:text-muted app-dark:hover:bg-surface">
                Update Card
              </button>

            </div>

            {hasPremiumAccess ? (
              <div className="mt-6 flex items-center gap-4 rounded-2xl bg-gray-50 p-4 app-dark:bg-surface">

                <div className="flex h-11 w-16 items-center justify-center rounded-lg bg-white text-sm font-bold shadow-sm app-dark:bg-surface app-dark:text-gray-100">
                  VISA
                </div>

                <div>

                  <p className="font-semibold app-dark:text-gray-100">
                    •••• •••• •••• 4242
                  </p>

                  <p className="mt-1 text-xs text-muted app-dark:text-slate-500">
                    Expires 08/29
                  </p>

                </div>

              </div>
            ) : (
              <div className="mt-6 flex items-center gap-4 rounded-2xl bg-gray-50 p-4 app-dark:bg-surface">

                <div className="flex h-11 w-16 items-center justify-center rounded-lg bg-white text-sm font-bold shadow-sm app-dark:bg-surface app-dark:text-gray-100">
                  —
                </div>

                <div>

                  <p className="font-semibold app-dark:text-gray-100">
                    No payment method
                  </p>

                  <p className="mt-1 text-xs text-muted app-dark:text-slate-500">
                    Add a card when starting your Flowex trial.
                  </p>

                </div>

              </div>
            )}

          </div>

          {/* FUTURE PLANS */}

          <div className="mt-6 rounded-[28px] border border-border-subtle bg-surface    p-6 shadow-sm transition-colors duration-300 sm:p-8 app-dark:border-border-subtle   ">

            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">

              <div>

                <h2 className="text-xl font-bold app-dark:text-gray-100">
                  More plans are coming.
                </h2>

                <p className="mt-2 text-sm text-gray-500 app-dark:text-muted">
                  Advanced automation and team features are on the way.
                </p>

              </div>

              <span className="rounded-full bg-brand-primary px-4 py-2 text-xs font-semibold text-gray-100 app-dark:bg-white app-dark:text-foreground">
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

export default function BillingPage() {
  return (
    <Suspense fallback={null}>
      <BillingPageContent />
    </Suspense>
  );
}
