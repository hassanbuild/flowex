"use client";

import Image from "next/image";
import Link from "next/link";
import { useResourcesContext } from "../layout";

const integrations = [
  {
    icon: "📊",
    name: "Google Sheets",
    description:
      "Send captured lead information directly to a connected Google Sheet for simple organization and tracking.",
    use: "Lead storage",
  },
  {
    icon: "🗂️",
    name: "Airtable",
    description:
      "Store and organize incoming leads inside your Airtable workflow.",
    use: "Lead storage",
  },
  {
    icon: "💬",
    name: "Slack",
    description:
      "Send new lead information to your selected Slack destination so your team can stay informed.",
    use: "Team workflow",
  },
  {
    icon: "✉️",
    name: "Business Email",
    description:
      "Notify your company by email whenever a new lead enters your Flowex automation.",
    use: "Notifications",
  },
];

export default function IntegrationsGuidePage() {
  const { isLoggedIn } = useResourcesContext();

  return (
    <main
      className={`min-h-screen bg-[#fbfcfd] text-gray-900 transition-colors duration-300 ${
        isLoggedIn
          ? "app-dark:bg-[#0b0f14] app-dark:text-slate-100"
          : "dark:bg-[#0b0f14] dark:text-slate-100"
      }`}
    >

      {/* NAVBAR */}

      <nav
        className={`border-b border-gray-200/70 bg-white/85 backdrop-blur-xl ${
          isLoggedIn
            ? "app-dark:border-slate-800/80 app-dark:bg-[linear-gradient(90deg,#0b0f14_0%,#172033_8%,#252b70_25%,#006454_50%,#252b70_75%,#172033_92%,#0b0f14_100%)]"
            : "dark:border-slate-800/80 dark:bg-[linear-gradient(90deg,#0b0f14_0%,#172033_8%,#252b70_25%,#006454_50%,#252b70_75%,#172033_92%,#0b0f14_100%)]"
        }`}
      >
        <div className="mx-auto flex h-[55px] max-w-7xl items-center justify-between px-6">

          <Link href="/">
            <Image
              src="/flowex-logo.png"
              alt="Flowex"
              width={115}
              height={32}
              priority
            />
          </Link>

          <Link
            href="/resources"
            className={`text-sm font-semibold text-gray-500 transition-colors hover:text-gray-900 ${
              isLoggedIn
                ? "app-dark:text-slate-200 app-dark:hover:text-white"
                : "dark:text-slate-200 dark:hover:text-white"
            }`}
          >
            ← Resources
          </Link>

        </div>
      </nav>

      {/* CONTENT */}

      <section className="mx-auto max-w-4xl px-6 py-20">

        <div className="mb-6 inline-flex rounded-full bg-gradient-to-r from-[#00c297] to-[#4b52f7] p-[1px]">

          <div
            className={`rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-gray-700 ${
              isLoggedIn
                ? "app-dark:bg-[#0b0f14] app-dark:text-white"
                : "dark:bg-[#0b0f14] dark:text-white"
            }`}
          >
            Integrations Guide
          </div>

        </div>

        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
          Connect Flowex with the tools{" "}
          <span className="bg-gradient-to-r from-[#00c297] to-[#4b52f7] bg-clip-text text-transparent">
            you already use.
          </span>
        </h1>

        <p
          className={`mt-5 max-w-2xl text-base leading-7 text-gray-500 ${
            isLoggedIn
              ? "app-dark:text-slate-400"
              : "dark:text-slate-400"
          }`}
        >
          Choose where your captured leads are stored and how your team is
          notified when a new opportunity enters your workflow.
        </p>

        {/* INTEGRATIONS */}

        <div className="mt-12 grid gap-5 sm:grid-cols-2">

          {integrations.map((integration) => (
            <div
              key={integration.name}
              className={`rounded-3xl border border-gray-200 bg-white p-7 ${
                isLoggedIn
                  ? "app-dark:border-slate-800 app-dark:bg-[#11161d]"
                  : "dark:border-slate-800 dark:bg-[#11161d]"
              }`}
            >

              <div className="flex items-start justify-between gap-4">

                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-cyan-100 text-lg ${
                    isLoggedIn
                      ? "app-dark:from-[#00c297]/40 app-dark:to-[#4b52f7]/40"
                      : "dark:from-[#00c297]/40 dark:to-[#4b52f7]/40"
                  }`}
                >
                  {integration.icon}
                </div>

                <span
                  className={`rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500 ${
                    isLoggedIn
                      ? "app-dark:bg-gradient-to-r app-dark:from-[#00c297] app-dark:to-[#4b52f7] app-dark:p-[1px]"
                      : "dark:bg-gradient-to-r dark:from-[#00c297] dark:to-[#4b52f7] dark:p-[1px]"
                  }`}
                >
                  <span
                    className={`block rounded-full ${
                      isLoggedIn
                        ? "app-dark:bg-[#0b0f14] app-dark:px-[11px] app-dark:py-[3px] app-dark:text-white"
                        : "dark:bg-[#0b0f14] dark:px-[11px] dark:py-[3px] dark:text-white"
                    }`}
                  >
                    {integration.use}
                  </span>
                </span>

              </div>

              <h2 className="mt-5 text-xl font-bold">
                {integration.name}
              </h2>

              <p
                className={`mt-2 text-sm leading-6 text-gray-500 ${
                  isLoggedIn
                    ? "app-dark:text-slate-400"
                    : "dark:text-slate-400"
                }`}
              >
                {integration.description}
              </p>

            </div>
          ))}

        </div>

        {/* HOW IT FITS */}

        <div
          className={`mt-12 rounded-3xl border border-gray-200 bg-white p-8 ${
            isLoggedIn
              ? "app-dark:border-slate-800 app-dark:bg-[#11161d]"
              : "dark:border-slate-800 dark:bg-[#11161d]"
          }`}
        >

          <h2 className="text-xl font-bold">
            Where integrations fit into your automation
          </h2>

          <p
            className={`mt-3 leading-7 text-gray-500 ${
              isLoggedIn
                ? "app-dark:text-slate-400"
                : "dark:text-slate-400"
            }`}
          >
            After Flowex captures a lead, your connected tools determine where
            that information goes and how your team is notified.
          </p>

          <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">

            <div
              className={`rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold ${
                isLoggedIn
                  ? "app-dark:border-slate-700"
                  : "dark:border-slate-700"
              }`}
            >
              Lead captured
            </div>

            <span className="rotate-90 text-gray-400 sm:rotate-0">
              →
            </span>

            <div
              className={`rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold ${
                isLoggedIn
                  ? "app-dark:border-slate-700"
                  : "dark:border-slate-700"
              }`}
            >
              Flowex
            </div>

            <span className="rotate-90 text-gray-400 sm:rotate-0">
              →
            </span>

            <div className="rounded-xl bg-gradient-to-r from-[#00c297] to-[#4b52f7] px-4 py-3 text-sm font-bold text-white">
              Connected tool
            </div>

          </div>

        </div>

        {/* NOTE */}

        <div
          className={`mt-6 rounded-3xl border border-gray-200 bg-white p-8 ${
            isLoggedIn
              ? "app-dark:border-slate-800 app-dark:bg-[#11161d]"
              : "dark:border-slate-800 dark:bg-[#11161d]"
          }`}
        >

          <h2 className="text-xl font-bold">
            More connections as Flowex grows
          </h2>

          <p
            className={`mt-3 leading-7 text-gray-500 ${
              isLoggedIn
                ? "app-dark:text-slate-400"
                : "dark:text-slate-400"
            }`}
          >
            Flowex is being built around a simple idea: connect the tools your
            business needs without turning automation setup into a complicated
            process.
          </p>

        </div>

        {/* NEXT */}

        <div
          className={`mt-12 rounded-3xl border border-gray-200 bg-white p-8 ${
            isLoggedIn
              ? "app-dark:border-slate-800 app-dark:bg-[#11161d]"
              : "dark:border-slate-800 dark:bg-[#11161d]"
          }`}
        >

          <h2 className="text-xl font-bold">
            Next: Automation
          </h2>

          <p
            className={`mt-2 text-sm leading-6 text-gray-500 ${
              isLoggedIn
                ? "app-dark:text-slate-400"
                : "dark:text-slate-400"
            }`}
          >
            Learn how automatic responses, notifications, follow-ups, and
            automation controls work together.
          </p>

          <Link
            href="/resources/automation"
            className="mt-5 inline-flex rounded-xl bg-gradient-to-r from-[#00c297] to-[#4b52f7] px-5 py-2.5 text-sm font-bold text-white"
          >
            Open Automation Guide
          </Link>

        </div>

      </section>

    </main>
  );
}