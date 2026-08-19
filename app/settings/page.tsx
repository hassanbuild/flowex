"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAppAccount } from "@/components/AppAccountProvider";
import { useAppTheme } from "@/components/AppThemeProvider";
import RouteGuard from "@/components/RouteGuard";

function SettingsPageContent() {
  const searchParams = useSearchParams();

  const { plan } = useAppAccount();
  const { theme, setTheme } = useAppTheme();

  const [promotionalEmails, setPromotionalEmails] = useState(true);
  const [productUpdates, setProductUpdates] = useState(true);

  const [leadNotifications, setLeadNotifications] = useState(true);
  const [automationAlerts, setAutomationAlerts] = useState(true);
  const [billingEmails, setBillingEmails] = useState(true);

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


  useEffect(() => {
    const saved = localStorage.getItem("flowex-settings");

    if (!saved) return;

    try {
      const data = JSON.parse(saved);

      setPromotionalEmails(
        data.promotionalEmails ?? true
      );

      setProductUpdates(
        data.productUpdates ?? true
      );

      setLeadNotifications(
        data.leadNotifications ?? true
      );

      setAutomationAlerts(
        data.automationAlerts ?? true
      );

      setBillingEmails(
        data.billingEmails ?? true
      );
    } catch {
      // Keep default preferences.
    }
  }, []);

  const saveSettings = () => {
    localStorage.setItem(
      "flowex-settings",
      JSON.stringify({
        promotionalEmails,
        productUpdates,
        leadNotifications,
        automationAlerts,
        billingEmails,
      })
    );

    alert("Settings saved!");
  };


  return (
    <RouteGuard access="signed-in">
      <main className="min-h-screen bg-[#f8fafc] text-gray-900 transition-colors duration-300 app-dark:bg-[#0b0f14] app-dark:text-slate-100">

      {/* ================= NAVBAR ================= */}

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

      {/* ================= CONTENT ================= */}

      <section className="px-4 py-10 sm:px-6 lg:px-8">

        <div className="mx-auto max-w-3xl">

          <p className="text-sm font-semibold text-emerald-600 app-dark:text-emerald-400">
            SETTINGS
          </p>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl app-dark:text-white">
            Preferences
          </h1>

          <p className="mt-2 text-gray-500 app-dark:text-slate-400">
            Control how Flowex communicates with you.
          </p>

          {/* ================= GENERAL ================= */}

          <div className="mt-8 rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm transition-colors duration-300 sm:p-8 app-dark:border-slate-800 app-dark:bg-[#11161d]">

            <div className="mb-2">

              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400 app-dark:text-slate-500">
                General
              </p>

            </div>

            {/* THEME */}

            <div className="flex items-center justify-between gap-6 border-b border-gray-100 py-6 first:pt-3 app-dark:border-slate-800">

              <div>

                <h2 className="font-bold app-dark:text-white">
                  Theme
                </h2>

                <p className="mt-1 text-sm text-gray-500 app-dark:text-slate-400">
                  Choose how Flowex appears across your account.
                </p>

              </div>

              <div className="flex rounded-xl border border-gray-200 bg-gray-50 p-1 app-dark:border-slate-700 app-dark:bg-[#0b0f14]">

                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  aria-label="Use light theme"
                  className={`flex h-9 w-10 items-center justify-center rounded-lg text-lg transition ${
                    theme === "light"
                      ? "bg-white text-gray-900 shadow-sm app-dark:bg-slate-700 app-dark:text-white"
                      : "text-gray-400 hover:text-gray-700 app-dark:text-slate-500 app-dark:hover:text-slate-300"
                  }`}
                >
                  ☀
                </button>

                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  aria-label="Use dark theme"
                  className={`flex h-9 w-10 items-center justify-center rounded-lg text-lg transition ${
                    theme === "dark"
                      ? "bg-white text-gray-900 shadow-sm app-dark:bg-slate-700 app-dark:text-white"
                      : "text-gray-400 hover:text-gray-700 app-dark:text-slate-500 app-dark:hover:text-slate-300"
                  }`}
                >
                  ☾
                </button>

              </div>

            </div>

            <SettingRow
              title="Promotional Emails"
              description="Receive Flowex offers, promotions and special announcements."
              enabled={promotionalEmails}
              onClick={() =>
                setPromotionalEmails(!promotionalEmails)
              }
            />

            <SettingRow
              title="Product Updates"
              description="Receive updates about new Flowex features and product releases."
              enabled={productUpdates}
              onClick={() =>
                setProductUpdates(!productUpdates)
              }
            />

          </div>

          {/* ================= PRO PREFERENCES ================= */}

          <div className="relative mt-6 overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm transition-colors duration-300 app-dark:border-slate-800 app-dark:bg-[#11161d]">

            <div
              className={`p-6 sm:p-8 ${
                !hasPremiumAccess
                  ? "pointer-events-none select-none blur-[2px]"
                  : ""
              }`}
            >

              <div className="mb-2">

                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400 app-dark:text-slate-500">
                  Pro Preferences
                </p>

              </div>

              <SettingRow
                title="Lead Notifications"
                description="Get notified when a new lead is captured."
                enabled={leadNotifications}
                onClick={() =>
                  setLeadNotifications(!leadNotifications)
                }
              />

              <SettingRow
                title="Automation Alerts"
                description="Receive alerts if an automation is paused or needs attention."
                enabled={automationAlerts}
                onClick={() =>
                  setAutomationAlerts(!automationAlerts)
                }
              />

              <SettingRow
                title="Billing Emails"
                description="Receive subscription and payment notifications."
                enabled={billingEmails}
                onClick={() =>
                  setBillingEmails(!billingEmails)
                }
              />

            </div>

            {!hasPremiumAccess && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/55 px-6 text-center backdrop-blur-[2px] app-dark:bg-[#0b0f14]/65">

                <div className="max-w-sm rounded-2xl border border-gray-200 bg-white/95 p-6 shadow-xl app-dark:border-slate-700 app-dark:bg-[#11161d]/95">

                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 text-lg text-white">
                    ✦
                  </div>

                  <h3 className="mt-4 text-lg font-bold app-dark:text-white">
                    Pro Preferences
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-gray-500 app-dark:text-slate-400">
                    Upgrade your Flowex plan to manage lead, automation and billing preferences.
                  </p>

                  <Link
                    href={
                      fromLeadCapture
                        ? "/upgrade?from=lead-capture"
                        : "/upgrade"
                    }
                    className="mt-5 inline-flex rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5"
                  >
                    Upgrade Plan
                  </Link>

                </div>

              </div>
            )}

          </div>

          {/* ================= SAVE ================= */}

          <div className="mt-6 flex justify-end">

            <button
              type="button"
              onClick={saveSettings}
              className="rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5"
            >
              Save Preferences
            </button>

          </div>

        </div>

      </section>

      </main>
    </RouteGuard>
  );
}


export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsPageContent />
    </Suspense>
  );
}


function SettingRow({
  title,
  description,
  enabled,
  onClick,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-gray-100 py-6 last:border-b-0 app-dark:border-slate-800">

      <div>

        <h2 className="font-bold app-dark:text-white">
          {title}
        </h2>

        <p className="mt-1 text-sm text-gray-500 app-dark:text-slate-400">
          {description}
        </p>

      </div>

      <button
        type="button"
        onClick={onClick}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          enabled
            ? "bg-emerald-500"
            : "bg-gray-300 app-dark:bg-slate-600"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
            enabled
              ? "left-6"
              : "left-1"
          }`}
        />
      </button>

    </div>
  );
}