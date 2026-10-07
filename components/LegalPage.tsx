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
    <main className={`min-h-screen bg-[#fbfcfd] text-gray-900 transition-colors duration-300 ${isLoggedIn ? "app-dark:bg-[#0b0f14] app-dark:text-slate-100" : "dark:bg-[#0b0f14] dark:text-slate-100"}`}>
      <nav className={`border-b border-gray-200/70 bg-white/85 backdrop-blur-xl ${isLoggedIn ? "app-dark:border-slate-800/80 app-dark:bg-[#11161d]" : "dark:border-slate-800/80 dark:bg-[#11161d]"}`}>
        <div className="mx-auto flex h-[55px] max-w-7xl items-center justify-between px-6">
          <Link href={backPath} aria-label="Flowex home">
            <Image src="/flowex-logo.png" alt="Flowex" width={115} height={32} priority />
          </Link>
          <Link href={backPath} className={`text-sm font-semibold text-gray-500 transition-colors hover:text-gray-900 ${isLoggedIn ? "app-dark:text-slate-200 app-dark:hover:text-white" : "dark:text-slate-200 dark:hover:text-white"}`}>
            ← Back to Flowex
          </Link>
        </div>
      </nav>

      <article className="mx-auto max-w-4xl px-6 py-14 sm:py-20">
        <div className="mb-6 inline-flex rounded-full bg-gradient-to-r from-[#00c297] to-[#4b52f7] p-[1px]">
          <span className={`rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-gray-700 ${isLoggedIn ? "app-dark:bg-[#0b0f14] app-dark:text-white" : "dark:bg-[#0b0f14] dark:text-white"}`}>
            {label}
          </span>
        </div>
        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">{title}</h1>
        <p className={`mt-5 text-sm text-gray-400 ${isLoggedIn ? "app-dark:text-slate-500" : "dark:text-slate-500"}`}>Last updated: {lastUpdated}</p>

        <div className="mt-12 space-y-9">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-bold">{section.title}</h2>
              <div className={`mt-3 space-y-3 leading-7 text-gray-600 ${isLoggedIn ? "app-dark:text-slate-400" : "dark:text-slate-400"}`}>
                {section.content}
              </div>
            </section>
          ))}
        </div>
      </article>

      <footer className={`border-t border-gray-200/70 bg-white/85 backdrop-blur-xl ${isLoggedIn ? "app-dark:border-slate-800/80 app-dark:bg-[#11161d]" : "dark:border-slate-800/80 dark:bg-[#11161d]"}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-4">
            <Image src="/flowex-logo.png" alt="Flowex" width={110} height={30} />
            <span className={`hidden text-sm text-gray-400 lg:block ${isLoggedIn ? "app-dark:text-slate-200" : "dark:text-slate-200"}`}>Automate your business.</span>
          </div>
          <p className={`text-xs text-gray-400 ${isLoggedIn ? "app-dark:text-slate-300" : "dark:text-slate-300"}`}>© 2026 Flowex. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
