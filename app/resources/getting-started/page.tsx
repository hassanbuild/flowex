"use client";

import Image from "next/image";
import Link from "next/link";
import { useResourcesContext } from "../layout";

export default function GettingStartedPage() {
  const { isLoggedIn } = useResourcesContext();

  return (
    <main
      className={`min-h-screen bg-background text-foreground transition-colors duration-300 ${
        isLoggedIn
          ? "app-dark:bg-surface app-dark:text-gray-100"
          : "app-dark:bg-surface app-dark:text-gray-100"
      }`}
    >

      {/* NAVBAR */}

      <nav
        className={`border-b border-border-subtle/70 bg-white/85 backdrop-blur-xl ${
          isLoggedIn
            ? "app-dark:border-border-subtle/80 app-dark:bg-surface"
            : "app-dark:border-border-subtle/80 app-dark:bg-surface"
        }`}
      >

        <div className="mx-auto flex h-[55px] max-w-7xl items-center justify-between px-6">

          <Link href="/">
            <Image
              src="/flowex-logo-brand.png"
              alt="Flowex"
              width={115}
              height={32}
              priority
            />
          </Link>

          <Link
            href="/resources"
            className={`text-sm font-semibold text-gray-500 transition-colors hover:text-foreground ${
              isLoggedIn
                ? "app-dark:text-gray-100 app-dark:hover:text-gray-100"
                : "app-dark:text-gray-100 app-dark:hover:text-gray-100"
            }`}
          >
            ← Resources
          </Link>

        </div>

      </nav>

      {/* CONTENT */}

      <section className="mx-auto max-w-4xl px-6 py-20">

        <div className="mb-6 inline-flex rounded-full bg-surface   p-[1px]">

          <div
            className={`rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-gray-700 ${
              isLoggedIn
                ? "app-dark:bg-surface app-dark:text-gray-100"
                : "app-dark:bg-surface app-dark:text-gray-100"
            }`}
          >
            Getting Started
          </div>

        </div>

        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
          Set up Flowex in a few simple steps.
        </h1>

        <p
          className={`mt-5 max-w-2xl text-base leading-7 text-gray-500 ${
            isLoggedIn
              ? "app-dark:text-muted"
              : "app-dark:text-muted"
          }`}
        >
          This guide walks you through the basic setup so you can start capturing
          leads and running your automation.
        </p>

        <div className="mt-12 space-y-6">

          {/* STEP 1 */}

          <div
            className={`rounded-3xl border border-border-subtle bg-white p-7 ${
              isLoggedIn
                ? "app-dark:border-border-subtle app-dark:bg-surface"
                : "app-dark:border-border-subtle app-dark:bg-surface"
            }`}
          >

            <div className="flex items-start gap-4">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-primary   font-bold text-gray-100">
                1
              </div>

              <div>

                <h2 className="text-xl font-bold">
                  Create your Flowex account
                </h2>

                <p
                  className={`mt-2 leading-7 text-gray-500 ${
                    isLoggedIn
                      ? "app-dark:text-muted"
                      : "app-dark:text-muted"
                  }`}
                >
                  Sign up for Flowex and complete your basic account details.
                </p>

                <Link
                  href="/signup"
                  className={`mt-4 inline-flex text-sm font-semibold text-brand-primary ${
                    isLoggedIn
                      ? "app-dark:text-brand-primary"
                      : "app-dark:text-brand-primary"
                  }`}
                >
                  Create account →
                </Link>

              </div>

            </div>

          </div>

          {/* STEP 2 */}

          <div
            className={`rounded-3xl border border-border-subtle bg-white p-7 ${
              isLoggedIn
                ? "app-dark:border-border-subtle app-dark:bg-surface"
                : "app-dark:border-border-subtle app-dark:bg-surface"
            }`}
          >

            <div className="flex items-start gap-4">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-primary   font-bold text-gray-100">
                2
              </div>

              <div>

                <h2 className="text-xl font-bold">
                  Open Lead Capture
                </h2>

                <p
                  className={`mt-2 leading-7 text-gray-500 ${
                    isLoggedIn
                      ? "app-dark:text-muted"
                      : "app-dark:text-muted"
                  }`}
                >
                  From your dashboard, open the Lead Capture automation to manage
                  how leads enter and move through your workflow.
                </p>

              </div>

            </div>

          </div>

          {/* STEP 3 */}

          <div
            className={`rounded-3xl border border-border-subtle bg-white p-7 ${
              isLoggedIn
                ? "app-dark:border-border-subtle app-dark:bg-surface"
                : "app-dark:border-border-subtle app-dark:bg-surface"
            }`}
          >

            <div className="flex items-start gap-4">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-primary   font-bold text-gray-100">
                3
              </div>

              <div>

                <h2 className="text-xl font-bold">
                  Connect your lead source
                </h2>

                <p
                  className={`mt-2 leading-7 text-gray-500 ${
                    isLoggedIn
                      ? "app-dark:text-muted"
                      : "app-dark:text-muted"
                  }`}
                >
                  Use a Flowex form or connect a valid website or form source so
                  new leads can enter your automation.
                </p>

              </div>

            </div>

          </div>

          {/* STEP 4 */}

          <div
            className={`rounded-3xl border border-border-subtle bg-white p-7 ${
              isLoggedIn
                ? "app-dark:border-border-subtle app-dark:bg-surface"
                : "app-dark:border-border-subtle app-dark:bg-surface"
            }`}
          >

            <div className="flex items-start gap-4">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-primary   font-bold text-gray-100">
                4
              </div>

              <div>

                <h2 className="text-xl font-bold">
                  Choose where leads are stored
                </h2>

                <p
                  className={`mt-2 leading-7 text-gray-500 ${
                    isLoggedIn
                      ? "app-dark:text-muted"
                      : "app-dark:text-muted"
                  }`}
                >
                  Connect the destination you want Flowex to use for your leads,
                  such as Google Sheets, Airtable, or Slack.
                </p>

              </div>

            </div>

          </div>

          {/* STEP 5 */}

          <div
            className={`rounded-3xl border border-border-subtle bg-white p-7 ${
              isLoggedIn
                ? "app-dark:border-border-subtle app-dark:bg-surface"
                : "app-dark:border-border-subtle app-dark:bg-surface"
            }`}
          >

            <div className="flex items-start gap-4">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-primary   font-bold text-gray-100">
                5
              </div>

              <div>

                <h2 className="text-xl font-bold">
                  Configure your automation
                </h2>

                <p
                  className={`mt-2 leading-7 text-gray-500 ${
                    isLoggedIn
                      ? "app-dark:text-muted"
                      : "app-dark:text-muted"
                  }`}
                >
                  Set your automatic response, company notification, and follow-up
                  preferences.
                </p>

              </div>

            </div>

          </div>

          {/* STEP 6 */}

          <div
            className={`rounded-3xl border border-border-subtle bg-white p-7 ${
              isLoggedIn
                ? "app-dark:border-border-subtle app-dark:bg-surface"
                : "app-dark:border-border-subtle app-dark:bg-surface"
            }`}
          >

            <div className="flex items-start gap-4">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-primary   font-bold text-gray-100">
                6
              </div>

              <div>

                <h2 className="text-xl font-bold">
                  Save and activate
                </h2>

                <p
                  className={`mt-2 leading-7 text-gray-500 ${
                    isLoggedIn
                      ? "app-dark:text-muted"
                      : "app-dark:text-muted"
                  }`}
                >
                  Save your changes and make sure the automation is active. You can
                  pause or resume it whenever needed.
                </p>

              </div>

            </div>

          </div>

        </div>

        {/* NEXT */}

        <div
          className={`mt-12 rounded-3xl border border-border-subtle bg-white p-8 ${
            isLoggedIn
              ? "app-dark:border-border-subtle app-dark:bg-surface"
              : "app-dark:border-border-subtle app-dark:bg-surface"
          }`}
        >

          <h2 className="text-xl font-bold">
            Next: Lead Capture
          </h2>

          <p
            className={`mt-2 text-sm leading-6 text-gray-500 ${
              isLoggedIn
                ? "app-dark:text-muted"
                : "app-dark:text-muted"
            }`}
          >
            Learn more about how leads enter Flowex and how the lead capture workflow works.
          </p>

          <Link
            href="/resources/lead-capture"
            className="mt-5 inline-flex rounded-xl bg-brand-primary   px-5 py-2.5 text-sm font-bold text-gray-100"
          >
            Open Lead Capture Guide
          </Link>

        </div>

      </section>

    </main>
  );
}