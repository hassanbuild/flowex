"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAppAccount } from "@/components/AppAccountProvider";
import { createClient } from "@/lib/supabase/client";

type BillingInterval = "monthly" | "annual";


type CheckoutDraft = {
  fullName: string;
  email: string;
  acceptedTerms: boolean;
};

const CHECKOUT_DRAFT_KEY =
  "flowex-checkout-draft";

const AUTH_RETURN_KEY =
  "flowex-auth-return-to";

export default function CheckoutPage() {
  const router = useRouter();

  const {
    isLoggedIn,
    authReady,
    plan,
    name,
    email: accountEmail,
  } = useAppAccount();

  const [fullName, setFullName] =
    useState("");

  const [email, setEmail] =
    useState("");





  const [acceptedTerms, setAcceptedTerms] =
    useState(false);

  const [draftLoaded, setDraftLoaded] =
    useState(false);

  const [showAuthChoice, setShowAuthChoice] =
    useState(false);

  const [checkoutError, setCheckoutError] =
    useState("");

  const [billingInterval, setBillingInterval] =
    useState<BillingInterval>("monthly");

  const [isRedirecting, setIsRedirecting] =
    useState(false);

  const isTrial =
    plan === "trial";

  const isPro =
    plan === "pro";

  /*
    ================= LOAD CHECKOUT DRAFT =================

    Guest users may fill checkout before creating
    or logging into their Flowex account.

    We restore everything except payment-card data.
  */

  useEffect(() => {
    if (!authReady) return;

    const savedDraft =
      sessionStorage.getItem(
        CHECKOUT_DRAFT_KEY
      );

    if (savedDraft) {
      try {
        const draft =
          JSON.parse(
            savedDraft
          ) as CheckoutDraft;

        setFullName(
          draft.fullName || ""
        );

        setEmail(
          isLoggedIn
            ? accountEmail
            : draft.email || ""
        );





        setAcceptedTerms(
          draft.acceptedTerms || false
        );
      } catch {
        sessionStorage.removeItem(
          CHECKOUT_DRAFT_KEY
        );
      }
    } else if (isLoggedIn) {
      setFullName(name || "");
      setEmail(accountEmail || "");
    }

    setDraftLoaded(true);
  }, [
    authReady,
    isLoggedIn,
    name,
    accountEmail,
  ]);

  /*
    If authentication happened after a guest
    prepared checkout, always use the authenticated
    Flowex email address.
  */

  useEffect(() => {
    if (
      authReady &&
      isLoggedIn &&
      accountEmail
    ) {
      setEmail(accountEmail);
    }
  }, [
    authReady,
    isLoggedIn,
    accountEmail,
  ]);

  /*
    ================= CLEAR AUTH RETURN =================

    Once Checkout has finished loading in this tab,
    the temporary auth return destination is no longer
    needed.

    Keep the checkout draft itself until the order is
    actually completed or intentionally abandoned.
  */

  useEffect(() => {
    if (
      !authReady ||
      !draftLoaded
    ) {
      return;
    }

    sessionStorage.removeItem(
      AUTH_RETURN_KEY
    );
  }, [
    authReady,
    draftLoaded,
  ]);

  const saveDraft = () => {
    const draft: CheckoutDraft = {
      fullName,
      email,
      acceptedTerms,
    };

    sessionStorage.setItem(
      CHECKOUT_DRAFT_KEY,
      JSON.stringify(draft)
    );
  };

  const continueToAuth = (
    route: "login" | "signup"
  ) => {
    saveDraft();

    sessionStorage.setItem(
      AUTH_RETURN_KEY,
      "/checkout"
    );

    router.push(
      `/${route}?returnTo=${encodeURIComponent(
        "/checkout"
      )}`
    );
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setCheckoutError("");

    if (
      !fullName.trim() ||
      !email.trim()
    ) {
      setCheckoutError(
        "Please enter your name and email."
      );
      return;
    }

    if (!acceptedTerms) {
      setCheckoutError(
        "Please accept the subscription terms before continuing."
      );
      return;
    }

    if (!isLoggedIn) {
      saveDraft();
      setShowAuthChoice(true);
      return;
    }

    if (isTrial || isPro) {
      router.push("/billing");
      return;
    }

    try {
      setIsRedirecting(true);

      const supabase = createClient();

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        setCheckoutError(
          "Your session could not be verified. Please log in again."
        );
        setIsRedirecting(false);
        return;
      }

      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          interval: billingInterval,
          fullName: fullName.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result?.url) {
        setCheckoutError(
          result?.error ||
            "Could not start secure checkout. Please try again."
        );
        setIsRedirecting(false);
        return;
      }

      window.location.href = result.url;
    } catch (error) {
      console.error("Flowex checkout error:", error);

      setCheckoutError(
        "Could not start secure checkout. Please try again."
      );
      setIsRedirecting(false);
    }
  };

  /*
    Avoid rendering checkout before Supabase has
    resolved the user's authentication state.
  */

  if (
    !authReady ||
    !draftLoaded
  ) {
    return (
      <main className="min-h-screen bg-[#f8fafc] dark:bg-[#0b0f14] app-dark:bg-[#0b0f14]" />
    );
  }

  const darkMain =
    isLoggedIn
      ? "app-dark:bg-[#0b0f14] app-dark:text-slate-100"
      : "dark:bg-[#0b0f14] dark:text-slate-100";

  const darkHeader =
    isLoggedIn
      ? "app-dark:border-slate-800/80 app-dark:bg-[linear-gradient(90deg,#0b0f14_0%,#172033_8%,#252b70_25%,#006454_50%,#252b70_75%,#172033_92%,#0b0f14_100%)]"
      : "dark:border-slate-800/80 dark:bg-[linear-gradient(90deg,#0b0f14_0%,#172033_8%,#252b70_25%,#006454_50%,#252b70_75%,#172033_92%,#0b0f14_100%)]";

  const darkCard =
    isLoggedIn
      ? "app-dark:border-slate-800 app-dark:bg-[#11161d]"
      : "dark:border-slate-800 dark:bg-[#11161d]";

  const darkInput =
    isLoggedIn
      ? "app-dark:border-slate-700 app-dark:bg-[#0b0f14] app-dark:text-white app-dark:placeholder:text-slate-500"
      : "dark:border-slate-700 dark:bg-[#0b0f14] dark:text-white dark:placeholder:text-slate-500";

  const darkMuted =
    isLoggedIn
      ? "app-dark:text-slate-400"
      : "dark:text-slate-400";

  const darkTitle =
    isLoggedIn
      ? "app-dark:text-white"
      : "dark:text-white";

  const backPath =
    !isLoggedIn
      ? "/"
      : plan === "free"
        ? "/home"
        : "/dashboard";

  return (
    <main
      className={`min-h-screen bg-[#f8fafc] text-gray-900 transition-colors duration-300 lg:h-screen lg:overflow-hidden ${darkMain}`}
    >

      {/* ================= HEADER ================= */}

      <header
        className={`border-b border-gray-200/70 bg-white/90 backdrop-blur-xl ${darkHeader}`}
      >

        <div className="mx-auto flex h-[58px] max-w-7xl items-center justify-between px-5 lg:px-7">

          <Link href={backPath}>

            <Image
              src="/flowex-logo.png"
              alt="Flowex"
              width={120}
              height={34}
              priority
            />

          </Link>

          <div className="flex items-center gap-4">

            <div
              className={`hidden items-center gap-2 text-sm font-medium text-gray-500 sm:flex ${darkMuted}`}
            >
              <span>
                🔒
              </span>

              Secure Checkout
            </div>

            <Link
              href={backPath}
              className={`rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 ${
                isLoggedIn
                  ? "app-dark:border-slate-700 app-dark:bg-[#11161d] app-dark:text-slate-300 app-dark:hover:bg-slate-800"
                  : "dark:border-slate-700 dark:bg-[#11161d] dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              Back
            </Link>

          </div>

        </div>

      </header>

      {/* ================= CHECKOUT ================= */}

      <section className="relative px-4 py-4 sm:px-6 lg:h-[calc(100vh-58px)] lg:overflow-hidden lg:px-7 lg:py-4">

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-emerald-300/10 blur-3xl" />
          <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-indigo-400/10 blur-3xl" />
        </div>

        <div className="relative mx-auto flex h-full max-w-7xl flex-col">

          <div className="mb-3 flex shrink-0 items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-emerald-600">
                  Flowex Pro Checkout
                </p>
              </div>
              <h1 className={`mt-1 text-2xl font-black tracking-tight sm:text-[28px] ${darkTitle}`}>
                Start automating in minutes.
              </h1>
            </div>
            <p className={`hidden max-w-md text-right text-xs leading-5 text-gray-500 md:block ${darkMuted}`}>
              Choose your plan, confirm your account details, then complete payment securely with Lemon Squeezy.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="grid min-h-0 flex-1 items-stretch gap-4 lg:grid-cols-[1.28fr_0.72fr]">

            {/* ================= LEFT ================= */}
            <div className="grid min-h-0 gap-4 lg:grid-rows-[auto_1fr]">

              {/* PLAN */}
              <div className={`rounded-[22px] border border-gray-200 bg-white p-4 shadow-sm sm:p-5 ${darkCard}`}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">Step 1</p>
                    <h2 className={`mt-0.5 text-base font-bold ${darkTitle}`}>Choose your plan</h2>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 app-dark:bg-emerald-500/10 app-dark:text-emerald-400">
                    7 DAYS FREE
                  </span>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setBillingInterval("monthly")}
                    className={`group relative rounded-2xl border-2 p-3.5 text-left transition-all ${
                      billingInterval === "monthly"
                        ? "border-emerald-400 bg-gradient-to-br from-emerald-50 to-cyan-50/50 shadow-[0_8px_30px_rgba(16,185,129,0.10)] dark:bg-none dark:bg-emerald-500/5 app-dark:bg-none app-dark:bg-emerald-500/5"
                        : "border-gray-200 bg-white hover:border-gray-300 dark:border-slate-700 dark:bg-[#11161d] app-dark:border-slate-700 app-dark:bg-[#11161d]"
                    }`}
                  >
                    {billingInterval === "monthly" && <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-black text-white">✓</span>}
                    <div className="flex items-end justify-between gap-4 pr-6">
                      <div>
                        <h3 className={`text-base font-bold ${darkTitle}`}>Monthly</h3>
                        <p className={`mt-0.5 text-[11px] text-gray-500 ${darkMuted}`}>Flexible monthly billing</p>
                      </div>
                      <div className="text-right">
                        <span className="mr-1 text-xs text-gray-400 line-through">$25</span>
                        <span className={`text-2xl font-black ${darkTitle}`}>$15</span>
                        <span className={`text-[11px] text-gray-500 ${darkMuted}`}>/mo</span>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBillingInterval("annual")}
                    className={`group relative rounded-2xl border-2 p-3.5 text-left transition-all ${
                      billingInterval === "annual"
                        ? "border-indigo-400 bg-gradient-to-br from-cyan-50/60 to-indigo-50 shadow-[0_8px_30px_rgba(79,70,229,0.10)] dark:bg-none dark:bg-indigo-500/5 app-dark:bg-none app-dark:bg-indigo-500/5"
                        : "border-gray-200 bg-white hover:border-gray-300 dark:border-slate-700 dark:bg-[#11161d] app-dark:border-slate-700 app-dark:bg-[#11161d]"
                    }`}
                  >
                    <span className="absolute -top-2.5 left-3 rounded-full bg-gradient-to-r from-emerald-500 to-indigo-600 px-2.5 py-0.5 text-[9px] font-black text-white">BEST VALUE</span>
                    {billingInterval === "annual" && <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-[11px] font-black text-white">✓</span>}
                    <div className="flex items-end justify-between gap-4 pr-6">
                      <div>
                        <h3 className={`text-base font-bold ${darkTitle}`}>Annual</h3>
                        <p className={`mt-0.5 text-[11px] text-gray-500 ${darkMuted}`}>$120 billed yearly</p>
                      </div>
                      <div className="text-right">
                        <span className="mr-1 text-xs text-gray-400 line-through">$25</span>
                        <span className={`text-2xl font-black ${darkTitle}`}>$10</span>
                        <span className={`text-[11px] text-gray-500 ${darkMuted}`}>/mo</span>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* INFORMATION */}
              <div className={`flex min-h-0 flex-col rounded-[22px] border border-gray-200 bg-white p-4 shadow-sm sm:p-5 ${darkCard}`}>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">Step 2</p>
                  <h2 className={`mt-0.5 text-base font-bold ${darkTitle}`}>Your account details</h2>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="checkout-full-name" className={`text-xs font-semibold ${darkTitle}`}>Full name</label>
                    <input
                      id="checkout-full-name"
                      name="fullName"
                      type="text"
                      autoComplete="name"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      placeholder="Your name"
                      required
                      className={`mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 ${darkInput}`}
                    />
                  </div>

                  <div>
                    <label htmlFor="checkout-email" className={`text-xs font-semibold ${darkTitle}`}>Email</label>
                    <input
                      id="checkout-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      readOnly={isLoggedIn}
                      placeholder="you@company.com"
                      required
                      className={`mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 read-only:cursor-default read-only:opacity-70 ${darkInput}`}
                    />
                  </div>
                </div>

                <div className={`mt-3 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50/80 via-cyan-50/50 to-indigo-50/60 p-3 dark:border-emerald-500/15 dark:bg-none dark:bg-[#0b0f14] app-dark:border-emerald-500/15 app-dark:bg-none app-dark:bg-[#0b0f14]`}>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-sm shadow-sm dark:bg-slate-800 app-dark:bg-slate-800">🛡️</div>
                  <div>
                    <p className={`text-xs font-bold ${darkTitle}`}>Built for privacy. Your data stays yours.</p>
                    <p className={`mt-0.5 text-[11px] leading-4 text-gray-500 ${darkMuted}`}>
                      Flowex only keeps the account information needed to provide the service. Payment and billing details are handled securely by Lemon Squeezy — Flowex never stores your card details.
                    </p>
                  </div>
                </div>

                <div className={`mt-auto hidden items-center gap-5 pt-3 text-[11px] font-medium text-gray-400 sm:flex ${darkMuted}`}>
                  <span>✓ No card data stored</span>
                  <span>✓ Cancel anytime</span>
                  <span>✓ Secure billing</span>
                </div>
              </div>
            </div>

            {/* ================= SUMMARY ================= */}
            <aside className="min-h-0">
              <div className={`flex h-full flex-col rounded-[24px] border border-gray-200 bg-white p-4 shadow-[0_20px_60px_rgba(0,0,0,0.08)] sm:p-5 ${darkCard}`}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">Order Summary</p>
                  <span className="rounded-lg bg-gray-50 px-2 py-1 text-[10px] font-semibold text-gray-500 dark:bg-[#0b0f14] app-dark:bg-[#0b0f14]">🔒 Secure</span>
                </div>

                <div className="mt-3 rounded-2xl bg-gradient-to-br from-[#0f172a] via-[#172554] to-[#064e3b] p-4 text-white shadow-lg">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-300">Flowex Pro</p>
                      <h2 className="mt-1 text-xl font-black">Every lead. Automated.</h2>
                      <p className="mt-1 text-[11px] text-slate-300">7-day free trial included</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400 line-through">$25</p>
                      <p className="text-3xl font-black">{billingInterval === "monthly" ? "$15" : "$10"}</p>
                      <p className="text-[10px] text-slate-300">/month</p>
                    </div>
                  </div>
                </div>

                <div className={`mt-3 space-y-2 text-xs ${darkMuted}`}>
                  <div className="flex items-center justify-between">
                    <span>Due today</span><span className="font-bold text-emerald-600">$0.00</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>After trial</span><span className={`font-bold ${darkTitle}`}>{billingInterval === "monthly" ? "$15/month" : "$120/year"}</span>
                  </div>
                </div>

                <div className={`my-3 h-px bg-gray-100 ${isLoggedIn ? "app-dark:bg-slate-800" : "dark:bg-slate-800"}`} />

                <div className={`grid grid-cols-2 gap-x-3 gap-y-2 text-[11px] text-gray-600 ${darkMuted}`}>
                  <p>✓ Lead capture</p>
                  <p>✓ Instant replies</p>
                  <p>✓ Integrations</p>
                  <p>✓ Team alerts</p>
                  <p>✓ Follow-ups</p>
                  <p>✓ Live dashboard</p>
                </div>

                <div className="mt-auto pt-3">
                  <label htmlFor="checkout-terms" className="mb-2.5 flex cursor-pointer items-start gap-2.5">
                    <input
                      id="checkout-terms"
                      name="acceptedTerms"
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(event) => setAcceptedTerms(event.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[#4b52f7]"
                    />
                    <span className={`text-[10.5px] leading-4 text-gray-500 ${darkMuted}`}>
                      I agree to the{" "}
                      <Link href="/terms" target="_blank" className="font-semibold text-[#4b52f7] hover:underline">Terms of Service</Link>
                      {" "}and{" "}
                      <Link href="/privacy" target="_blank" className="font-semibold text-[#4b52f7] hover:underline">Privacy Policy</Link>, and authorize {billingInterval === "monthly" ? "$15/month" : "$120/year"} after my 7-day free trial unless cancelled beforehand.
                    </span>
                  </label>

                  {checkoutError && (
                    <div className="mb-2.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400 app-dark:border-red-500/30 app-dark:bg-red-500/10 app-dark:text-red-400">
                      {checkoutError}
                    </div>
                  )}

                  {isTrial ? (
                    <button type="submit" className="w-full rounded-xl bg-gray-100 py-2.5 text-sm font-bold text-gray-500 dark:bg-slate-800 dark:text-slate-300 app-dark:bg-slate-800 app-dark:text-slate-300">Trial Already Active</button>
                  ) : isPro ? (
                    <button type="submit" className="w-full rounded-xl bg-gray-100 py-2.5 text-sm font-bold text-gray-500 dark:bg-slate-800 dark:text-slate-300 app-dark:bg-slate-800 app-dark:text-slate-300">Manage Current Plan</button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isRedirecting}
                      className="w-full rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 py-2.5 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isRedirecting ? "Opening Secure Checkout..." : isLoggedIn ? "Start 7-Day Free Trial" : "Proceed"}
                    </button>
                  )}

                  <p className={`mt-2 text-center text-[10px] leading-4 text-gray-400 ${darkMuted}`}>
                    No charge today · Cancel before your trial ends
                  </p>
                </div>
              </div>
            </aside>
          </form>
        </div>
      </section>

      {/* ================= AUTH CHOICE ================= */}

      {showAuthChoice && (

        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm">

          <div
            className={`w-full max-w-md rounded-[24px] border border-gray-200 bg-white p-6 text-center shadow-2xl ${darkCard}`}
          >

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 text-xl text-white">
              🔒
            </div>

            <h2
              className={`mt-4 text-2xl font-black ${darkTitle}`}
            >
              Continue with Flowex
            </h2>

            <p
              className={`mt-2 text-sm leading-6 text-gray-500 ${darkMuted}`}
            >
              Your checkout details are saved. Log in or create an account to continue your order.
            </p>

            <div className="mt-5 grid gap-3">

              <button
                type="button"
                onClick={() =>
                  continueToAuth("login")
                }
                className="w-full rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 py-3 text-sm font-bold text-white shadow-md"
              >
                Log In
              </button>

              <button
                type="button"
                onClick={() =>
                  continueToAuth("signup")
                }
                className={`w-full rounded-xl border border-gray-200 bg-white py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50 ${
                  isLoggedIn
                    ? "app-dark:border-slate-700 app-dark:bg-[#0b0f14] app-dark:text-white"
                    : "dark:border-slate-700 dark:bg-[#0b0f14] dark:text-white"
                }`}
              >
                Create Account
              </button>

            </div>

            <button
              type="button"
              onClick={() =>
                setShowAuthChoice(false)
              }
              className={`mt-5 text-sm font-semibold text-gray-400 transition hover:text-gray-700 ${darkMuted}`}
            >
              Continue editing checkout
            </button>

          </div>

        </div>

      )}

    </main>
  );
}