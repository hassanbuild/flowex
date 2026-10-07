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
      className={`min-h-screen text-foreground transition-colors duration-300 ${
        isLoggedIn
          ? "bg-background app-dark:bg-surface app-dark:text-gray-100"
          : "bg-background app-dark:bg-surface app-dark:text-gray-100"
      }`}
    >

      {/* NAVBAR */}

      <nav
        className={`border-b backdrop-blur-xl ${
          isLoggedIn
            ? "border-border-subtle/70 bg-white/85 app-dark:border-border-subtle/80 app-dark:bg-surface"
            : "border-border-subtle/70 bg-white/85 app-dark:border-border-subtle/80 app-dark:bg-surface"
        }`}
      >
        <div className="mx-auto flex h-[55px] max-w-7xl items-center justify-between px-6">

          <Link href={backPath}>
            <Image
              src="/flowex-logo-brand.png"
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
                ? "text-gray-500 hover:text-foreground app-dark:text-gray-100 app-dark:hover:text-gray-100"
                : "text-gray-500 hover:text-foreground app-dark:text-gray-100 app-dark:hover:text-gray-100"
            }`}
          >
            ← Back to Flowex
          </Link>

        </div>
      </nav>

      {/* HERO */}

      <section className="mx-auto max-w-7xl px-6 pb-14 pt-24 text-center">

        <div className="mx-auto mb-5 inline-flex rounded-full bg-surface   p-[1px]">

          <div
            className={`rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-gray-700 ${
              isLoggedIn
                ? "app-dark:bg-surface app-dark:text-gray-100"
                : "app-dark:bg-surface app-dark:text-gray-100"
            }`}
          >
            Flowex Resources
          </div>

        </div>

        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
          Everything you need to{" "}
          <span className="bg-surface    ">
            get started.
          </span>
        </h1>

        <p
          className={`mx-auto mt-5 max-w-2xl text-base leading-7 text-gray-500 ${
            isLoggedIn
              ? "app-dark:text-muted"
              : "app-dark:text-muted"
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
              className={`group rounded-3xl border border-border-subtle bg-white p-6 transition-all duration-200 hover:-translate-y-1 hover:border-border-subtle hover:shadow-sm ${
                isLoggedIn
                  ? "app-dark:border-border-subtle app-dark:bg-surface app-dark:hover:border-border-subtle"
                  : "app-dark:border-border-subtle app-dark:bg-surface app-dark:hover:border-border-subtle"
              }`}
            >

              <div
                className={`mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-surface   text-lg ${
                  isLoggedIn
                    ? " "
                    : " "
                }`}
              >
                {resource.icon}
              </div>

              <h2
                className={`text-lg font-bold text-foreground ${
                  isLoggedIn
                    ? "app-dark:text-gray-100"
                    : "app-dark:text-gray-100"
                }`}
              >
                {resource.title}
              </h2>

              <p
                className={`mt-2 text-sm leading-6 text-gray-500 ${
                  isLoggedIn
                    ? "app-dark:text-muted"
                    : "app-dark:text-muted"
                }`}
              >
                {resource.description}
              </p>

              <div
                className={`mt-5 text-sm font-semibold text-brand-primary transition-transform group-hover:translate-x-1 ${
                  isLoggedIn
                    ? "app-dark:text-brand-primary"
                    : "app-dark:text-brand-primary"
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
          className={`rounded-3xl border border-border-subtle bg-white px-8 py-10 text-center ${
            isLoggedIn
              ? "app-dark:border-border-subtle app-dark:bg-surface"
              : "app-dark:border-border-subtle app-dark:bg-surface"
          }`}
        >

          <h2 className="text-2xl font-black">
            Still need help?
          </h2>

          <p
            className={`mx-auto mt-3 max-w-lg text-sm leading-6 text-gray-500 ${
              isLoggedIn
                ? "app-dark:text-muted"
                : "app-dark:text-muted"
            }`}
          >
            If you can't find what you're looking for, reach out and we'll help
            you get Flowex running.
          </p>

          <Link
            href="/contact"
            className="mt-6 inline-flex rounded-xl bg-brand-primary   px-5 py-2.5 text-sm font-bold text-gray-100 transition-opacity hover:opacity-90"
          >
            Contact Support
          </Link>

        </div>

      </section>

      {/* FOOTER */}

      <footer
        className={`border-t backdrop-blur-xl ${
          isLoggedIn
            ? "border-border-subtle/70 bg-white/85 app-dark:border-border-subtle/80 app-dark:bg-surface"
            : "border-border-subtle/70 bg-white/85 app-dark:border-border-subtle/80 app-dark:bg-surface"
        }`}
      >

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">

          <div className="flex items-center gap-4">

            <Image
              src="/flowex-logo-brand.png"
              alt="Flowex"
              width={110}
              height={30}
            />

            <span
              className={`hidden text-sm text-muted lg:block ${
                isLoggedIn
                  ? "app-dark:text-gray-100"
                  : "app-dark:text-gray-100"
              }`}
            >
              Automate your business.
            </span>

          </div>

          <p
            className={`text-xs text-muted ${
              isLoggedIn
                ? "app-dark:text-muted"
                : "app-dark:text-muted"
            }`}
          >
            © 2026 Flowex. All rights reserved.
          </p>

        </div>

      </footer>

    </main>
  );
}