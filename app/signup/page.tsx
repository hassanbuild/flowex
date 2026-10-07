"use client";

import Image from "next/image";
import Link from "next/link";
import {
  FormEvent,
  Suspense,
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

function SignupPageContent() {
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

  const [isGoogleLoading, setIsGoogleLoading] =
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

  const handleGoogleSignup = async () => {
    if (isSubmitting || isGoogleLoading) {
      return;
    }

    setSignupError("");
    setPasswordError("");
    setIsGoogleLoading(true);

    try {
      const supabase =
        createClient();

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

      const redirectPath =
        returnTo || "/";

      const { error } =
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo:
              `${window.location.origin}${redirectPath}`,
          },
        });

      if (error) {
        setSignupError(error.message);
        setIsGoogleLoading(false);
      }
    } catch {
      setSignupError(
        "Something went wrong while connecting to Google. Please try again."
      );
      setIsGoogleLoading(false);
    }
  };

  return (
    <RouteGuard access="guest">

      <main className="relative min-h-screen overflow-x-hidden bg-background text-foreground transition-colors duration-300 app-dark:bg-surface app-dark:text-gray-100">

        {/* ================= AMBIENT BACKGROUND ================= */}

        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">

          <div className="absolute -left-40 top-10 h-[420px] w-[420px] rounded-full bg-transparent blur-[150px] app-dark:bg-surface-subtle/10" />

          <div className="absolute right-[-120px] top-20 h-[420px] w-[420px] rounded-full bg-transparent blur-[150px] app-dark:bg-surface-subtle/10" />

          <div className="absolute left-1/2 top-[55%] h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-transparent blur-[140px] app-dark:bg-surface-subtle/10" />

        </div>

        {/* ================= TOP BAR ================= */}

        <div className="border-b border-border-subtle/70 bg-white/80 backdrop-blur-xl app-dark:border-border-subtle/80 app-dark:bg-surface">

          <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-6 lg:px-8">

            <Link href="/">
              <Image
                src="/flowex-logo-brand.png"
                alt="Flowex"
                width={120}
                height={34}
                priority
              />
            </Link>

            <p className="text-sm text-gray-500 app-dark:text-gray-100">
              Already have an account?{" "}

              <Link
                href={loginPath}
                className="font-semibold text-foreground transition-colors hover:text-brand-primary app-dark:text-gray-100 app-dark:hover:text-brand-primary"
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

                  <p className="mt-3 text-sm text-gray-500 app-dark:text-muted">
                    Create your account to continue your Flowex checkout.
                  </p>

                )}

              </div>

            )}

            {signupSuccess ? (

              /* ================= VERIFY EMAIL ================= */

              <div className="rounded-[28px] border border-border-subtle/80 bg-white/90 p-8 text-center  backdrop-blur-xl app-dark:border-border-subtle app-dark:bg-surface/95 ">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-surface-subtle text-3xl app-dark:bg-surface-subtle/10">
                  ✉️
                </div>

                <h1 className="mt-6 text-3xl font-black">
                  Check your email
                </h1>

                <p className="mt-3 text-sm leading-6 text-gray-500 app-dark:text-muted">
                  We sent a verification link to
                </p>

                <p className="mt-1 break-all text-sm font-bold text-foreground app-dark:text-gray-100">
                  {email}
                </p>

                <p className="mt-4 text-sm leading-6 text-gray-500 app-dark:text-muted">

                  {returnTo
                    ? "Click the link in the email to verify your Flowex account. After verification, log in to continue your checkout."
                    : "Click the link in the email to verify your Flowex account. Once verified, Flowex will recognize your authenticated session."}

                </p>

                <Link
                  href={loginPath}
                  className="mt-7 inline-flex w-full items-center justify-center rounded-xl bg-brand-primary    py-3.5 font-semibold text-gray-100 shadow-sm transition-all duration-300 hover:-translate-y-0.5"
                >
                  {returnTo
                    ? "Log In & Continue"
                    : "Back to Login"}
                </Link>

                <p className="mt-5 text-xs leading-5 text-muted app-dark:text-slate-500">
                  Didn&apos;t receive it? Check your spam or junk folder.
                </p>

              </div>

            ) : (

              /* ================= SIGNUP FORM ================= */

              <div className="rounded-[28px] border border-border-subtle/80 bg-white/90 p-7  backdrop-blur-xl app-dark:border-border-subtle app-dark:bg-surface/95 ">

                <form
                  className="space-y-5"
                  onSubmit={handleSubmit}
                >

                  {/* ================= FULL NAME ================= */}

                  <div>

                    <label
                      htmlFor="fullName"
                      className="mb-2 block text-sm font-semibold text-gray-700 app-dark:text-gray-100"
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
                      className="w-full rounded-xl border border-border-subtle bg-white px-4 py-3 text-foreground outline-none transition placeholder:text-muted focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/20 disabled:cursor-not-allowed disabled:opacity-60 app-dark:border-border-subtle app-dark:bg-surface app-dark:text-gray-100 app-dark:placeholder:text-muted app-dark:focus:border-brand-primary app-dark:focus:ring-brand-primary/10"
                    />

                  </div>

                  {/* ================= EMAIL ================= */}

                  <div>

                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-semibold text-gray-700 app-dark:text-gray-100"
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
                      className="w-full rounded-xl border border-border-subtle bg-white px-4 py-3 text-foreground outline-none transition placeholder:text-muted focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/20 disabled:cursor-not-allowed disabled:opacity-60 app-dark:border-border-subtle app-dark:bg-surface app-dark:text-gray-100 app-dark:placeholder:text-muted app-dark:focus:border-brand-primary app-dark:focus:ring-brand-primary/10"
                    />

                  </div>

                  {/* ================= PASSWORD ================= */}

                  <div>

                    <label
                      htmlFor="password"
                      className="mb-2 block text-sm font-semibold text-gray-700 app-dark:text-gray-100"
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
                      className="w-full rounded-xl border border-border-subtle bg-white px-4 py-3 text-foreground outline-none transition placeholder:text-muted focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/20 disabled:cursor-not-allowed disabled:opacity-60 app-dark:border-border-subtle app-dark:bg-surface app-dark:text-gray-100 app-dark:placeholder:text-muted app-dark:focus:border-brand-primary app-dark:focus:ring-brand-primary/10"
                    />

                  </div>

                  {/* ================= CONFIRM PASSWORD ================= */}

                  <div>

                    <label
                      htmlFor="confirmPassword"
                      className="mb-2 block text-sm font-semibold text-gray-700 app-dark:text-gray-100"
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
                      className={`w-full rounded-xl border bg-white px-4 py-3 text-foreground outline-none transition placeholder:text-muted focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 app-dark:bg-surface app-dark:text-gray-100 app-dark:placeholder:text-muted ${
                        passwordError
                          ? "border-red-400 focus:border-red-400 focus:ring-red-100 app-dark:border-red-500 app-dark:focus:ring-red-500/10"
                          : "border-border-subtle focus:border-brand-primary focus:ring-brand-primary/20 app-dark:border-border-subtle app-dark:focus:border-brand-primary app-dark:focus:ring-brand-primary/10"
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
                      className="flex w-full items-center justify-between rounded-xl border border-border-subtle bg-gray-50 px-4 py-3 text-left transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 app-dark:border-border-subtle app-dark:bg-surface app-dark:hover:bg-surface"
                    >

                      <span className="text-sm font-semibold text-gray-700 app-dark:text-gray-100">
                        Terms & Privacy
                      </span>

                      <span className="text-xs font-semibold text-brand-primary app-dark:text-brand-primary">
                        {showTerms
                          ? "Hide ↑"
                          : "Show ↓"}
                      </span>

                    </button>

                    {showTerms && (

                      <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-border-subtle bg-gray-50 p-4 text-sm leading-6 text-muted app-dark:border-border-subtle app-dark:bg-surface app-dark:text-muted">

                        <p className="font-semibold text-foreground app-dark:text-gray-100">
                          Terms of Service
                        </p>

                        <p className="mt-2">
                          By creating a Flowex account, you agree to use the service responsibly,
                          provide accurate account information, and comply with applicable laws.
                          You are responsible for how you configure your automations and for the
                          lead information processed through your account.
                        </p>

                        <p className="mt-4 font-semibold text-foreground app-dark:text-gray-100">
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
                            className="font-semibold text-brand-primary hover:underline app-dark:text-brand-primary"
                          >
                            Terms of Service
                          </Link>{" "}

                          and{" "}

                          <Link
                            href="/privacy"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-brand-primary hover:underline app-dark:text-brand-primary"
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
                        className="mt-1 h-4 w-4 cursor-pointer accent-brand-primary disabled:cursor-not-allowed"
                      />

                      <span className="text-sm text-gray-500 app-dark:text-muted">
                        I have read and agree to the Terms of Service and Privacy Policy.
                      </span>

                    </label>

                  </div>

                  {/* ================= SIGNUP ERROR ================= */}

                  {signupError && (

                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 app-dark:border-red-500/30 app-dark:bg-red-500/10 app-dark:text-red-400">
                      {signupError}
                    </div>

                  )}

                  {/* ================= CREATE ACCOUNT ================= */}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-xl bg-brand-primary    py-3.5 font-semibold text-gray-100 shadow-sm transition-all duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
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

                  <div className="h-px flex-1 bg-gray-200 app-dark:bg-surface" />

                  <span className="text-xs uppercase tracking-wider text-muted app-dark:text-slate-500">
                    or
                  </span>

                  <div className="h-px flex-1 bg-gray-200 app-dark:bg-surface" />

                </div>

                {/* ================= GOOGLE ================= */}

                <button
                  type="button"
                  onClick={handleGoogleSignup}
                  disabled={isSubmitting || isGoogleLoading}
                  className="w-full rounded-xl border border-border-subtle bg-white py-3.5 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 app-dark:border-border-subtle app-dark:bg-surface app-dark:text-gray-100 app-dark:hover:bg-brand-primary"
                >
                  {isGoogleLoading
                    ? "Connecting to Google..."
                    : "Continue with Google"}
                </button>

                <p className="mt-6 text-center text-xs leading-5 text-muted app-dark:text-slate-500">
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

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupPageContent />
    </Suspense>
  );
}