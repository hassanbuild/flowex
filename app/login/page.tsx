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

export default function LoginPage() {
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
              Don&apos;t have an account?{" "}

              <Link
                href={signupPath}
                className="font-semibold text-gray-900 transition hover:text-emerald-600 dark:text-white dark:hover:text-emerald-400"
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

              <p className="mt-3 text-gray-500 dark:text-slate-400">
                {returnTo
                  ? "Log in to continue your Flowex checkout."
                  : "Log in to your Flowex account."}
              </p>

            </div>

            <div className="rounded-[28px] border border-gray-200/80 bg-white/90 p-7 shadow-[0_25px_70px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:border-slate-800 dark:bg-[#11161d]/95 dark:shadow-[0_25px_70px_rgba(0,0,0,0.35)]">

              <form
                onSubmit={handleLogin}
                className="space-y-5"
              >

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
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-[#0b0f14] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/10"
                  />

                </div>

                {/* ================= PASSWORD ================= */}

                <div>

                  <div className="mb-2 flex items-center justify-between">

                    <label
                      htmlFor="password"
                      className="text-sm font-semibold text-gray-700 dark:text-slate-200"
                    >
                      Password
                    </label>

                    <Link
                      href="#"
                      className="text-xs font-semibold text-gray-500 transition hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400"
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
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-[#0b0f14] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/10"
                  />

                </div>

                {/* ================= ERROR ================= */}

                {loginError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                    {loginError}
                  </div>
                )}

                {/* ================= LOGIN BUTTON ================= */}

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 py-3.5 font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
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

            </div>

          </div>

        </section>

      </main>

    </RouteGuard>
  );
}