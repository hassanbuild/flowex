"use client";

import Image from "next/image";
import Link from "next/link";
import { useAppAccount } from "@/components/AppAccountProvider";

export default function PrivacyPage() {
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

      <section className="mx-auto max-w-4xl px-6 py-20">

        <div className="mb-6 inline-flex rounded-full bg-gradient-to-r from-[#00c297] to-[#4b52f7] p-[1px]">

          <div
            className={`rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-gray-700 ${
              isLoggedIn
                ? "app-dark:bg-[#0b0f14] app-dark:text-white"
                : "dark:bg-[#0b0f14] dark:text-white"
            }`}
          >
            Privacy Policy
          </div>

        </div>

        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
          Your privacy matters.
        </h1>

        <p
          className={`mt-5 text-sm text-gray-400 ${
            isLoggedIn
              ? "app-dark:text-slate-500"
              : "dark:text-slate-500"
          }`}
        >
          Last updated: August 10, 2026
        </p>

        <div className="mt-12 space-y-8">

          {/* INTRO */}

          <section>
            <h2 className="text-xl font-bold">
              1. Introduction
            </h2>

            <p
              className={`mt-3 leading-7 text-gray-600 ${
                isLoggedIn
                  ? "app-dark:text-slate-400"
                  : "dark:text-slate-400"
              }`}
            >
              This Privacy Policy explains how Flowex collects, uses, and handles
              information when you use our website, account features, and automation
              services.
            </p>
          </section>

          {/* INFORMATION */}

          <section>
            <h2 className="text-xl font-bold">
              2. Information we may collect
            </h2>

            <div
              className={`mt-4 space-y-3 text-gray-600 ${
                isLoggedIn
                  ? "app-dark:text-slate-400"
                  : "dark:text-slate-400"
              }`}
            >
              <p>
                We may collect information you provide directly to Flowex, including:
              </p>

              <ul className="list-disc space-y-2 pl-6">
                <li>Name and email address</li>
                <li>Phone number and account profile information</li>
                <li>Automation settings and preferences</li>
                <li>Information submitted through support or contact forms</li>
                <li>Billing information when paid subscriptions are enabled</li>
              </ul>
            </div>
          </section>

          {/* LEAD DATA */}

          <section>
            <h2 className="text-xl font-bold">
              3. Lead and automation data
            </h2>

            <p
              className={`mt-3 leading-7 text-gray-600 ${
                isLoggedIn
                  ? "app-dark:text-slate-400"
                  : "dark:text-slate-400"
              }`}
            >
              Flowex may process information submitted through connected lead
              sources, forms, websites, or other integrations so your automation can
              capture, store, respond to, notify, and follow up with leads.
            </p>

            <p
              className={`mt-3 leading-7 text-gray-600 ${
                isLoggedIn
                  ? "app-dark:text-slate-400"
                  : "dark:text-slate-400"
              }`}
            >
              You are responsible for ensuring that you have the appropriate rights
              and permissions to collect and process the information you send through
              Flowex.
            </p>
          </section>

          {/* USE */}

          <section>
            <h2 className="text-xl font-bold">
              4. How we use information
            </h2>

            <p
              className={`mt-3 leading-7 text-gray-600 ${
                isLoggedIn
                  ? "app-dark:text-slate-400"
                  : "dark:text-slate-400"
              }`}
            >
              Information may be used to provide and operate Flowex, maintain your
              account, run automations, improve the product, respond to support
              requests, prevent misuse, and manage subscriptions or billing.
            </p>
          </section>

          {/* INTEGRATIONS */}

          <section>
            <h2 className="text-xl font-bold">
              5. Connected services and integrations
            </h2>

            <p
              className={`mt-3 leading-7 text-gray-600 ${
                isLoggedIn
                  ? "app-dark:text-slate-400"
                  : "dark:text-slate-400"
              }`}
            >
              Flowex may allow you to connect third-party services such as Google
              Sheets, Airtable, Slack, email services, or other platforms.
            </p>

            <p
              className={`mt-3 leading-7 text-gray-600 ${
                isLoggedIn
                  ? "app-dark:text-slate-400"
                  : "dark:text-slate-400"
              }`}
            >
              Information shared with those services may also be subject to their
              own privacy policies and terms.
            </p>
          </section>

          {/* SHARING */}

          <section>
            <h2 className="text-xl font-bold">
              6. Sharing of information
            </h2>

            <p
              className={`mt-3 leading-7 text-gray-600 ${
                isLoggedIn
                  ? "app-dark:text-slate-400"
                  : "dark:text-slate-400"
              }`}
            >
              Flowex does not sell your personal information.
            </p>

            <p
              className={`mt-3 leading-7 text-gray-600 ${
                isLoggedIn
                  ? "app-dark:text-slate-400"
                  : "dark:text-slate-400"
              }`}
            >
              Information may be shared with service providers when necessary to
              operate Flowex, process payments, provide infrastructure, deliver
              notifications, or support connected integrations.
            </p>
          </section>

          {/* SECURITY */}

          <section>
            <h2 className="text-xl font-bold">
              7. Data security
            </h2>

            <p
              className={`mt-3 leading-7 text-gray-600 ${
                isLoggedIn
                  ? "app-dark:text-slate-400"
                  : "dark:text-slate-400"
              }`}
            >
              We aim to use reasonable technical and organizational measures to
              protect information handled through Flowex. However, no online system
              can guarantee absolute security.
            </p>
          </section>

          {/* RETENTION */}

          <section>
            <h2 className="text-xl font-bold">
              8. Data retention
            </h2>

            <p
              className={`mt-3 leading-7 text-gray-600 ${
                isLoggedIn
                  ? "app-dark:text-slate-400"
                  : "dark:text-slate-400"
              }`}
            >
              We may retain information for as long as reasonably necessary to
              provide Flowex, maintain your account, meet legal requirements, resolve
              disputes, and protect the service.
            </p>
          </section>

          {/* RIGHTS */}

          <section>
            <h2 className="text-xl font-bold">
              9. Your choices
            </h2>

            <p
              className={`mt-3 leading-7 text-gray-600 ${
                isLoggedIn
                  ? "app-dark:text-slate-400"
                  : "dark:text-slate-400"
              }`}
            >
              You may update your account information through your account settings.
              Where available, you may also request deletion of your account and
              associated information.
            </p>
          </section>

          {/* CHILDREN */}

          <section>
            <h2 className="text-xl font-bold">
              10. Children's privacy
            </h2>

            <p
              className={`mt-3 leading-7 text-gray-600 ${
                isLoggedIn
                  ? "app-dark:text-slate-400"
                  : "dark:text-slate-400"
              }`}
            >
              Flowex is not intended for children under the age required to legally
              use online services in their jurisdiction.
            </p>
          </section>

          {/* CHANGES */}

          <section>
            <h2 className="text-xl font-bold">
              11. Changes to this policy
            </h2>

            <p
              className={`mt-3 leading-7 text-gray-600 ${
                isLoggedIn
                  ? "app-dark:text-slate-400"
                  : "dark:text-slate-400"
              }`}
            >
              We may update this Privacy Policy as Flowex evolves. When we make
              meaningful changes, we may update the date shown at the top of this
              page.
            </p>
          </section>

          {/* CONTACT */}

          <section>
            <h2 className="text-xl font-bold">
              12. Contact
            </h2>

            <p
              className={`mt-3 leading-7 text-gray-600 ${
                isLoggedIn
                  ? "app-dark:text-slate-400"
                  : "dark:text-slate-400"
              }`}
            >
              If you have questions about this Privacy Policy or how information is
              handled, you can contact us through the Flowex contact page.
            </p>

            <Link
              href="/contact"
              className="mt-5 inline-flex rounded-xl bg-gradient-to-r from-[#00c297] to-[#4b52f7] px-5 py-2.5 text-sm font-bold text-white"
            >
              Contact Flowex
            </Link>
          </section>

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