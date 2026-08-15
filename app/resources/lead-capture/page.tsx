"use client";

import Image from "next/image";
import Link from "next/link";
import { useResourcesContext } from "../layout";

export default function LeadCaptureGuidePage() {
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
            Lead Capture Guide
          </div>

        </div>

        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
          How Flowex Lead Capture works.
        </h1>

        <p
          className={`mt-5 max-w-2xl text-base leading-7 text-gray-500 ${
            isLoggedIn
              ? "app-dark:text-slate-400"
              : "dark:text-slate-400"
          }`}
        >
          Flowex moves every new lead through a simple automated workflow so your team can respond faster and stay organized.
        </p>

        {/* FLOW */}

        <div className="mt-12 space-y-4">

          {[
            {
              number: "01",
              title: "Lead Source",
              description:
                "Start with a Flowex form or connect a valid website or form source so new leads can enter your workflow.",
            },
            {
              number: "02",
              title: "Store the Lead",
              description:
                "Send captured lead information to your chosen destination, such as Google Sheets, Airtable, or Slack.",
            },
            {
              number: "03",
              title: "Automatic Response",
              description:
                "Send a pre-built reply or create a personalized message that is automatically sent to the lead.",
            },
            {
              number: "04",
              title: "Company Notification",
              description:
                "Notify your business by email when a new lead enters the workflow.",
            },
            {
              number: "05",
              title: "Follow-Up",
              description:
                "Set up a follow-up so leads are not forgotten after the initial response.",
            },
          ].map((step, index, steps) => (
            <div key={step.number} className="relative">

              <div
                className={`rounded-3xl border border-gray-200 bg-white p-7 ${
                  isLoggedIn
                    ? "app-dark:border-slate-800 app-dark:bg-[#11161d]"
                    : "dark:border-slate-800 dark:bg-[#11161d]"
                }`}
              >
                <div className="flex items-start gap-4">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-[#00c297] to-[#4b52f7] text-sm font-bold text-white">
                    {step.number}
                  </div>

                  <div>

                    <h2 className="text-xl font-bold">
                      {step.title}
                    </h2>

                    <p
                      className={`mt-2 leading-7 text-gray-500 ${
                        isLoggedIn
                          ? "app-dark:text-slate-400"
                          : "dark:text-slate-400"
                      }`}
                    >
                      {step.description}
                    </p>

                  </div>

                </div>
              </div>

              {index < steps.length - 1 && (
                <div className="mx-auto h-8 w-px bg-gradient-to-b from-[#00c297] to-[#4b52f7]" />
              )}

            </div>
          ))}

        </div>

        {/* AUTOMATION CONTROL */}

        <div
          className={`mt-12 rounded-3xl border border-gray-200 bg-white p-8 ${
            isLoggedIn
              ? "app-dark:border-slate-800 app-dark:bg-[#11161d]"
              : "dark:border-slate-800 dark:bg-[#11161d]"
          }`}
        >

          <h2 className="text-xl font-bold">
            Pause or resume your automation
          </h2>

          <p
            className={`mt-3 leading-7 text-gray-500 ${
              isLoggedIn
                ? "app-dark:text-slate-400"
                : "dark:text-slate-400"
            }`}
          >
            You can stop your Lead Capture automation whenever needed and resume it again when you're ready.
          </p>

          <div className="mt-5 inline-flex rounded-full bg-gradient-to-r from-[#00c297] to-[#4b52f7] p-[1px]">

            <span
              className={`rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-700 ${
                isLoggedIn
                  ? "app-dark:bg-[#0b0f14] app-dark:text-white"
                  : "dark:bg-[#0b0f14] dark:text-white"
              }`}
            >
              ● Automation Active
            </span>

          </div>

        </div>

        {/* LEADS */}

        <div
          className={`mt-6 rounded-3xl border border-gray-200 bg-white p-8 ${
            isLoggedIn
              ? "app-dark:border-slate-800 app-dark:bg-[#11161d]"
              : "dark:border-slate-800 dark:bg-[#11161d]"
          }`}
        >

          <h2 className="text-xl font-bold">
            Track lead status
          </h2>

          <p
            className={`mt-3 leading-7 text-gray-500 ${
              isLoggedIn
                ? "app-dark:text-slate-400"
                : "dark:text-slate-400"
            }`}
          >
            Your Leads page keeps the workflow simple by showing the status of captured leads without adding unnecessary complexity.
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
            Next: Integrations
          </h2>

          <p
            className={`mt-2 text-sm leading-6 text-gray-500 ${
              isLoggedIn
                ? "app-dark:text-slate-400"
                : "dark:text-slate-400"
            }`}
          >
            Learn how Flowex connects with the tools used to store leads and notify your team.
          </p>

          <Link
            href="/resources/integrations"
            className="mt-5 inline-flex rounded-xl bg-gradient-to-r from-[#00c297] to-[#4b52f7] px-5 py-2.5 text-sm font-bold text-white"
          >
            Open Integrations Guide
          </Link>

        </div>

      </section>

    </main>
  );
}