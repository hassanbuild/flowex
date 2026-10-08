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

        setFullName(draft.fullName || "");
        setEmail(draft.email || "");





        setAcceptedTerms(
          draft.acceptedTerms || false
        );
      } catch {
        sessionStorage.removeItem(
          CHECKOUT_DRAFT_KEY
        );
      }
    }

    setDraftLoaded(true);
  }, [
    authReady,
    isLoggedIn,
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
          email: email.trim(),
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
      <main className="min-h-screen bg-background app-dark:bg-surface" />
    );
  }

  const darkMain =
    isLoggedIn
      ? "app-dark:bg-surface app-dark:text-gray-100"
      : "app-dark:bg-surface app-dark:text-gray-100";

  const darkHeader =
    isLoggedIn
      ? "app-dark:border-border-subtle/80 app-dark:bg-surface"
      : "app-dark:border-border-subtle/80 app-dark:bg-surface";

  const darkCard =
    isLoggedIn
      ? "app-dark:border-border-subtle app-dark:bg-surface"
      : "app-dark:border-border-subtle app-dark:bg-surface";

  const darkInput =
    isLoggedIn
      ? "app-dark:border-border-subtle app-dark:bg-surface app-dark:text-gray-100 app-dark:placeholder:text-muted"
      : "app-dark:border-border-subtle app-dark:bg-surface app-dark:text-gray-100 app-dark:placeholder:text-muted";

  const darkMuted =
    isLoggedIn
      ? "app-dark:text-muted"
      : "app-dark:text-muted";

  const darkTitle =
    isLoggedIn
      ? "app-dark:text-gray-100"
      : "app-dark:text-gray-100";

  const backPath =
    !isLoggedIn
      ? "/"
      : plan === "free"
        ? "/home"
        : "/dashboard";

  return (
    <main
      className={`min-h-screen bg-background text-foreground transition-colors duration-300 lg:h-screen lg:overflow-hidden ${darkMain}`}
    >

      {/* ================= HEADER ================= */}

      <header
        className={`border-b border-border-subtle/70 bg-white/90 backdrop-blur-xl ${darkHeader}`}
      >

        <div className="mx-auto flex h-[58px] max-w-7xl items-center justify-between px-5 lg:px-7">

          <Link href={backPath}>

            <Image
              src="/flowex-logo-brand.png"
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
              className={`rounded-xl border border-border-subtle bg-white px-4 py-2 text-sm font-semibold text-muted transition hover:bg-gray-50 ${
                isLoggedIn
                  ? "app-dark:border-border-subtle app-dark:bg-surface app-dark:text-muted app-dark:hover:bg-surface"
                  : "app-dark:border-border-subtle app-dark:bg-surface app-dark:text-muted app-dark:hover:bg-surface"
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
          <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-transparent blur-3xl" />
          <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-transparent blur-3xl" />
        </div>

        <div className="relative mx-auto flex h-full max-w-7xl flex-col">

          <div className="mb-3 flex shrink-0 items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-surface-subtle" />
                <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-brand-primary">
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
              <div className={`rounded-[22px] border border-border-subtle bg-white p-4 shadow-sm sm:p-5 ${darkCard}`}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">Step 1</p>
                    <h2 className={`mt-0.5 text-base font-bold ${darkTitle}`}>Choose your plan</h2>
                  </div>
                  <span className="rounded-full bg-surface-subtle px-3 py-1 text-[10px] font-bold text-brand-primary app-dark:bg-surface-subtle/10 app-dark:text-brand-primary app-dark:bg-surface-subtle/10 app-dark:text-brand-primary">
                    7 DAYS FREE
                  </span>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setBillingInterval("monthly")}
                    className={`group relative rounded-2xl border-2 p-3.5 text-left transition-all ${
                      billingInterval === "monthly"
                        ? "border-border-subtle bg-surface   shadow-sm app-dark:bg-none app-dark:bg-surface-subtle/5 app-dark:bg-none app-dark:bg-surface-subtle/5"
                        : "border-border-subtle bg-white hover:border-border-subtle app-dark:border-border-subtle app-dark:bg-surface app-dark:border-border-subtle app-dark:bg-surface"
                    }`}
                  >
                    {billingInterval === "monthly" && <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-surface-subtle text-[11px] font-black text-brand-primary">✓</span>}
                    <div className="flex items-end justify-between gap-4 pr-6">
                      <div>
                        <h3 className={`text-base font-bold ${darkTitle}`}>Monthly</h3>
                        <p className={`mt-0.5 text-[11px] text-gray-500 ${darkMuted}`}>Flexible monthly billing</p>
                      </div>
                      <div className="text-right">
                        <span className="mr-1 text-xs text-muted line-through">$25</span>
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
                        ? "border-border-subtle bg-surface   shadow-sm app-dark:bg-none app-dark:bg-surface-subtle/5 app-dark:bg-none app-dark:bg-surface-subtle/5"
                        : "border-border-subtle bg-white hover:border-border-subtle app-dark:border-border-subtle app-dark:bg-surface app-dark:border-border-subtle app-dark:bg-surface"
                    }`}
                  >
                    <span className="absolute -top-2.5 left-3 rounded-full bg-brand-primary   px-2.5 py-0.5 text-[9px] font-black text-gray-100">BEST VALUE</span>
                    {billingInterval === "annual" && <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-surface-subtle text-[11px] font-black text-brand-primary">✓</span>}
                    <div className="flex items-end justify-between gap-4 pr-6">
                      <div>
                        <h3 className={`text-base font-bold ${darkTitle}`}>Annual</h3>
                        <p className={`mt-0.5 text-[11px] text-gray-500 ${darkMuted}`}>$120 billed yearly</p>
                      </div>
                      <div className="text-right">
                        <span className="mr-1 text-xs text-muted line-through">$25</span>
                        <span className={`text-2xl font-black ${darkTitle}`}>$10</span>
                        <span className={`text-[11px] text-gray-500 ${darkMuted}`}>/mo</span>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* INFORMATION */}
              <div className={`flex min-h-0 flex-col rounded-[22px] border border-border-subtle bg-white p-4 shadow-sm sm:p-5 ${darkCard}`}>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">Step 2</p>
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
                      className={`mt-1.5 w-full rounded-xl border border-border-subtle bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/20 ${darkInput}`}
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
                      placeholder="you@company.com"
                      required
                      className={`mt-1.5 w-full rounded-xl border border-border-subtle bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/20 ${darkInput}`}
                    />
                  </div>
                </div>

                <div className={`mt-3 flex items-start gap-3 rounded-2xl border border-border-subtle bg-surface    p-3 app-dark:border-border-subtle/15 app-dark:bg-none app-dark:bg-surface app-dark:border-border-subtle/15 app-dark:bg-none app-dark:bg-surface`}>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-sm shadow-sm app-dark:bg-surface">🛡️</div>
                  <div>
                    <p className={`text-xs font-bold ${darkTitle}`}>Built for privacy. Your data stays yours.</p>
                    <p className={`mt-0.5 text-[11px] leading-4 text-gray-500 ${darkMuted}`}>
                      Flowex only keeps the account information needed to provide the service. Payment and billing details are handled securely by Lemon Squeezy — Flowex never stores your card details.
                    </p>
                  </div>
                </div>

                <div className={`mt-auto hidden items-center gap-5 pt-3 text-[11px] font-medium text-muted sm:flex ${darkMuted}`}>
                  <span>✓ No card data stored</span>
                  <span>✓ Cancel anytime</span>
                  <span>✓ Secure billing</span>
                </div>
              </div>
            </div>

            {/* ================= SUMMARY ================= */}
            <aside className="min-h-0">
              <div className={`flex h-full flex-col rounded-[24px] border border-border-subtle bg-white p-4 shadow-sm sm:p-5 ${darkCard}`}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">Order Summary</p>
                  <span className="rounded-lg bg-gray-50 px-2 py-1 text-[10px] font-semibold text-gray-500 app-dark:bg-surface">🔒 Secure</span>
                </div>

                <div className="mt-3 rounded-2xl bg-surface    p-4 text-brand-primary shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-primary">Flowex Pro</p>
                      <h2 className="mt-1 text-xl font-black">Every lead. Automated.</h2>
                      <p className="mt-1 text-[11px] text-muted">7-day free trial included</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted line-through">$25</p>
                      <p className="text-3xl font-black">{billingInterval === "monthly" ? "$15" : "$10"}</p>
                      <p className="text-[10px] text-muted">/month</p>
                    </div>
                  </div>
                </div>

                <div className={`mt-3 space-y-2 text-xs ${darkMuted}`}>
                  <div className="flex items-center justify-between">
                    <span>Due today</span><span className="font-bold text-brand-primary">$0.00</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>After trial</span><span className={`font-bold ${darkTitle}`}>{billingInterval === "monthly" ? "$15/month" : "$120/year"}</span>
                  </div>
                </div>

                <div className={`my-3 h-px bg-gray-100 ${isLoggedIn ? "app-dark:bg-surface" : "app-dark:bg-surface"}`} />

                <div className={`grid grid-cols-2 gap-x-3 gap-y-2 text-[11px] text-muted ${darkMuted}`}>
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
                      className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-brand-primary"
                    />
                    <span className={`text-[10.5px] leading-4 text-gray-500 ${darkMuted}`}>
                      I agree to the{" "}
                      <Link href="/terms" target="_blank" className="font-semibold text-brand-primary hover:underline">Terms of Service</Link>
                      {" "}and{" "}
                      <Link href="/privacy" target="_blank" className="font-semibold text-brand-primary hover:underline">Privacy Policy</Link>, and authorize {billingInterval === "monthly" ? "$15/month" : "$120/year"} after my 7-day free trial unless cancelled beforehand.
                    </span>
                  </label>

                  {checkoutError && (
                    <div className="mb-2.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 app-dark:border-red-500/30 app-dark:bg-red-500/10 app-dark:text-red-400 app-dark:border-red-500/30 app-dark:bg-red-500/10 app-dark:text-red-400">
                      {checkoutError}
                    </div>
                  )}

                  {isTrial ? (
                    <button type="submit" className="w-full rounded-xl bg-gray-100 py-2.5 text-sm font-bold text-gray-500 app-dark:bg-surface app-dark:text-muted app-dark:bg-surface app-dark:text-muted">Trial Already Active</button>
                  ) : isPro ? (
                    <button type="submit" className="w-full rounded-xl bg-gray-100 py-2.5 text-sm font-bold text-gray-500 app-dark:bg-surface app-dark:text-muted app-dark:bg-surface app-dark:text-muted">Manage Current Plan</button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isRedirecting}
                      className="w-full rounded-xl bg-brand-primary    py-2.5 text-sm font-bold text-gray-100 shadow-sm transition hover:-translate-y-0.5 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isRedirecting ? "Opening Secure Checkout..." : isLoggedIn ? "Start 7-Day Free Trial" : "Proceed"}
                    </button>
                  )}

                  <p className={`mt-2 text-center text-[10px] leading-4 text-muted ${darkMuted}`}>
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

        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-4 py-4 backdrop-blur-sm">

          <div
            className={`max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-[24px] border border-border-subtle bg-white p-5 text-center shadow-md sm:p-6 ${darkCard}`}
          >

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary    text-xl text-gray-100">
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
                className="w-full rounded-xl bg-brand-primary    py-3 text-sm font-bold text-gray-100 shadow-md"
              >
                Log In
              </button>

              <button
                type="button"
                onClick={() =>
                  continueToAuth("signup")
                }
                className={`w-full rounded-xl border border-border-subtle bg-white py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50 ${
                  isLoggedIn
                    ? "app-dark:border-border-subtle app-dark:bg-surface app-dark:text-gray-100"
                    : "app-dark:border-border-subtle app-dark:bg-surface app-dark:text-gray-100"
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
              className={`mt-5 text-sm font-semibold text-muted transition hover:text-gray-700 ${darkMuted}`}
            >
              Continue editing checkout
            </button>

          </div>

        </div>

      )}

    </main>
  );
}
