"use client";

import Image from "next/image";
import Link from "next/link";
import { useResourcesContext } from "../layout";

export default function AutomationGuidePage() {
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
            Automation Guide
          </div>

        </div>

        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
          Control how your automation{" "}
          <span className="bg-gradient-to-r from-[#00c297] to-[#4b52f7] bg-clip-text text-transparent">
            works.
          </span>
        </h1>

        <p
          className={`mt-5 max-w-2xl text-base leading-7 text-gray-500 ${
            isLoggedIn
              ? "app-dark:text-slate-400"
              : "dark:text-slate-400"
          }`}
        >
          Configure how Flowex responds to leads, notifies your team, follows up,
          and manages the state of your automation.
        </p>

        {/* AUTOMATION SETTINGS */}

        <div className="mt-12 space-y-5">

          {/* RESPONSE */}

          <div
            className={`rounded-3xl border border-gray-200 bg-white p-7 ${
              isLoggedIn
                ? "app-dark:border-slate-800 app-dark:bg-[#11161d]"
                : "dark:border-slate-800 dark:bg-[#11161d]"
            }`}
          >

            <div className="flex items-start gap-4">

              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-cyan-100 text-lg ${
                  isLoggedIn
                    ? "app-dark:from-[#00c297]/40 app-dark:to-[#4b52f7]/40"
                    : "dark:from-[#00c297]/40 dark:to-[#4b52f7]/40"
                }`}
              >
                💬
              </div>

              <div>

                <h2 className="text-xl font-bold">
                  Automatic Response
                </h2>

                <p
                  className={`mt-2 leading-7 text-gray-500 ${
                    isLoggedIn
                      ? "app-dark:text-slate-400"
                      : "dark:text-slate-400"
                  }`}
                >
                  Choose a pre-built response or create a personalized message
                  that Flowex can send automatically when a new lead enters your
                  workflow.
                </p>

              </div>

            </div>

          </div>

          {/* NOTIFICATION */}

          <div
            className={`rounded-3xl border border-gray-200 bg-white p-7 ${
              isLoggedIn
                ? "app-dark:border-slate-800 app-dark:bg-[#11161d]"
                : "dark:border-slate-800 dark:bg-[#11161d]"
            }`}
          >

            <div className="flex items-start gap-4">

              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-cyan-100 text-lg ${
                  isLoggedIn
                    ? "app-dark:from-[#00c297]/40 app-dark:to-[#4b52f7]/40"
                    : "dark:from-[#00c297]/40 dark:to-[#4b52f7]/40"
                }`}
              >
                ✉️
              </div>

              <div>

                <h2 className="text-xl font-bold">
                  Company Notification
                </h2>

                <p
                  className={`mt-2 leading-7 text-gray-500 ${
                    isLoggedIn
                      ? "app-dark:text-slate-400"
                      : "dark:text-slate-400"
                  }`}
                >
                  Set the business email that should receive a notification when
                  Flowex captures a new lead.
                </p>

              </div>

            </div>

          </div>

          {/* FOLLOW-UP */}

          <div
            className={`rounded-3xl border border-gray-200 bg-white p-7 ${
              isLoggedIn
                ? "app-dark:border-slate-800 app-dark:bg-[#11161d]"
                : "dark:border-slate-800 dark:bg-[#11161d]"
            }`}
          >

            <div className="flex items-start gap-4">

              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-cyan-100 text-lg ${
                  isLoggedIn
                    ? "app-dark:from-[#00c297]/40 app-dark:to-[#4b52f7]/40"
                    : "dark:from-[#00c297]/40 dark:to-[#4b52f7]/40"
                }`}
              >
                ↻
              </div>

              <div>

                <h2 className="text-xl font-bold">
                  Follow-Up
                </h2>

                <p
                  className={`mt-2 leading-7 text-gray-500 ${
                    isLoggedIn
                      ? "app-dark:text-slate-400"
                      : "dark:text-slate-400"
                  }`}
                >
                  Configure a follow-up so leads can receive another message after
                  the initial response instead of being forgotten.
                </p>

              </div>

            </div>

          </div>

        </div>

        {/* SAVE CHANGES */}

        <div
          className={`mt-12 rounded-3xl border border-gray-200 bg-white p-8 ${
            isLoggedIn
              ? "app-dark:border-slate-800 app-dark:bg-[#11161d]"
              : "dark:border-slate-800 dark:bg-[#11161d]"
          }`}
        >

          <h2 className="text-xl font-bold">
            Save your changes
          </h2>

          <p
            className={`mt-3 leading-7 text-gray-500 ${
              isLoggedIn
                ? "app-dark:text-slate-400"
                : "dark:text-slate-400"
            }`}
          >
            When you update your automation settings, use Save Changes to keep
            the current configuration.
          </p>

          <div className="mt-5 inline-flex rounded-xl bg-gradient-to-r from-[#00c297] to-[#4b52f7] px-5 py-2.5 text-sm font-bold text-white">
            Save Changes
          </div>

        </div>

        {/* PAUSE / RESUME */}

        <div
          className={`mt-6 rounded-3xl border border-gray-200 bg-white p-8 ${
            isLoggedIn
              ? "app-dark:border-slate-800 app-dark:bg-[#11161d]"
              : "dark:border-slate-800 dark:bg-[#11161d]"
          }`}
        >

          <h2 className="text-xl font-bold">
            Pause or resume automation
          </h2>

          <p
            className={`mt-3 leading-7 text-gray-500 ${
              isLoggedIn
                ? "app-dark:text-slate-400"
                : "dark:text-slate-400"
            }`}
          >
            You can temporarily stop the automation without deleting your setup.
            Resume it when you want Flowex to start processing leads again.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">

            <div className="inline-flex rounded-full bg-gradient-to-r from-[#00c297] to-[#4b52f7] p-[1px]">

              <span
                className={`rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-700 ${
                  isLoggedIn
                    ? "app-dark:bg-[#0b0f14] app-dark:text-white"
                    : "dark:bg-[#0b0f14] dark:text-white"
                }`}
              >
                ● Active
              </span>

            </div>

            <div
              className={`inline-flex rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-500 ${
                isLoggedIn
                  ? "app-dark:border-slate-700 app-dark:text-slate-300"
                  : "dark:border-slate-700 dark:text-slate-300"
              }`}
            >
              Paused
            </div>

          </div>

        </div>

        {/* SIMPLE WORKFLOW */}

        <div
          className={`mt-12 rounded-3xl border border-gray-200 bg-white p-8 ${
            isLoggedIn
              ? "app-dark:border-slate-800 app-dark:bg-[#11161d]"
              : "dark:border-slate-800 dark:bg-[#11161d]"
          }`}
        >

          <h2 className="text-xl font-bold">
            Keep the workflow simple
          </h2>

          <p
            className={`mt-3 leading-7 text-gray-500 ${
              isLoggedIn
                ? "app-dark:text-slate-400"
                : "dark:text-slate-400"
            }`}
          >
            Flowex is designed so you can manage the important parts of your
            automation without dealing with a complicated automation builder.
          </p>

          <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">

            <div
              className={`rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold ${
                isLoggedIn
                  ? "app-dark:border-slate-700"
                  : "dark:border-slate-700"
              }`}
            >
              Capture
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
              Respond
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
              Notify
            </div>

            <span className="rotate-90 text-gray-400 sm:rotate-0">
              →
            </span>

            <div className="rounded-xl bg-gradient-to-r from-[#00c297] to-[#4b52f7] px-4 py-3 text-sm font-bold text-white">
              Follow Up
            </div>

          </div>

        </div>

        {/* BACK TO RESOURCES */}

        <div className="mt-12">

          <Link
            href="/resources"
            className="inline-flex rounded-xl bg-gradient-to-r from-[#00c297] to-[#4b52f7] px-5 py-2.5 text-sm font-bold text-white"
          >
            Back to Resources
          </Link>

        </div>

      </section>

    </main>
  );
}