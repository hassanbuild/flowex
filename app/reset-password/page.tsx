"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { FlowexBrand } from "@/components/FlowexBrand";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [supabase] = useState(() => createClient());
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [isCheckingRecovery, setIsCheckingRecovery] = useState(true);
  const [recoveryLinkError, setRecoveryLinkError] = useState(false);
  const [email, setEmail] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [updated, setUpdated] = useState(false);

  useEffect(() => {
    let active = true;
    let recoveryAccepted = false;
    let callbackTimer: number | undefined;

    const acceptRecoverySession = () => {
      if (!active) return;
      recoveryAccepted = true;
      setHasRecoverySession(true);
      setIsCheckingRecovery(false);
      setRecoveryLinkError(false);
      window.history.replaceState(null, "", window.location.pathname);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY" && session) {
          acceptRecoverySession();
        }
      }
    );

    const currentUrl = new URL(window.location.href);
    const hashParams = new URLSearchParams(currentUrl.hash.replace(/^#/, ""));
    const tokenHash = currentUrl.searchParams.get("token_hash") || hashParams.get("token_hash");
    const tokenType = currentUrl.searchParams.get("type") || hashParams.get("type");
    const hashIndicatesRecovery =
      hashParams.get("type") === "recovery" && hashParams.has("access_token");
    const hasAuthError =
      currentUrl.searchParams.has("error") || hashParams.has("error");

    if (tokenHash) {
      window.history.replaceState(null, "", window.location.pathname);
      if (tokenType !== "recovery") {
        setRecoveryLinkError(true);
        setIsCheckingRecovery(false);
        return () => {
          active = false;
          subscription.unsubscribe();
        };
      }
      void supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" })
        .then(({ data, error: verificationError }) => {
          if (!active) return;
          if (verificationError || !data.session) {
            setRecoveryLinkError(true);
            setIsCheckingRecovery(false);
            return;
          }
          acceptRecoverySession();
        })
        .catch(() => {
          if (!active) return;
          setRecoveryLinkError(true);
          setIsCheckingRecovery(false);
        });
    } else if (hashIndicatesRecovery) {
      window.history.replaceState(null, "", `${currentUrl.pathname}${currentUrl.search}`);
      void supabase.auth.getSession().then(({ data, error: sessionError }) => {
        if (!active) return;
        if (sessionError || !data.session) {
          setRecoveryLinkError(true);
          setIsCheckingRecovery(false);
          return;
        }
        acceptRecoverySession();
      });
    } else if (hasAuthError) {
      window.history.replaceState(null, "", window.location.pathname);
      setRecoveryLinkError(true);
      setIsCheckingRecovery(false);
    } else if (currentUrl.searchParams.has("code")) {
      // The browser client may finish a same-device PKCE callback asynchronously.
      callbackTimer = window.setTimeout(() => {
        if (!active || recoveryAccepted) return;
        window.history.replaceState(null, "", window.location.pathname);
        setRecoveryLinkError(true);
        setIsCheckingRecovery(false);
      }, 5000);
    } else {
      setIsCheckingRecovery(false);
    }

    return () => {
      active = false;
      if (callbackTimer !== undefined) window.clearTimeout(callbackTimer);
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleVerifyCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isVerifyingCode) return;

    setError("");
    setIsVerifyingCode(true);
    try {
      const { data, error: verificationError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: recoveryCode.trim(),
        type: "recovery",
      });

      if (verificationError || !data.session) {
        setError("We couldn't verify that code. Check the email and code, or request a new reset email.");
        return;
      }

      setHasRecoverySession(true);
    } catch {
      setError("We couldn't verify that code. Check the email and code, or request a new reset email.");
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting || !hasRecoverySession) return;
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError("We couldn't update your password. Request a new reset link and try again.");
        return;
      }

      // Leave the recovery session so the Back to Login link can reach the guest-only login page.
      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch {
        // Password update already succeeded; keep the success state.
      }
      setUpdated(true);
    } catch {
      setError("We couldn't update your password. Request a new reset link and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background text-foreground transition-colors duration-300 app-dark:bg-surface app-dark:text-gray-100">
      <div className="border-b border-border-subtle/70 bg-white/80 backdrop-blur-xl app-dark:border-border-subtle/80 app-dark:bg-surface">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center px-6 lg:px-8">
          <Link href="/"><FlowexBrand priority /></Link>
        </div>
      </div>
      <section className="flex min-h-[calc(100vh-68px)] items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md">
          <div className="mb-5 text-center">
            <h1 className="text-4xl font-black">Reset Password</h1>
            <p className="mt-3 text-gray-500 app-dark:text-muted">Choose a new password for your Flowex account.</p>
          </div>
          <div className="rounded-[28px] border border-border-subtle/80 bg-white/90 p-7 backdrop-blur-xl app-dark:border-border-subtle app-dark:bg-surface/95">
            {updated ? (
              <div className="text-center">
                <h2 className="text-xl font-bold text-foreground app-dark:text-gray-100">Password updated successfully</h2>
                <p role="status" className="mt-3 text-sm leading-6 text-gray-500 app-dark:text-muted">
                  Your password has been changed. You can now log in with your new password.
                </p>
                <Link
                  href="/login"
                  className="mt-5 inline-flex items-center justify-center text-sm font-semibold text-brand-primary transition hover:underline"
                >
                  Back to Login
                </Link>
              </div>
            ) : hasRecoverySession ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="password" className="mb-2 block text-sm font-semibold text-gray-700 app-dark:text-gray-100">New password</label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      autoComplete="new-password"
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-border-subtle bg-white px-4 py-3 pr-16 text-foreground outline-none transition placeholder:text-muted focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/20 disabled:cursor-not-allowed disabled:opacity-60 app-dark:border-border-subtle app-dark:bg-surface app-dark:text-gray-100 app-dark:placeholder:text-muted app-dark:focus:border-brand-primary app-dark:focus:ring-brand-primary/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      className="absolute inset-y-0 right-3 text-xs font-semibold text-gray-500 transition hover:text-brand-primary app-dark:text-muted"
                      aria-label={`${showPassword ? "Hide" : "Show"} new password`}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="mb-2 block text-sm font-semibold text-gray-700 app-dark:text-gray-100">Confirm new password</label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      required
                      autoComplete="new-password"
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-border-subtle bg-white px-4 py-3 pr-16 text-foreground outline-none transition placeholder:text-muted focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/20 disabled:cursor-not-allowed disabled:opacity-60 app-dark:border-border-subtle app-dark:bg-surface app-dark:text-gray-100 app-dark:placeholder:text-muted app-dark:focus:border-brand-primary app-dark:focus:ring-brand-primary/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((visible) => !visible)}
                      className="absolute inset-y-0 right-3 text-xs font-semibold text-gray-500 transition hover:text-brand-primary app-dark:text-muted"
                      aria-label={`${showConfirmPassword ? "Hide" : "Show"} confirm password`}
                    >
                      {showConfirmPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
                {error && <p role="alert" className="text-sm leading-6 text-red-600 app-dark:text-red-400">{error}</p>}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-brand-primary py-3.5 font-semibold text-gray-100 shadow-sm transition-all duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Updating..." : "Update Password"}
                </button>
              </form>
            ) : isCheckingRecovery ? (
              <p role="status" className="text-center text-sm text-gray-500 app-dark:text-muted">
                Verifying your password reset link...
              </p>
            ) : recoveryLinkError ? (
              <div className="text-center">
                <p role="alert" className="text-sm leading-6 text-gray-500 app-dark:text-muted">
                  This password reset link is invalid or has expired. Request a new reset email to continue.
                </p>
                <Link href="/forgot-password" className="mt-5 inline-block text-sm font-semibold text-brand-primary hover:underline">
                  Request a new reset email
                </Link>
              </div>
            ) : (
              <div>
                <p className="mb-5 text-center text-sm leading-6 text-gray-500 app-dark:text-muted">
                  Enter the code we sent to your email.
                </p>
                <form onSubmit={handleVerifyCode} className="space-y-5">
                  <div>
                    <label htmlFor="recoveryEmail" className="mb-2 block text-sm font-semibold text-gray-700 app-dark:text-gray-100">Email</label>
                    <input
                      id="recoveryEmail"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      autoComplete="email"
                      disabled={isVerifyingCode}
                      className="w-full rounded-xl border border-border-subtle bg-white px-4 py-3 text-foreground outline-none transition placeholder:text-muted focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/20 disabled:cursor-not-allowed disabled:opacity-60 app-dark:border-border-subtle app-dark:bg-surface app-dark:text-gray-100 app-dark:placeholder:text-muted app-dark:focus:border-brand-primary app-dark:focus:ring-brand-primary/10"
                    />
                  </div>
                  <div>
                    <label htmlFor="recoveryCode" className="mb-2 block text-sm font-semibold text-gray-700 app-dark:text-gray-100">Recovery Code</label>
                    <input
                      id="recoveryCode"
                      type="text"
                      value={recoveryCode}
                      onChange={(event) => setRecoveryCode(event.target.value)}
                      required
                      autoComplete="one-time-code"
                      inputMode="numeric"
                      disabled={isVerifyingCode}
                      className="w-full rounded-xl border border-border-subtle bg-white px-4 py-3 text-foreground outline-none transition placeholder:text-muted focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/20 disabled:cursor-not-allowed disabled:opacity-60 app-dark:border-border-subtle app-dark:bg-surface app-dark:text-gray-100 app-dark:placeholder:text-muted app-dark:focus:border-brand-primary app-dark:focus:ring-brand-primary/10"
                    />
                  </div>
                  {error && <p role="alert" className="text-sm leading-6 text-red-600 app-dark:text-red-400">{error}</p>}
                  <button
                    type="submit"
                    disabled={isVerifyingCode}
                    className="w-full rounded-xl bg-brand-primary py-3.5 font-semibold text-gray-100 shadow-sm transition-all duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isVerifyingCode ? "Verifying..." : "Verify Code"}
                  </button>
                </form>
                <Link href="/forgot-password" className="mt-5 block text-center text-sm font-semibold text-gray-500 transition hover:text-brand-primary app-dark:text-muted">
                  Request a new reset email
                </Link>
              </div>
            )}
            {!updated && (
              <Link href="/login" className="mt-5 block text-center text-sm font-semibold text-gray-500 transition hover:text-brand-primary app-dark:text-muted">Back to Login</Link>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
