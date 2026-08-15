"use client";

import Image from "next/image";
import Link from "next/link";
import { useAppAccount } from "@/components/AppAccountProvider";

export default function TermsPage() {
  const { isLoggedIn, plan } = useAppAccount();

  const backPath =
    !isLoggedIn
      ? "/"
      : plan === "free"
        ? "/home"
        : "/dashboard";

  const textClass = isLoggedIn
    ? "app-dark:text-slate-400"
    : "dark:text-slate-400";

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
            Terms of Service
          </div>
        </div>

        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
          Terms of Service
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

          {/* 1 */}

          <section>
            <h2 className="text-xl font-bold">
              1. Agreement to these terms
            </h2>

            <p className={`mt-3 leading-7 text-gray-600 ${textClass}`}>
              These Terms of Service govern your access to and use of Flowex,
              including our website, account features, automation tools, and
              related services.
            </p>

            <p className={`mt-3 leading-7 text-gray-600 ${textClass}`}>
              By creating an account or using Flowex, you agree to these Terms.
              If you do not agree, you should not use the service.
            </p>
          </section>

          {/* 2 */}

          <section>
            <h2 className="text-xl font-bold">
              2. Your account
            </h2>

            <p className={`mt-3 leading-7 text-gray-600 ${textClass}`}>
              You are responsible for providing accurate account information and
              for keeping your account credentials secure. You are also
              responsible for activity that occurs through your account.
            </p>

            <p className={`mt-3 leading-7 text-gray-600 ${textClass}`}>
              You should notify Flowex if you believe your account has been
              accessed or used without authorization.
            </p>
          </section>

          {/* 3 */}

          <section>
            <h2 className="text-xl font-bold">
              3. Using Flowex
            </h2>

            <p className={`mt-3 leading-7 text-gray-600 ${textClass}`}>
              Flowex provides tools designed to help businesses capture leads,
              automate responses, send notifications, organize information, and
              manage follow-up workflows.
            </p>

            <p className={`mt-3 leading-7 text-gray-600 ${textClass}`}>
              You are responsible for how you configure and use your
              automations, including the messages and information processed
              through them.
            </p>
          </section>

          {/* 4 */}

          <section>
            <h2 className="text-xl font-bold">
              4. Lead data and communications
            </h2>

            <p className={`mt-3 leading-7 text-gray-600 ${textClass}`}>
              You are responsible for ensuring that you have the necessary
              rights, permissions, and legal basis to collect, store, process,
              and communicate with leads whose information is processed through
              Flowex.
            </p>

            <p className={`mt-3 leading-7 text-gray-600 ${textClass}`}>
              Your use of automated messages, follow-ups, notifications, and
              other communications must comply with laws and regulations that
              apply to you and your recipients.
            </p>
          </section>

          {/* 5 */}

          <section>
            <h2 className="text-xl font-bold">
              5. Acceptable use
            </h2>

            <p className={`mt-3 leading-7 text-gray-600 ${textClass}`}>
              You may not use Flowex to violate the law, abuse or disrupt the
              service, gain unauthorized access to systems or accounts, send
              unlawful or abusive communications, distribute malicious content,
              or interfere with other users.
            </p>

            <p className={`mt-3 leading-7 text-gray-600 ${textClass}`}>
              We may restrict or suspend access when we reasonably believe an
              account is being used in a way that threatens Flowex, its users,
              third parties, or the security of the service.
            </p>
          </section>

          {/* 6 */}

          <section>
            <h2 className="text-xl font-bold">
              6. Third-party services
            </h2>

            <p className={`mt-3 leading-7 text-gray-600 ${textClass}`}>
              Flowex may connect with third-party services such as Google
              Sheets, Airtable, Slack, email providers, payment processors, and
              other platforms.
            </p>

            <p className={`mt-3 leading-7 text-gray-600 ${textClass}`}>
              Third-party services are operated independently from Flowex and
              may have their own terms, privacy policies, limitations, and
              availability.
            </p>
          </section>

          {/* 7 */}

          <section>
            <h2 className="text-xl font-bold">
              7. Plans, trials, and billing
            </h2>

            <p className={`mt-3 leading-7 text-gray-600 ${textClass}`}>
              Flowex may offer free trials, paid subscriptions, or other plans.
              Pricing, included features, billing periods, and applicable limits
              will be presented when you select a plan.
            </p>

            <p className={`mt-3 leading-7 text-gray-600 ${textClass}`}>
              If a subscription automatically renews, you may cancel it before
              the next billing date to prevent the next renewal charge, subject
              to the terms shown when you subscribe.
            </p>
          </section>

          {/* 8 */}

          <section>
            <h2 className="text-xl font-bold">
              8. Changes to features and pricing
            </h2>

            <p className={`mt-3 leading-7 text-gray-600 ${textClass}`}>
              Flowex may add, modify, improve, or discontinue features as the
              product evolves. We may also change plans or pricing in the
              future.
            </p>

            <p className={`mt-3 leading-7 text-gray-600 ${textClass}`}>
              Where appropriate, we will provide notice of material changes that
              affect existing paid subscriptions.
            </p>
          </section>

          {/* 9 */}

          <section>
            <h2 className="text-xl font-bold">
              9. Service availability
            </h2>

            <p className={`mt-3 leading-7 text-gray-600 ${textClass}`}>
              We work to keep Flowex available and reliable, but we do not
              guarantee uninterrupted or error-free operation. Availability may
              be affected by maintenance, technical issues, third-party
              services, or circumstances outside our control.
            </p>
          </section>

          {/* 10 */}

          <section>
            <h2 className="text-xl font-bold">
              10. Your content and data
            </h2>

            <p className={`mt-3 leading-7 text-gray-600 ${textClass}`}>
              You retain your rights to the information and content you provide
              through Flowex. You give Flowex permission to process that
              information as necessary to provide, maintain, secure, and improve
              the service.
            </p>
          </section>

          {/* 11 */}

          <section>
            <h2 className="text-xl font-bold">
              11. Flowex intellectual property
            </h2>

            <p className={`mt-3 leading-7 text-gray-600 ${textClass}`}>
              Flowex and its software, branding, designs, interfaces, and
              related materials are protected by applicable intellectual
              property laws. These Terms do not transfer ownership of Flowex or
              its intellectual property to you.
            </p>
          </section>

          {/* 12 */}

          <section>
            <h2 className="text-xl font-bold">
              12. Suspension and termination
            </h2>

            <p className={`mt-3 leading-7 text-gray-600 ${textClass}`}>
              You may stop using Flowex at any time. We may suspend or terminate
              access when necessary to protect the service, enforce these Terms,
              comply with legal requirements, or address serious misuse.
            </p>
          </section>

          {/* 13 */}

          <section>
            <h2 className="text-xl font-bold">
              13. Disclaimer
            </h2>

            <p className={`mt-3 leading-7 text-gray-600 ${textClass}`}>
              Flowex is provided on an "as available" basis. To the extent
              permitted by applicable law, we do not guarantee that every
              automation, integration, notification, response, or third-party
              connection will operate without interruption or error.
            </p>
          </section>

          {/* 14 */}

          <section>
            <h2 className="text-xl font-bold">
              14. Limitation of liability
            </h2>

            <p className={`mt-3 leading-7 text-gray-600 ${textClass}`}>
              To the extent permitted by applicable law, Flowex will not be
              responsible for indirect, incidental, special, consequential, or
              similar damages arising from your use of or inability to use the
              service.
            </p>
          </section>

          {/* 15 */}

          <section>
            <h2 className="text-xl font-bold">
              15. Changes to these Terms
            </h2>

            <p className={`mt-3 leading-7 text-gray-600 ${textClass}`}>
              We may update these Terms as Flowex develops. The latest version
              will be published on this page with an updated effective date.
            </p>
          </section>

          {/* 16 */}

          <section>
            <h2 className="text-xl font-bold">
              16. Contact
            </h2>

            <p className={`mt-3 leading-7 text-gray-600 ${textClass}`}>
              If you have questions about these Terms, contact us through the
              Flowex contact page.
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