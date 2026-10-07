"use client";

import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";
import { useAppAccount } from "@/components/AppAccountProvider";

type LegalSection = {
  title: string;
  content: ReactNode;
};

export default function LegalPage({
  title,
  label,
  lastUpdated,
  sections,
}: {
  title: string;
  label: string;
  lastUpdated: string;
  sections: LegalSection[];
}) {
  const { isLoggedIn, plan } = useAppAccount();
  const backPath = !isLoggedIn ? "/" : plan === "free" ? "/home" : "/dashboard";
  return (
    <main className={`min-h-screen bg-background text-foreground transition-colors duration-300 ${isLoggedIn ? "app-dark:bg-surface app-dark:text-gray-100" : "app-dark:bg-surface app-dark:text-gray-100"}`}>
      <nav className={`border-b border-border-subtle/70 bg-white/85 backdrop-blur-xl ${isLoggedIn ? "app-dark:border-border-subtle/80 app-dark:bg-surface" : "app-dark:border-border-subtle/80 app-dark:bg-surface"}`}>
        <div className="mx-auto flex h-[55px] max-w-7xl items-center justify-between px-6">
          <Link href={backPath} aria-label="Flowex home">
            <Image src="/flowex-logo-brand.png" alt="Flowex" width={115} height={32} priority />
          </Link>
          <Link href={backPath} className={`text-sm font-semibold text-gray-500 transition-colors hover:text-foreground ${isLoggedIn ? "app-dark:text-gray-100 app-dark:hover:text-gray-100" : "app-dark:text-gray-100 app-dark:hover:text-gray-100"}`}>
            ← Back to Flowex
          </Link>
        </div>
      </nav>

      <article className="mx-auto max-w-4xl px-6 py-14 sm:py-20">
        <div className="mb-6 inline-flex rounded-full bg-surface   p-[1px]">
          <span className={`rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-gray-700 ${isLoggedIn ? "app-dark:bg-surface app-dark:text-gray-100" : "app-dark:bg-surface app-dark:text-gray-100"}`}>
            {label}
          </span>
        </div>
        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">{title}</h1>
        <p className={`mt-5 text-sm text-muted ${isLoggedIn ? "app-dark:text-slate-500" : "app-dark:text-slate-500"}`}>Last updated: {lastUpdated}</p>

        <div className="mt-12 space-y-9">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-bold">{section.title}</h2>
              <div className={`mt-3 space-y-3 leading-7 text-muted ${isLoggedIn ? "app-dark:text-muted" : "app-dark:text-muted"}`}>
                {section.content}
              </div>
            </section>
          ))}
        </div>
      </article>

      <footer className={`border-t border-border-subtle/70 bg-white/85 backdrop-blur-xl ${isLoggedIn ? "app-dark:border-border-subtle/80 app-dark:bg-surface" : "app-dark:border-border-subtle/80 app-dark:bg-surface"}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-4">
            <Image src="/flowex-logo-brand.png" alt="Flowex" width={110} height={30} />
            <span className={`hidden text-sm text-muted lg:block ${isLoggedIn ? "app-dark:text-gray-100" : "app-dark:text-gray-100"}`}>Automate your business.</span>
          </div>
          <p className={`text-xs text-muted ${isLoggedIn ? "app-dark:text-muted" : "app-dark:text-muted"}`}>© 2026 Flowex. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
