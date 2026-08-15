"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAppAccount } from "@/components/AppAccountProvider";

type CheckoutDraft = {
  fullName: string;
  email: string;
  phone: string;
  country: string;
  company: string;
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

  const [phone, setPhone] =
    useState("");

  const [country, setCountry] =
    useState("");

  const [company, setCompany] =
    useState("");

  const [acceptedTerms, setAcceptedTerms] =
    useState(false);

  const [draftLoaded, setDraftLoaded] =
    useState(false);

  const [showAuthChoice, setShowAuthChoice] =
    useState(false);

  const [checkoutError, setCheckoutError] =
    useState("");

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

        setPhone(
          draft.phone || ""
        );

        setCountry(
          draft.country || ""
        );

        setCompany(
          draft.company || ""
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
      phone,
      country,
      company,
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

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setCheckoutError("");

    if (
      !fullName.trim() ||
      !email.trim() ||
      !country.trim()
    ) {
      setCheckoutError(
        "Please complete the required billing information."
      );

      return;
    }

    if (!acceptedTerms) {
      setCheckoutError(
        "Please accept the subscription terms before continuing."
      );

      return;
    }

    /*
      ================= GUEST =================

      Save checkout and let the customer choose
      Login or Create Account.

      Card details are intentionally not collected
      before authentication and are never stored in
      sessionStorage/localStorage.
    */

    if (!isLoggedIn) {
      saveDraft();
      setShowAuthChoice(true);

      return;
    }

    /*
      ================= TRIAL =================

      Trial users already have Pro access.
    */

    if (isTrial) {
      router.push("/billing");
      return;
    }

    /*
      ================= PRO =================

      Pro users should manage their existing
      subscription instead of purchasing again.
    */

    if (isPro) {
      router.push("/billing");
      return;
    }

    /*
      ================= FREE =================

      Stripe payment/session creation will replace
      this development placeholder.

      The future backend will create a secure payment
      session and the Stripe Payment Element will
      collect card information.
    */

    alert(
      "Checkout is ready. Secure payment processing will be connected next."
    );
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
      className={`min-h-screen bg-[#f8fafc] text-gray-900 transition-colors duration-300 ${darkMain}`}
    >

      {/* ================= HEADER ================= */}

      <header
        className={`border-b border-gray-200/70 bg-white/90 backdrop-blur-xl ${darkHeader}`}
      >

        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-6 lg:px-8">

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

      <section className="px-4 py-6 sm:px-6 lg:px-8">

        <div className="mx-auto max-w-7xl">

          <div className="mb-5">

            <p className="text-sm font-semibold text-emerald-600">
              CHECKOUT
            </p>

            <h1
              className={`mt-1 text-3xl font-black sm:text-[34px] ${darkTitle}`}
            >
              Complete your order.
            </h1>

            <p
              className={`mt-1.5 text-sm text-gray-500 ${darkMuted}`}
            >
              Start your Flowex Pro trial and automate your lead workflow.
            </p>

          </div>

          <form
            onSubmit={handleSubmit}
            className="grid items-start gap-5 lg:grid-cols-[1.32fr_0.68fr]"
          >

            {/* ================= LEFT ================= */}

            <div className="space-y-4">

              {/* PLAN */}

              <div
                className={`rounded-[22px] border border-gray-200 bg-white p-5 shadow-sm sm:p-6 ${darkCard}`}
              >

                <div>

                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">
                    Step 1
                  </p>

                  <h2
                    className={`mt-1.5 text-lg font-bold ${darkTitle}`}
                  >
                    Choose your plan
                  </h2>

                </div>

                <div className="mt-4 rounded-2xl border-2 border-emerald-400 bg-emerald-50/50 p-4 dark:bg-emerald-500/5 app-dark:bg-emerald-500/5">

                  <div className="flex items-start justify-between gap-4">

                    <div className="flex gap-3">

                      <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-emerald-500">

                        <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

                      </div>

                      <div>

                        <div className="flex flex-wrap items-center gap-2">

                          <h3
                            className={`text-lg font-bold ${darkTitle}`}
                          >
                            Flowex Pro
                          </h3>

                          <span className="rounded-full bg-gradient-to-r from-emerald-500 to-indigo-600 px-3 py-1 text-[11px] font-bold text-white">
                            33% OFF
                          </span>

                        </div>

                        <p
                          className={`mt-1 text-xs leading-5 text-gray-500 ${darkMuted}`}
                        >
                          Complete lead capture automation with everything included.
                        </p>

                      </div>

                    </div>

                    <div className="shrink-0 text-right">

                      <p className="text-sm text-gray-400 line-through">
                        $15
                      </p>

                      <p
                        className={`text-2xl font-black ${darkTitle}`}
                      >
                        $10
                      </p>

                      <p
                        className={`text-xs text-gray-500 ${darkMuted}`}
                      >
                        /month
                      </p>

                    </div>

                  </div>

                </div>

              </div>

              {/* INFORMATION */}

              <div
                className={`rounded-[22px] border border-gray-200 bg-white p-5 shadow-sm sm:p-6 ${darkCard}`}
              >

                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">
                  Step 2
                </p>

                <h2
                  className={`mt-1.5 text-lg font-bold ${darkTitle}`}
                >
                  Your information
                </h2>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">

                  <div>

                    <label className="text-sm font-semibold">
                      Full name
                    </label>

                    <input
                      type="text"
                      value={fullName}
                      onChange={(event) =>
                        setFullName(
                          event.target.value
                        )
                      }
                      placeholder="Your name"
                      required
                      className={`mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 ${darkInput}`}
                    />

                  </div>

                  <div>

                    <label className="text-sm font-semibold">
                      Email
                    </label>

                    <input
                      type="email"
                      value={email}
                      onChange={(event) =>
                        setEmail(
                          event.target.value
                        )
                      }
                      readOnly={isLoggedIn}
                      placeholder="you@company.com"
                      required
                      className={`mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 read-only:cursor-default read-only:opacity-70 ${darkInput}`}
                    />

                  </div>

                  <div>

                    <label className="text-sm font-semibold">
                      Phone
                      <span className="ml-1 font-normal text-gray-400">
                        optional
                      </span>
                    </label>

                    <input
                      type="tel"
                      value={phone}
                      onChange={(event) =>
                        setPhone(
                          event.target.value
                        )
                      }
                      placeholder="+1 555 123 4567"
                      className={`mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 ${darkInput}`}
                    />

                  </div>

                  <div>

                    <label className="text-sm font-semibold">
                      Country
                    </label>

                    <input
                      type="text"
                      value={country}
                      onChange={(event) =>
                        setCountry(
                          event.target.value
                        )
                      }
                      placeholder="Country"
                      required
                      className={`mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 ${darkInput}`}
                    />

                  </div>

                </div>

                <div className="mt-4">

                  <label className="text-sm font-semibold">
                    Company
                    <span className="ml-1 font-normal text-gray-400">
                      optional
                    </span>
                  </label>

                  <input
                    type="text"
                    value={company}
                    onChange={(event) =>
                      setCompany(
                        event.target.value
                      )
                    }
                    placeholder="Company name"
                    className={`mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 ${darkInput}`}
                  />

                </div>

              </div>

              {/* PAYMENT */}

              <div
                className={`rounded-[22px] border border-gray-200 bg-white p-5 shadow-sm sm:p-6 ${darkCard}`}
              >

                <div className="flex items-start justify-between gap-4">

                  <div>

                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">
                      Step 3
                    </p>

                    <h2
                      className={`mt-1.5 text-lg font-bold ${darkTitle}`}
                    >
                      Payment method
                    </h2>

                  </div>

                  <div
                    className={`rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-500 ${
                      isLoggedIn
                        ? "app-dark:border-slate-700 app-dark:text-slate-400"
                        : "dark:border-slate-700 dark:text-slate-400"
                    }`}
                  >
                    🔒 Secure
                  </div>

                </div>

                <div className="mt-4 rounded-2xl border-2 border-emerald-400 p-4">

                  <div className="flex items-center justify-between gap-4">

                    <div className="flex items-center gap-3">

                      <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-emerald-500">

                        <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

                      </div>

                      <div>

                        <p
                          className={`font-semibold ${darkTitle}`}
                        >
                          Credit or Debit Card
                        </p>

                        <p
                          className={`mt-1 text-xs text-gray-400 ${darkMuted}`}
                        >
                          Visa, Mastercard and supported cards
                        </p>

                      </div>

                    </div>

                    <span className="text-xl">
                      💳
                    </span>

                  </div>

                </div>

                {/* STRIPE PLACEHOLDER */}

                <div
                  className={`mt-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 ${
                    isLoggedIn
                      ? "app-dark:border-slate-700 app-dark:bg-[#0b0f14]"
                      : "dark:border-slate-700 dark:bg-[#0b0f14]"
                  }`}
                >

                  <div className="grid gap-3">

                    <div>

                      <label className="text-xs font-semibold text-gray-500">
                        Card number
                      </label>

                      <div
                        className={`mt-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-400 ${
                          isLoggedIn
                            ? "app-dark:border-slate-700 app-dark:bg-[#11161d]"
                            : "dark:border-slate-700 dark:bg-[#11161d]"
                        }`}
                      >
                        Secure card field
                      </div>

                    </div>

                    <div className="grid grid-cols-2 gap-4">

                      <div>

                        <label className="text-xs font-semibold text-gray-500">
                          Expiry
                        </label>

                        <div
                          className={`mt-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-400 ${
                            isLoggedIn
                              ? "app-dark:border-slate-700 app-dark:bg-[#11161d]"
                              : "dark:border-slate-700 dark:bg-[#11161d]"
                          }`}
                        >
                          MM / YY
                        </div>

                      </div>

                      <div>

                        <label className="text-xs font-semibold text-gray-500">
                          CVC
                        </label>

                        <div
                          className={`mt-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-400 ${
                            isLoggedIn
                              ? "app-dark:border-slate-700 app-dark:bg-[#11161d]"
                              : "dark:border-slate-700 dark:bg-[#11161d]"
                          }`}
                        >
                          •••
                        </div>

                      </div>

                    </div>

                  </div>

                  <p
                    className={`mt-3 text-xs leading-5 text-gray-400 ${darkMuted}`}
                  >
                    Secure card entry will be enabled through the payment processor.
                    Flowex will not store raw card details.
                  </p>

                </div>

              </div>

              {/* TERMS */}

              <div
                className={`rounded-[22px] border border-gray-200 bg-white p-5 shadow-sm sm:p-6 ${darkCard}`}
              >

                <label className="flex cursor-pointer items-start gap-2.5">

                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(event) =>
                      setAcceptedTerms(
                        event.target.checked
                      )
                    }
                    className="mt-1 h-4 w-4 cursor-pointer accent-[#4b52f7]"
                  />

                  <span
                    className={`text-xs leading-5 text-gray-500 ${darkMuted}`}
                  >
                    I agree to the{" "}

                    <Link
                      href="/terms"
                      target="_blank"
                      className="font-semibold text-[#4b52f7] hover:underline"
                    >
                      Terms of Service
                    </Link>

                    ,{" "}

                    <Link
                      href="/privacy"
                      target="_blank"
                      className="font-semibold text-[#4b52f7] hover:underline"
                    >
                      Privacy Policy
                    </Link>

                    , and authorize Flowex to charge
                    $10/month after my 7-day free trial unless
                    I cancel beforehand.
                  </span>

                </label>

                {checkoutError && (

                  <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400 app-dark:border-red-500/30 app-dark:bg-red-500/10 app-dark:text-red-400">
                    {checkoutError}
                  </div>

                )}

              </div>

            </div>

            {/* ================= SUMMARY ================= */}

            <aside className="lg:sticky lg:top-4">

              <div
                className={`rounded-[24px] border border-gray-200 bg-white p-5 shadow-[0_20px_60px_rgba(0,0,0,0.08)] sm:p-6 ${darkCard}`}
              >

                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">
                  Order Summary
                </p>

                <div className="mt-4 flex items-start justify-between gap-4">

                  <div>

                    <h2
                      className={`text-lg font-black ${darkTitle}`}
                    >
                      Flowex Pro
                    </h2>

                    <p
                      className={`mt-1 text-xs leading-5 text-gray-500 ${darkMuted}`}
                    >
                      Monthly subscription
                    </p>

                  </div>

                  <div className="text-right">

                    <p className="text-sm text-gray-400 line-through">
                      $15
                    </p>

                    <p
                      className={`text-2xl font-black ${darkTitle}`}
                    >
                      $10
                    </p>

                    <p
                      className={`text-xs text-gray-400 ${darkMuted}`}
                    >
                      /month
                    </p>

                  </div>

                </div>

                <div
                  className={`my-4 h-px bg-gray-100 ${
                    isLoggedIn
                      ? "app-dark:bg-slate-800"
                      : "dark:bg-slate-800"
                  }`}
                />

                <div className="space-y-2.5 text-sm">

                  <div className="flex items-center justify-between">

                    <span
                      className={`text-gray-500 ${darkMuted}`}
                    >
                      7-Day Free Trial
                    </span>

                    <span className="font-semibold text-emerald-600">
                      Included
                    </span>

                  </div>

                  <div className="flex items-center justify-between">

                    <span
                      className={`text-gray-500 ${darkMuted}`}
                    >
                      Due today
                    </span>

                    <span
                      className={`font-bold ${darkTitle}`}
                    >
                      $0.00
                    </span>

                  </div>

                  <div className="flex items-center justify-between">

                    <span
                      className={`text-gray-500 ${darkMuted}`}
                    >
                      After trial
                    </span>

                    <span
                      className={`font-bold ${darkTitle}`}
                    >
                      $10/month
                    </span>

                  </div>

                </div>

                <div
                  className={`my-4 h-px bg-gray-100 ${
                    isLoggedIn
                      ? "app-dark:bg-slate-800"
                      : "dark:bg-slate-800"
                  }`}
                />

                <div
                  className={`grid gap-2 text-sm text-gray-600 sm:grid-cols-2 lg:grid-cols-1 ${darkMuted}`}
                >

                  <p>
                    ✓ Unlimited Leads
                  </p>

                  <p>
                    ✓ Instant Customer Replies
                  </p>

                  <p>
                    ✓ Lead Storage & Integrations
                  </p>

                  <p>
                    ✓ Team Notifications
                  </p>

                  <p>
                    ✓ Automatic Follow-Ups
                  </p>

                  <p>
                    ✓ Live Dashboard
                  </p>

                </div>

                <div
                  className={`my-4 h-px bg-gray-100 ${
                    isLoggedIn
                      ? "app-dark:bg-slate-800"
                      : "dark:bg-slate-800"
                  }`}
                />

                {isTrial ? (

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-gray-100 py-3 text-sm font-bold text-gray-500 transition dark:bg-slate-800 dark:text-slate-300 app-dark:bg-slate-800 app-dark:text-slate-300"
                  >
                    Trial Already Active
                  </button>

                ) : isPro ? (

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-gray-100 py-3 text-sm font-bold text-gray-500 transition dark:bg-slate-800 dark:text-slate-300 app-dark:bg-slate-800 app-dark:text-slate-300"
                  >
                    Manage Current Plan
                  </button>

                ) : (

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5"
                  >
                    {isLoggedIn
                      ? "Start 7-Day Free Trial"
                      : "Proceed"}
                  </button>

                )}

                <p
                  className={`mt-3 text-center text-xs leading-5 text-gray-400 ${darkMuted}`}
                >
                  You won&apos;t be charged today.
                  Cancel anytime before your trial ends.
                </p>

                <div
                  className={`mt-3 rounded-xl bg-gray-50 p-2.5 text-center text-xs text-gray-400 ${
                    isLoggedIn
                      ? "app-dark:bg-[#0b0f14] app-dark:text-slate-500"
                      : "dark:bg-[#0b0f14] dark:text-slate-500"
                  }`}
                >
                  🔒 Secure checkout
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