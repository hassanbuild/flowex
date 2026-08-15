"use client";

import Image from "next/image";
import Link from "next/link";
import { useAppAccount } from "@/components/AppAccountProvider";

export default function ContactPage() {
  const { isLoggedIn, plan } = useAppAccount();

  const backPath =
    !isLoggedIn
      ? "/"
      : plan === "free"
        ? "/home"
        : "/dashboard";

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
            className={`text-sm font-semibold text-gray-500 transition-colors hover:text-gray-900 ${
              isLoggedIn
                ? "app-dark:text-slate-200 app-dark:hover:text-white"
                : "dark:text-slate-200 dark:hover:text-white"
            }`}
          >
            ← Back to Flowex
          </Link>

        </div>
      </nav>

      {/* CONTENT */}

      <section className="mx-auto max-w-5xl px-6 py-20">

        <div className="mx-auto max-w-2xl text-center">

          <div className="mb-6 inline-flex rounded-full bg-gradient-to-r from-[#00c297] to-[#4b52f7] p-[1px]">

            <div
              className={`rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-gray-700 ${
                isLoggedIn
                  ? "app-dark:bg-[#0b0f14] app-dark:text-white"
                  : "dark:bg-[#0b0f14] dark:text-white"
              }`}
            >
              Contact Flowex
            </div>

          </div>

          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
            How can we help?
          </h1>

          <p
            className={`mt-5 text-base leading-7 text-gray-500 ${
              isLoggedIn
                ? "app-dark:text-slate-400"
                : "dark:text-slate-400"
            }`}
          >
            Have a question about Flowex, your account, or your automation?
            Send us a message and we'll help you out.
          </p>

        </div>

        {/* FORM */}

        <div
          className={`mx-auto mt-12 max-w-2xl rounded-3xl border border-gray-200 bg-white p-8 ${
            isLoggedIn
              ? "app-dark:border-slate-800 app-dark:bg-[#11161d]"
              : "dark:border-slate-800 dark:bg-[#11161d]"
          }`}
        >

          <div className="grid gap-5 sm:grid-cols-2">

            <div>

              <label className="text-sm font-semibold">
                Name
              </label>

              <input
                type="text"
                placeholder="Your name"
                className={`mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#4b52f7] ${
                  isLoggedIn
                    ? "app-dark:border-slate-700 app-dark:bg-[#0b0f14] app-dark:text-white"
                    : "dark:border-slate-700 dark:bg-[#0b0f14] dark:text-white"
                }`}
              />

            </div>

            <div>

              <label className="text-sm font-semibold">
                Email
              </label>

              <input
                type="email"
                placeholder="you@example.com"
                className={`mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#4b52f7] ${
                  isLoggedIn
                    ? "app-dark:border-slate-700 app-dark:bg-[#0b0f14] app-dark:text-white"
                    : "dark:border-slate-700 dark:bg-[#0b0f14] dark:text-white"
                }`}
              />

            </div>

          </div>

          <div className="mt-5">

            <label className="text-sm font-semibold">
              Subject
            </label>

            <input
              type="text"
              placeholder="What do you need help with?"
              className={`mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#4b52f7] ${
                isLoggedIn
                  ? "app-dark:border-slate-700 app-dark:bg-[#0b0f14] app-dark:text-white"
                  : "dark:border-slate-700 dark:bg-[#0b0f14] dark:text-white"
              }`}
            />

          </div>

          <div className="mt-5">

            <label className="text-sm font-semibold">
              Message
            </label>

            <textarea
              rows={6}
              placeholder="Tell us more..."
              className={`mt-2 w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#4b52f7] ${
                isLoggedIn
                  ? "app-dark:border-slate-700 app-dark:bg-[#0b0f14] app-dark:text-white"
                  : "dark:border-slate-700 dark:bg-[#0b0f14] dark:text-white"
              }`}
            />

          </div>

          <button
            type="button"
            className="mt-6 w-full rounded-xl bg-gradient-to-r from-[#00c297] to-[#4b52f7] py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            Send Message
          </button>

          <p
            className={`mt-3 text-center text-xs text-gray-400 ${
              isLoggedIn
                ? "app-dark:text-slate-500"
                : "dark:text-slate-500"
            }`}
          >
            Support replies are sent to the email address you provide.
          </p>

        </div>

      </section>

      {/* FOOTER */}

      <footer
        className={`border-t border-gray-200/70 bg-white/85 backdrop-blur-xl ${
          isLoggedIn
            ? "app-dark:border-slate-800/80 app-dark:bg-[linear-gradient(90deg,#0b0f14_0%,#172033_8%,#252b70_25%,#006454_50%,#252b70_75%,#172033_92%,#0b0f14_100%)]"
            : "dark:border-slate-800/80 dark:bg-[linear-gradient(90deg,#0b0f14_0%,#172033_8%,#252b70_25%,#006454_50%,#252b70_75%,#172033_92%,#0b0f14_100%)]"
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