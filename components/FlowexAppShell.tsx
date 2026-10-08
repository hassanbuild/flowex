"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { useAppAccount } from "@/components/AppAccountProvider";
import { useAppTheme } from "@/components/AppThemeProvider";
import { useFlowexLogout } from "@/components/useFlowexLogout";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: "▦" },
  { href: "/lead-capture/dashboard", label: "Lead Capture", icon: "⊞" },
  { href: "/lead-capture/leads", label: "Leads", icon: "◉" },
  { href: "/lead-capture/manage", label: "Manage", icon: "◇" },
  { href: "/connections", label: "Connections", icon: "⌘" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

export function FlowexAppShell() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { name, profileImage, plan } = useAppAccount();
  const { theme, toggleTheme } = useAppTheme();
  const { logout, isLoggingOut } = useFlowexLogout();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isMobileMenuOpen]);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      <button
        type="button"
        className="flowex-mobile-menu-trigger"
        onClick={() => setIsMobileMenuOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={isMobileMenuOpen}
      >
        <span aria-hidden="true">☰</span>
      </button>
      <button
        type="button"
        className={`flowex-mobile-menu-backdrop ${isMobileMenuOpen ? "is-open" : ""}`}
        onClick={closeMobileMenu}
        aria-label="Close navigation menu"
        tabIndex={isMobileMenuOpen ? 0 : -1}
      />
      <aside className={`flowex-app-shell px-4 py-5 ${isMobileMenuOpen ? "is-open" : ""}`} aria-label="Application navigation">
      <div className="flex items-center justify-between px-2">
        <Link href="/dashboard" className="flex h-11 items-center" aria-label="Flowex dashboard" onClick={closeMobileMenu}>
        <span className="flowex-brand-mark" aria-hidden="true" />
        </Link>
        <button type="button" className="flowex-mobile-menu-close" onClick={closeMobileMenu} aria-label="Close navigation menu">×</button>
      </div>

      <nav className="mt-8 space-y-1">
        {navigation.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMobileMenu}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? "bg-brand-primary/12 text-brand-primary" : "text-muted hover:bg-surface-subtle hover:text-foreground"}`}
            >
              <span className="w-4 text-center text-base leading-none" aria-hidden="true">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-2">
        <Link href="/upgrade" onClick={closeMobileMenu} className="flowex-glass block rounded-xl px-3 py-3 text-xs leading-5 text-muted transition hover:border-brand-primary/40">
          <span className="block font-semibold text-foreground">Plan & billing</span>
          <span>{plan === "pro" ? "Flowex Pro" : plan === "trial" ? "Pro trial" : "Free plan"}</span>
        </Link>
        <div className="rounded-xl border border-border-subtle bg-surface/70 p-2">
          <Link href="/account" onClick={closeMobileMenu} className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 hover:bg-surface-subtle">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-primary text-xs font-bold text-white">
              {profileImage ? <img src={profileImage} alt="" className="h-full w-full object-cover" /> : (name.charAt(0).toUpperCase() || "F")}
            </span>
            <span className="min-w-0 flex-1 truncate text-xs font-semibold text-foreground">{name}</span>
          </Link>
          <div className="mt-1 flex gap-1 border-t border-border-subtle pt-1">
            <button type="button" onClick={toggleTheme} className="flex-1 rounded-lg px-2 py-1.5 text-xs text-muted hover:bg-surface-subtle" aria-label="Toggle theme">
              {theme === "dark" ? "Light" : "Dark"}
            </button>
            <button type="button" onClick={() => { closeMobileMenu(); logout(); }} disabled={isLoggingOut} className="flex-1 rounded-lg px-2 py-1.5 text-xs text-muted hover:bg-surface-subtle disabled:opacity-60">
              {isLoggingOut ? "..." : "Log out"}
            </button>
          </div>
        </div>
      </div>
      </aside>
    </>
  );
}
