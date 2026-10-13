"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { FlowexBrand } from "@/components/FlowexBrand";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
      await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo }
      );
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
                disabled={isSubmitting}
                className="w-full rounded-xl bg-brand-primary py-3.5 font-semibold text-gray-100 shadow-sm transition-all duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Sending..." : "Send Reset Link"}
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
