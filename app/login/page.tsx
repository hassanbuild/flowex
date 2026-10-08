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
import { FlowexBrand } from "@/components/FlowexBrand";

const AUTH_RETURN_KEY =
  "flowex-auth-return-to";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [supabase] = useState(() =>
    createClient()
  );

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [isLoggingIn, setIsLoggingIn] =
    useState(false);

  const [loginError, setLoginError] =
    useState("");

  const [isGoogleLoading, setIsGoogleLoading] =
    useState(false);

  /*
    ================= RETURN PATH =================

    Checkout currently sends:

    /login?returnTo=/checkout

    For security and predictable routing,
    only approved Flowex return destinations
    are accepted here.
  */

  const requestedReturnTo =
    searchParams.get("returnTo");

  const returnTo =
    requestedReturnTo === "/checkout"
      ? "/checkout"
      : null;

  /*
    If someone switches from Login -> Signup
    while coming from Checkout, preserve the
    checkout return destination.
  */

  const signupPath =
    returnTo
      ? `/signup?returnTo=${encodeURIComponent(
          returnTo
        )}`
      : "/signup";

  const handleLogin = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (isLoggingIn) {
      return;
    }

    setLoginError("");
    setIsLoggingIn(true);

    try {
      const {
        data,
        error,
      } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (error) {
        setLoginError(error.message);
        setIsLoggingIn(false);
        return;
      }

      if (!data.session) {
        setLoginError(
          "We couldn't start your session. Please try again."
        );

        setIsLoggingIn(false);
        return;
      }

      /*
        ================= CHECKOUT RETURN =================

        If Login was opened from Checkout,
        return there immediately.

        Checkout already stores the unfinished
        form in sessionStorage, so it can restore
        the customer's information.

        We keep the return key until Checkout
        finishes loading it.
      */

      if (returnTo) {
        sessionStorage.setItem(
          AUTH_RETURN_KEY,
          returnTo
        );

        router.replace(returnTo);
        router.refresh();

        return;
      }

      /*
        ================= NORMAL LOGIN =================

        Normal Login keeps the existing Flowex
        routing behavior.

        We first send the authenticated user to "/".

        The existing Flowex route/access logic then
        routes according to plan:

        Free      -> /home
        Trial/Pro -> /dashboard
      */

      sessionStorage.removeItem(
        AUTH_RETURN_KEY
      );

      router.replace("/");
      router.refresh();
    } catch {
      setLoginError(
        "Something went wrong while logging in. Please try again."
      );

      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (isLoggingIn || isGoogleLoading) {
      return;
    }

    setLoginError("");
    setIsGoogleLoading(true);

    try {
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
        setLoginError(error.message);
        setIsGoogleLoading(false);
      }
    } catch {
      setLoginError(
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
              <FlowexBrand priority />
            </Link>

            <p className="text-sm text-gray-500 app-dark:text-gray-100">
              Don&apos;t have an account?{" "}

              <Link
                href={signupPath}
                className="font-semibold text-foreground transition hover:text-brand-primary app-dark:text-gray-100 app-dark:hover:text-brand-primary"
              >
                Sign Up
              </Link>
            </p>

          </div>

        </div>

        {/* ================= LOGIN ================= */}

        <section className="flex min-h-[calc(100vh-68px)] items-center justify-center px-4 py-10 sm:px-6">

          <div className="w-full max-w-md">

            <div className="mb-5 text-center">

              <h1 className="text-4xl font-black">
                Welcome Back
              </h1>

              <p className="mt-3 text-gray-500 app-dark:text-muted">
                {returnTo
                  ? "Log in to continue your Flowex checkout."
                  : "Log in to your Flowex account."}
              </p>

            </div>

            <div className="rounded-[28px] border border-border-subtle/80 bg-white/90 p-7  backdrop-blur-xl app-dark:border-border-subtle app-dark:bg-surface/95 ">

              <form
                onSubmit={handleLogin}
                className="space-y-5"
              >

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
                    value={email}
                    onChange={(event) =>
                      setEmail(
                        event.target.value
                      )
                    }
                    placeholder="you@company.com"
                    required
                    autoComplete="email"
                    disabled={isLoggingIn}
                    className="w-full rounded-xl border border-border-subtle bg-white px-4 py-3 text-foreground outline-none transition placeholder:text-muted focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/20 disabled:cursor-not-allowed disabled:opacity-60 app-dark:border-border-subtle app-dark:bg-surface app-dark:text-gray-100 app-dark:placeholder:text-muted app-dark:focus:border-brand-primary app-dark:focus:ring-brand-primary/10"
                  />

                </div>

                {/* ================= PASSWORD ================= */}

                <div>

                  <div className="mb-2 flex items-center justify-between">

                    <label
                      htmlFor="password"
                      className="text-sm font-semibold text-gray-700 app-dark:text-gray-100"
                    >
                      Password
                    </label>

                    <Link
                      href="#"
                      className="text-xs font-semibold text-gray-500 transition hover:text-brand-primary app-dark:text-muted app-dark:hover:text-brand-primary"
                    >
                      Forgot password?
                    </Link>

                  </div>

                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value
                      )
                    }
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    disabled={isLoggingIn}
                    className="w-full rounded-xl border border-border-subtle bg-white px-4 py-3 text-foreground outline-none transition placeholder:text-muted focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/20 disabled:cursor-not-allowed disabled:opacity-60 app-dark:border-border-subtle app-dark:bg-surface app-dark:text-gray-100 app-dark:placeholder:text-muted app-dark:focus:border-brand-primary app-dark:focus:ring-brand-primary/10"
                  />

                </div>

                {/* ================= ERROR ================= */}

                {loginError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 app-dark:border-red-500/30 app-dark:bg-red-500/10 app-dark:text-red-400">
                    {loginError}
                  </div>
                )}

                {/* ================= LOGIN BUTTON ================= */}

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full rounded-xl bg-brand-primary    py-3.5 font-semibold text-gray-100 shadow-sm transition-all duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {isLoggingIn
                    ? "Logging in..."
                    : returnTo
                      ? "Log In & Continue"
                      : "Login"}
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
                onClick={handleGoogleLogin}
                disabled={isLoggingIn || isGoogleLoading}
                className="w-full rounded-xl border border-border-subtle bg-white py-3.5 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 app-dark:border-border-subtle app-dark:bg-surface app-dark:text-gray-100 app-dark:hover:bg-brand-primary"
              >
                {isGoogleLoading
                  ? "Connecting to Google..."
                  : "Continue with Google"}
              </button>

            </div>

          </div>

        </section>

      </main>

    </RouteGuard>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
