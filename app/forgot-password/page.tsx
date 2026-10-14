"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { FlowexBrand } from "@/components/FlowexBrand";
import { createClient } from "@/lib/supabase/client";

const PASSWORD_RESET_COOLDOWN_MS = 60_000;
const PASSWORD_RESET_REQUESTED_AT_KEY = "flowex_password_reset_requested_at";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isCooldownLoaded, setIsCooldownLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedTimestamp = window.localStorage.getItem(PASSWORD_RESET_REQUESTED_AT_KEY);
      const requestedAt = storedTimestamp ? Number(storedTimestamp) : NaN;

      if (Number.isFinite(requestedAt) && requestedAt > 0) {
        const remainingMs = requestedAt + PASSWORD_RESET_COOLDOWN_MS - Date.now();
        if (remainingMs > 0) {
          setCooldownUntil(requestedAt + PASSWORD_RESET_COOLDOWN_MS);
          setRemainingSeconds(Math.ceil(remainingMs / 1000));
        } else {
          window.localStorage.removeItem(PASSWORD_RESET_REQUESTED_AT_KEY);
        }
      } else if (storedTimestamp) {
        window.localStorage.removeItem(PASSWORD_RESET_REQUESTED_AT_KEY);
      }
    } catch {
      setError("Your browser couldn't restore the resend timer. You can still request a reset link.");
    } finally {
      setIsCooldownLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (cooldownUntil === null) return;

    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
      setRemainingSeconds(remaining);
      if (remaining === 0) {
        setCooldownUntil(null);
        try {
          window.localStorage.removeItem(PASSWORD_RESET_REQUESTED_AT_KEY);
        } catch {}
      }
    };

    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [cooldownUntil]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setMessage("");
    setError("");

    try {
      const supabase = createClient();
      const redirectTo = new URL(
        "/reset-password",
        process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
      ).toString();
      const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo }
      );
      if (recoveryError) {
        setError("We couldn't send a reset link right now. Please try again later.");
        return;
      }

      const requestedAt = Date.now();
      try {
        window.localStorage.setItem(PASSWORD_RESET_REQUESTED_AT_KEY, String(requestedAt));
      } catch {}
      setCooldownUntil(requestedAt + PASSWORD_RESET_COOLDOWN_MS);
      setRemainingSeconds(60);
      setMessage(
        "If an account exists for this email, we’ve sent you a password reset link. Check your inbox."
      );
    } catch {
      setError("We couldn't send a reset link right now. Please try again later.");
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
            <h1 className="text-4xl font-black">Forgot Password?</h1>
            <p className="mt-3 text-gray-500 app-dark:text-muted">
              Enter your email and we’ll send a password reset link.
            </p>
          </div>
          <div className="rounded-[28px] border border-border-subtle/80 bg-white/90 p-7 backdrop-blur-xl app-dark:border-border-subtle app-dark:bg-surface/95">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold text-gray-700 app-dark:text-gray-100">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.com"
                  required
                  autoComplete="email"
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-border-subtle bg-white px-4 py-3 text-foreground outline-none transition placeholder:text-muted focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/20 disabled:cursor-not-allowed disabled:opacity-60 app-dark:border-border-subtle app-dark:bg-surface app-dark:text-gray-100 app-dark:placeholder:text-muted app-dark:focus:border-brand-primary app-dark:focus:ring-brand-primary/10"
                />
              </div>
              {message && <p role="status" className="text-sm leading-6 text-brand-primary">{message}</p>}
              {error && <p role="alert" className="text-sm leading-6 text-red-600 app-dark:text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={isSubmitting || !isCooldownLoaded || remainingSeconds > 0}
                className="w-full rounded-xl bg-brand-primary py-3.5 font-semibold text-gray-100 shadow-sm transition-all duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600 disabled:opacity-70 disabled:shadow-none disabled:hover:translate-y-0 app-dark:disabled:bg-gray-700 app-dark:disabled:text-gray-300"
              >
                {isSubmitting
                  ? "Sending..."
                  : remainingSeconds > 0
                    ? `Resend Reset Link (${remainingSeconds}s)`
                    : "Send Reset Link"}
              </button>
            </form>
            <Link href="/login" className="mt-5 block text-center text-sm font-semibold text-gray-500 transition hover:text-brand-primary app-dark:text-muted">
              Back to Login
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
