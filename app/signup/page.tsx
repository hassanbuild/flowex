"use client";

import Image from "next/image";
import Link from "next/link";
import {
  FormEvent,
  useState,
} from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import RouteGuard from "@/components/RouteGuard";
import { createClient } from "@/lib/supabase/client";

const AUTH_RETURN_KEY =
  "flowex-auth-return-to";

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [showTerms, setShowTerms] =
    useState(false);

  const [fullName, setFullName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [acceptedTerms, setAcceptedTerms] =
    useState(false);

  const [passwordError, setPasswordError] =
    useState("");

  const [signupError, setSignupError] =
    useState("");

  const [signupSuccess, setSignupSuccess] =
    useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  /*
    ================= RETURN PATH =================

    Checkout sends:

    /signup?returnTo=/checkout

    Only approved Flowex destinations should be
    accepted as return paths.
  */

  const requestedReturnTo =
    searchParams.get("returnTo");

  const returnTo =
    requestedReturnTo === "/checkout"
      ? "/checkout"
      : null;

  /*
    Preserve Checkout if the customer switches
    from Signup to Login.
  */

  const loginPath =
    returnTo
      ? `/login?returnTo=${encodeURIComponent(
          returnTo
        )}`
      : "/login";

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setSignupError("");
    setSignupSuccess("");

    if (password !== confirmPassword) {
      setPasswordError(
        "Passwords do not match."
      );

      return;
    }

    setPasswordError("");

    if (!acceptedTerms) {
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase =
        createClient();

      /*
        If this signup started from Checkout,
        remember the destination.

        sessionStorage survives navigation within
        this browser tab but does not permanently
        store this checkout state.
      */

      if (returnTo) {
        sessionStorage.setItem(
          AUTH_RETURN_KEY,
          returnTo
        );
      } else {
        sessionStorage.removeItem(
          AUTH_RETURN_KEY
        );
      }

      const {
        data,
        error,
      } =
        await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name:
                fullName.trim(),
            },
          },
        });

      if (error) {
        setSignupError(
          error.message
        );

        return;
      }

      /*
        ================= IMMEDIATE SESSION =================

        Depending on Supabase auth configuration,
        signup may immediately create a session.

        If that happens and the customer came from
        Checkout, send them straight back there.
      */

      if (data.session) {
        if (returnTo) {
          router.replace(
            returnTo
          );

          router.refresh();

          return;
        }

        /*
          Normal signup with an immediate session
          follows the normal Flowex routing.
        */

        router.replace("/");
        router.refresh();

        return;
      }

      /*
        ================= EMAIL VERIFICATION =================

        Supabase requires the customer to verify
        their email before the account becomes
        authenticated.

        Keep them on the clean verification screen.

        If this started from Checkout, the Login
        button below preserves returnTo=/checkout.
      */

      setSignupSuccess(
        returnTo
          ? "Account created. Verify your email to continue checkout."
          : "Account created. Check your email to verify your Flowex account."
      );

      setFullName("");
      setPassword("");
      setConfirmPassword("");
      setAcceptedTerms(false);
      setShowTerms(false);
    } catch {
      setSignupError(
        "Something went wrong while creating your account. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RouteGuard access="guest">

      <main className="relative min-h-screen overflow-x-hidden bg-[#fbfcfd] text-gray-900 transition-colors duration-300 dark:bg-[#0b0f14] dark:text-slate-100">

        {/* ================= AMBIENT BACKGROUND ================= */}

        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">

          <div className="absolute -left-40 top-10 h-[420px] w-[420px] rounded-full bg-emerald-300/20 blur-[150px] dark:bg-emerald-500/10" />

          <div className="absolute right-[-120px] top-20 h-[420px] w-[420px] rounded-full bg-indigo-300/20 blur-[150px] dark:bg-indigo-500/10" />

          <div className="absolute left-1/2 top-[55%] h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-cyan-300/20 blur-[140px] dark:bg-cyan-500/10" />

        </div>

        {/* ================= TOP BAR ================= */}

        <div className="border-b border-gray-200/70 bg-white/80 backdrop-blur-xl dark:border-slate-800/80 dark:bg-[linear-gradient(90deg,#0b0f14_0%,#172033_8%,#252b70_25%,#006454_50%,#252b70_75%,#172033_92%,#0b0f14_100%)]">

          <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-6 lg:px-8">

            <Link href="/">
              <Image
                src="/flowex-logo.png"
                alt="Flowex"
                width={120}
                height={34}
                priority
              />
            </Link>

            <p className="text-sm text-gray-500 dark:text-slate-200">
              Already have an account?{" "}

              <Link
                href={loginPath}
                className="font-semibold text-gray-900 transition-colors hover:text-emerald-600 dark:text-white dark:hover:text-emerald-400"
              >
                Login
              </Link>
            </p>

          </div>

        </div>

        {/* ================= SIGNUP ================= */}

        <section className="flex min-h-[calc(100vh-68px)] items-center justify-center px-4 py-10 sm:px-6">

          <div className="w-full max-w-md">

            {!signupSuccess && (

              <div className="mb-5 text-center">

                <div className="flex items-center justify-center gap-1">

                  <h1 className="text-4xl font-black leading-none">
                    Create Your Account
                  </h1>

                </div>

                {returnTo && (

                  <p className="mt-3 text-sm text-gray-500 dark:text-slate-400">
                    Create your account to continue your Flowex checkout.
                  </p>

                )}

              </div>

            )}

            {signupSuccess ? (

              /* ================= VERIFY EMAIL ================= */

              <div className="rounded-[28px] border border-gray-200/80 bg-white/90 p-8 text-center shadow-[0_25px_70px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:border-slate-800 dark:bg-[#11161d]/95 dark:shadow-[0_25px_70px_rgba(0,0,0,0.35)]">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl dark:bg-emerald-500/10">
                  ✉️
                </div>

                <h1 className="mt-6 text-3xl font-black">
                  Check your email
                </h1>

                <p className="mt-3 text-sm leading-6 text-gray-500 dark:text-slate-400">
                  We sent a verification link to
                </p>

                <p className="mt-1 break-all text-sm font-bold text-gray-900 dark:text-white">
                  {email}
                </p>

                <p className="mt-4 text-sm leading-6 text-gray-500 dark:text-slate-400">

                  {returnTo
                    ? "Click the link in the email to verify your Flowex account. After verification, log in to continue your checkout."
                    : "Click the link in the email to verify your Flowex account. Once verified, Flowex will recognize your authenticated session."}

                </p>

                <Link
                  href={loginPath}
                  className="mt-7 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 py-3.5 font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                >
                  {returnTo
                    ? "Log In & Continue"
                    : "Back to Login"}
                </Link>

                <p className="mt-5 text-xs leading-5 text-gray-400 dark:text-slate-500">
                  Didn&apos;t receive it? Check your spam or junk folder.
                </p>

              </div>

            ) : (

              /* ================= SIGNUP FORM ================= */

              <div className="rounded-[28px] border border-gray-200/80 bg-white/90 p-7 shadow-[0_25px_70px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:border-slate-800 dark:bg-[#11161d]/95 dark:shadow-[0_25px_70px_rgba(0,0,0,0.35)]">

                <form
                  className="space-y-5"
                  onSubmit={handleSubmit}
                >

                  {/* ================= FULL NAME ================= */}

                  <div>

                    <label
                      htmlFor="fullName"
                      className="mb-2 block text-sm font-semibold text-gray-700 dark:text-slate-200"
                    >
                      Full name
                    </label>

                    <input
                      id="fullName"
                      type="text"
                      placeholder="Your name"
                      value={fullName}
                      onChange={(event) =>
                        setFullName(
                          event.target.value
                        )
                      }
                      required
                      autoComplete="name"
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-[#0b0f14] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/10"
                    />

                  </div>

                  {/* ================= EMAIL ================= */}

                  <div>

                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-semibold text-gray-700 dark:text-slate-200"
                    >
                      Email
                    </label>

                    <input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(event) =>
                        setEmail(
                          event.target.value
                        )
                      }
                      required
                      autoComplete="email"
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-[#0b0f14] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/10"
                    />

                  </div>

                  {/* ================= PASSWORD ================= */}

                  <div>

                    <label
                      htmlFor="password"
                      className="mb-2 block text-sm font-semibold text-gray-700 dark:text-slate-200"
                    >
                      Password
                    </label>

                    <input
                      id="password"
                      type="password"
                      placeholder="Create a password"
                      value={password}
                      onChange={(event) => {
                        setPassword(
                          event.target.value
                        );

                        if (passwordError) {
                          setPasswordError("");
                        }
                      }}
                      required
                      autoComplete="new-password"
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-[#0b0f14] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/10"
                    />

                  </div>

                  {/* ================= CONFIRM PASSWORD ================= */}

                  <div>

                    <label
                      htmlFor="confirmPassword"
                      className="mb-2 block text-sm font-semibold text-gray-700 dark:text-slate-200"
                    >
                      Confirm Password
                    </label>

                    <input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(event) => {
                        setConfirmPassword(
                          event.target.value
                        );

                        if (passwordError) {
                          setPasswordError("");
                        }
                      }}
                      required
                      autoComplete="new-password"
                      disabled={isSubmitting}
                      className={`w-full rounded-xl border bg-white px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#0b0f14] dark:text-white dark:placeholder:text-slate-500 ${
                        passwordError
                          ? "border-red-400 focus:border-red-400 focus:ring-red-100 dark:border-red-500 dark:focus:ring-red-500/10"
                          : "border-gray-200 focus:border-cyan-400 focus:ring-cyan-100 dark:border-slate-700 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/10"
                      }`}
                    />

                    {passwordError && (

                      <p className="mt-2 text-xs font-medium text-red-500">
                        {passwordError}
                      </p>

                    )}

                  </div>

                  {/* ================= TERMS + PRIVACY ================= */}

                  <div>

                    <button
                      type="button"
                      onClick={() =>
                        setShowTerms(
                          (current) =>
                            !current
                        )
                      }
                      aria-expanded={showTerms}
                      disabled={isSubmitting}
                      className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-left transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-[#0b0f14] dark:hover:bg-slate-900"
                    >

                      <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">
                        Terms & Privacy
                      </span>

                      <span className="text-xs font-semibold text-[#4b52f7] dark:text-[#7c83ff]">
                        {showTerms
                          ? "Hide ↑"
                          : "Show ↓"}
                      </span>

                    </button>

                    {showTerms && (

                      <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm leading-6 text-gray-600 dark:border-slate-700 dark:bg-[#0b0f14] dark:text-slate-300">

                        <p className="font-semibold text-gray-900 dark:text-white">
                          Terms of Service
                        </p>

                        <p className="mt-2">
                          By creating a Flowex account, you agree to use the service responsibly,
                          provide accurate account information, and comply with applicable laws.
                          You are responsible for how you configure your automations and for the
                          lead information processed through your account.
                        </p>

                        <p className="mt-4 font-semibold text-gray-900 dark:text-white">
                          Privacy Policy
                        </p>

                        <p className="mt-2">
                          Flowex may collect and process account information, automation settings,
                          lead data, support information, and other information needed to operate
                          the service. Flowex does not sell your personal information.
                        </p>

                        <p className="mt-4">
                          Read the full{" "}

                          <Link
                            href="/terms"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-[#4b52f7] hover:underline dark:text-[#7c83ff]"
                          >
                            Terms of Service
                          </Link>{" "}

                          and{" "}

                          <Link
                            href="/privacy"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-[#4b52f7] hover:underline dark:text-[#7c83ff]"
                          >
                            Privacy Policy
                          </Link>
                          .
                        </p>

                      </div>

                    )}

                    <label className="mt-4 flex cursor-pointer items-start gap-3">

                      <input
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={(event) =>
                          setAcceptedTerms(
                            event.target.checked
                          )
                        }
                        required
                        disabled={isSubmitting}
                        className="mt-1 h-4 w-4 cursor-pointer accent-[#4b52f7] disabled:cursor-not-allowed"
                      />

                      <span className="text-sm text-gray-500 dark:text-slate-400">
                        I have read and agree to the Terms of Service and Privacy Policy.
                      </span>

                    </label>

                  </div>

                  {/* ================= SIGNUP ERROR ================= */}

                  {signupError && (

                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                      {signupError}
                    </div>

                  )}

                  {/* ================= CREATE ACCOUNT ================= */}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 py-3.5 font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                  >
                    {isSubmitting
                      ? "Creating Account..."
                      : returnTo
                        ? "Create Account & Continue"
                        : "Create Account"}
                  </button>

                </form>

                {/* ================= DIVIDER ================= */}

                <div className="my-6 flex items-center gap-4">

                  <div className="h-px flex-1 bg-gray-200 dark:bg-slate-700" />

                  <span className="text-xs uppercase tracking-wider text-gray-400 dark:text-slate-500">
                    or
                  </span>

                  <div className="h-px flex-1 bg-gray-200 dark:bg-slate-700" />

                </div>

                {/* ================= GOOGLE ================= */}

                <button
                  type="button"
                  className="w-full rounded-xl border border-gray-200 bg-white py-3.5 font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-slate-700 dark:bg-[#0b0f14] dark:text-slate-200 dark:hover:bg-slate-900"
                >
                  Continue with Google
                </button>

                <p className="mt-6 text-center text-xs leading-5 text-gray-400 dark:text-slate-500">
                  By creating an account, you agree to Flowex&apos;s Terms and Privacy Policy.
                </p>

              </div>

            )}

          </div>

        </section>

      </main>

    </RouteGuard>
  );
}