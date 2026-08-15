"use client";

import Link from "next/link";
import Image from "next/image";
import { useAppAccount } from "@/components/AppAccountProvider";

const resources = [
  {
    icon: "🚀",
    title: "Getting Started",
    description:
      "Set up Flowex, connect your lead source, and launch your first automation.",
    href: "/resources/getting-started",
  },
  {
    icon: "🎯",
    title: "Lead Capture",
    description:
      "Learn how Flowex captures leads from forms, websites, and connected sources.",
    href: "/resources/lead-capture",
  },
  {
    icon: "🔗",
    title: "Integrations",
    description:
      "Connect tools like Google Sheets, Airtable, Slack, and your business email.",
    href: "/resources/integrations",
  },
  {
    icon: "⚡",
    title: "Automation",
    description:
      "Understand automated replies, notifications, follow-ups, and automation controls.",
    href: "/resources/automation",
  },
  {
    icon: "✉️",
    title: "Contact Support",
    description:
      "Need help? Get in touch with the Flowex team.",
    href: "/contact",
  },
];

export default function ResourcesPage() {
  const {
    isLoggedIn,
    plan,
  } = useAppAccount();

  const hasPremiumAccess =
    plan === "trial" || plan === "pro";

  const backPath =
    !isLoggedIn
      ? "/"
      : hasPremiumAccess
        ? "/dashboard"
        : "/home";

  return (
    <main
      className={`min-h-screen text-gray-900 transition-colors duration-300 ${
        isLoggedIn
          ? "bg-[#fbfcfd] app-dark:bg-[#0b0f14] app-dark:text-slate-100"
          : "bg-[#fbfcfd] dark:bg-[#0b0f14] dark:text-slate-100"
      }`}
    >

      {/* NAVBAR */}

      <nav
        className={`border-b backdrop-blur-xl ${
          isLoggedIn
            ? "border-gray-200/70 bg-white/85 app-dark:border-slate-800/80 app-dark:bg-[linear-gradient(90deg,#0b0f14_0%,#172033_8%,#252b70_25%,#006454_50%,#252b70_75%,#172033_92%,#0b0f14_100%)]"
            : "border-gray-200/70 bg-white/85 dark:border-slate-800/80 dark:bg-[linear-gradient(90deg,#0b0f14_0%,#172033_8%,#252b70_25%,#006454_50%,#252b70_75%,#172033_92%,#0b0f14_100%)]"
        }`}
      >
        <div className="mx-auto flex h-[55px] max-w-7xl items-center justify-between px-6">

          <Link href={backPath}>
            <Image
              src="/flowex-logo.png"
              alt="Flowex"
              width={115}
              height={32}
              priority
            />
          </Link>

          <Link
            href={backPath}
            className={`text-sm font-semibold transition-colors ${
              isLoggedIn
                ? "text-gray-500 hover:text-gray-900 app-dark:text-slate-200 app-dark:hover:text-white"
                : "text-gray-500 hover:text-gray-900 dark:text-slate-200 dark:hover:text-white"
            }`}
          >
            ← Back to Flowex
          </Link>

        </div>
      </nav>

      {/* HERO */}

      <section className="mx-auto max-w-7xl px-6 pb-14 pt-24 text-center">

        <div className="mx-auto mb-5 inline-flex rounded-full bg-gradient-to-r from-[#00c297] to-[#4b52f7] p-[1px]">

          <div
            className={`rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-gray-700 ${
              isLoggedIn
                ? "app-dark:bg-[#0b0f14] app-dark:text-white"
                : "dark:bg-[#0b0f14] dark:text-white"
            }`}
          >
            Flowex Resources
          </div>

        </div>

        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
          Everything you need to{" "}
          <span className="bg-gradient-to-r from-[#00c297] to-[#4b52f7] bg-clip-text text-transparent">
            get started.
          </span>
        </h1>

        <p
          className={`mx-auto mt-5 max-w-2xl text-base leading-7 text-gray-500 ${
            isLoggedIn
              ? "app-dark:text-slate-400"
              : "dark:text-slate-400"
          }`}
        >
          Simple guides and resources to help you set up Flowex,
          automate your lead flow, and keep everything running smoothly.
        </p>

      </section>

      {/* RESOURCES */}

      <section className="mx-auto max-w-6xl px-6 pb-24">

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

          {resources.map((resource) => (
            <Link
              key={resource.title}
              href={resource.href}
              className={`group rounded-3xl border border-gray-200 bg-white p-6 transition-all duration-200 hover:-translate-y-1 hover:border-gray-300 hover:shadow-lg ${
                isLoggedIn
                  ? "app-dark:border-slate-800 app-dark:bg-[#11161d] app-dark:hover:border-slate-700"
                  : "dark:border-slate-800 dark:bg-[#11161d] dark:hover:border-slate-700"
              }`}
            >

              <div
                className={`mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-cyan-100 text-lg ${
                  isLoggedIn
                    ? "app-dark:from-[#00c297]/40 app-dark:to-[#4b52f7]/40"
                    : "dark:from-[#00c297]/40 dark:to-[#4b52f7]/40"
                }`}
              >
                {resource.icon}
              </div>

              <h2
                className={`text-lg font-bold text-gray-900 ${
                  isLoggedIn
                    ? "app-dark:text-white"
                    : "dark:text-white"
                }`}
              >
                {resource.title}
              </h2>

              <p
                className={`mt-2 text-sm leading-6 text-gray-500 ${
                  isLoggedIn
                    ? "app-dark:text-slate-400"
                    : "dark:text-slate-400"
                }`}
              >
                {resource.description}
              </p>

              <div
                className={`mt-5 text-sm font-semibold text-[#4b52f7] transition-transform group-hover:translate-x-1 ${
                  isLoggedIn
                    ? "app-dark:text-[#7c83ff]"
                    : "dark:text-[#7c83ff]"
                }`}
              >
                Explore →
              </div>

            </Link>
          ))}

        </div>

      </section>

      {/* SUPPORT CTA */}

      <section className="mx-auto max-w-5xl px-6 pb-24">

        <div
          className={`rounded-3xl border border-gray-200 bg-white px-8 py-10 text-center ${
            isLoggedIn
              ? "app-dark:border-slate-800 app-dark:bg-[#11161d]"
              : "dark:border-slate-800 dark:bg-[#11161d]"
          }`}
        >

          <h2 className="text-2xl font-black">
            Still need help?
          </h2>

          <p
            className={`mx-auto mt-3 max-w-lg text-sm leading-6 text-gray-500 ${
              isLoggedIn
                ? "app-dark:text-slate-400"
                : "dark:text-slate-400"
            }`}
          >
            If you can't find what you're looking for, reach out and we'll help
            you get Flowex running.
          </p>

          <Link
            href="/contact"
            className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-[#00c297] to-[#4b52f7] px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            Contact Support
          </Link>

        </div>

      </section>

      {/* FOOTER */}

      <footer
        className={`border-t backdrop-blur-xl ${
          isLoggedIn
            ? "border-gray-200/70 bg-white/85 app-dark:border-slate-800/80 app-dark:bg-[linear-gradient(90deg,#0b0f14_0%,#172033_8%,#252b70_25%,#006454_50%,#252b70_75%,#172033_92%,#0b0f14_100%)]"
            : "border-gray-200/70 bg-white/85 dark:border-slate-800/80 dark:bg-[linear-gradient(90deg,#0b0f14_0%,#172033_8%,#252b70_25%,#006454_50%,#252b70_75%,#172033_92%,#0b0f14_100%)]"
        }`}
      >

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">

          <div className="flex items-center gap-4">

            <Image
              src="/flowex-logo.png"
              alt="Flowex"
              width={110}
              height={30}
            />

            <span
              className={`hidden text-sm text-gray-400 lg:block ${
                isLoggedIn
                  ? "app-dark:text-slate-200"
                  : "dark:text-slate-200"
              }`}
            >
              Automate your business.
            </span>

          </div>

          <p
            className={`text-xs text-gray-400 ${
              isLoggedIn
                ? "app-dark:text-slate-300"
                : "dark:text-slate-300"
            }`}
          >
            © 2026 Flowex. All rights reserved.
          </p>

        </div>

      </footer>

    </main>
  );
}