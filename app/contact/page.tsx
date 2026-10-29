"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useAppAccount } from "@/components/AppAccountProvider";

export default function ContactPage() {
  const { isLoggedIn, plan } = useAppAccount();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError("");
    setSubmitted(false);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });

      if (!response.ok) {
        setSubmitError(
          response.status === 429
            ? "Please wait before sending another message."
            : "We couldn't send your message right now. Please try again later."
        );
        return;
      }

      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      setSubmitted(true);
    } catch {
      setSubmitError("We couldn't send your message right now. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const backPath =
    !isLoggedIn
      ? "/"
      : plan === "free"
        ? "/home"
        : "/dashboard";

  return (
    <main
      className={`min-h-screen bg-background text-foreground transition-colors duration-300 ${
        isLoggedIn
          ? "app-dark:bg-surface app-dark:text-gray-100"
          : "app-dark:bg-surface app-dark:text-gray-100"
      }`}
    >

      {/* NAVBAR */}

      <nav
        className={`border-b border-border-subtle/70 bg-white/85 backdrop-blur-xl ${
          isLoggedIn
            ? "app-dark:border-border-subtle/80 app-dark:bg-surface"
            : "app-dark:border-border-subtle/80 app-dark:bg-surface"
        }`}
      >
        <div className="mx-auto flex h-[55px] max-w-7xl items-center justify-between px-4 sm:px-6">

          <Link href={backPath}>
            <Image
              src="/flowex-logo-brand.png"
              alt="Flowex"
              width={115}
              height={32}
              priority
            />
          </Link>

          <Link
            href={backPath}
            className={`text-sm font-semibold text-gray-500 transition-colors hover:text-foreground ${
              isLoggedIn
                ? "app-dark:text-gray-100 app-dark:hover:text-gray-100"
                : "app-dark:text-gray-100 app-dark:hover:text-gray-100"
            }`}
          >
            ← Back to Flowex
          </Link>

        </div>
      </nav>

      {/* CONTENT */}

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-20">

        <div className="mx-auto max-w-2xl text-center">

          <div className="mb-6 inline-flex rounded-full bg-surface   p-[1px]">

            <div
              className={`rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-gray-700 ${
                isLoggedIn
                  ? "app-dark:bg-surface app-dark:text-gray-100"
                  : "app-dark:bg-surface app-dark:text-gray-100"
              }`}
            >
              Contact Flowex
            </div>

          </div>

          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
            How can we help?
          </h1>

          <p
            className={`mt-5 text-base leading-7 text-gray-500 ${
              isLoggedIn
                ? "app-dark:text-muted"
                : "app-dark:text-muted"
            }`}
          >
            Have a question about Flowex, your account, or your automation?
            Send us a message and we'll help you out.
          </p>

        </div>

        {/* FORM */}

        <div
          className={`mx-auto mt-10 max-w-2xl rounded-3xl border border-border-subtle bg-white p-5 sm:mt-12 sm:p-8 ${
            isLoggedIn
              ? "app-dark:border-border-subtle app-dark:bg-surface"
              : "app-dark:border-border-subtle app-dark:bg-surface"
          }`}
        >

          <form onSubmit={handleSubmit}>

          <div className="grid gap-5 sm:grid-cols-2">

            <div>

              <label htmlFor="contact-name" className="text-sm font-semibold">
                Name
              </label>

              <input
                id="contact-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                required
                maxLength={120}
                disabled={isSubmitting}
                className={`mt-2 w-full rounded-xl border border-border-subtle bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-primary ${
                  isLoggedIn
                    ? "app-dark:border-border-subtle app-dark:bg-surface app-dark:text-gray-100"
                    : "app-dark:border-border-subtle app-dark:bg-surface app-dark:text-gray-100"
                }`}
              />

            </div>

            <div>

              <label htmlFor="contact-email" className="text-sm font-semibold">
                Email
              </label>

              <input
                id="contact-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                maxLength={254}
                autoComplete="email"
                disabled={isSubmitting}
                className={`mt-2 w-full rounded-xl border border-border-subtle bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-primary ${
                  isLoggedIn
                    ? "app-dark:border-border-subtle app-dark:bg-surface app-dark:text-gray-100"
                    : "app-dark:border-border-subtle app-dark:bg-surface app-dark:text-gray-100"
                }`}
              />

            </div>

          </div>

          <div className="mt-5">

            <label htmlFor="contact-subject" className="text-sm font-semibold">
              Subject
            </label>

            <input
              id="contact-subject"
              type="text"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="What do you need help with?"
              required
              maxLength={160}
              disabled={isSubmitting}
              className={`mt-2 w-full rounded-xl border border-border-subtle bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-primary ${
                isLoggedIn
                  ? "app-dark:border-border-subtle app-dark:bg-surface app-dark:text-gray-100"
                  : "app-dark:border-border-subtle app-dark:bg-surface app-dark:text-gray-100"
              }`}
            />

          </div>

          <div className="mt-5">

            <label htmlFor="contact-message" className="text-sm font-semibold">
              Message
            </label>

            <textarea
              id="contact-message"
              rows={6}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Tell us more..."
              required
              maxLength={8000}
              disabled={isSubmitting}
              className={`mt-2 w-full resize-none rounded-xl border border-border-subtle bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-primary ${
                isLoggedIn
                  ? "app-dark:border-border-subtle app-dark:bg-surface app-dark:text-gray-100"
                  : "app-dark:border-border-subtle app-dark:bg-surface app-dark:text-gray-100"
              }`}
            />

          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 w-full rounded-xl bg-brand-primary py-3 text-sm font-bold text-gray-100 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Sending..." : "Send Message"}
          </button>

          {submitted && (
            <p role="status" className="mt-3 text-center text-sm text-brand-primary">
              Thanks for reaching out. Your message has been sent to Flowex Support.
            </p>
          )}
          {submitError && (
            <p role="alert" className="mt-3 text-center text-sm text-red-600 app-dark:text-red-400">
              {submitError}
            </p>
          )}

          <p
            className={`mt-3 text-center text-xs text-muted ${
              isLoggedIn
                ? "app-dark:text-slate-500"
                : "app-dark:text-slate-500"
            }`}
          >
            Support replies are sent to the email address you provide.
          </p>

          </form>

        </div>

      </section>

      {/* FOOTER */}

      <footer
        className={`border-t border-border-subtle/70 bg-white/85 backdrop-blur-xl ${
          isLoggedIn
            ? "app-dark:border-border-subtle/80 app-dark:bg-surface"
            : "app-dark:border-border-subtle/80 app-dark:bg-surface"
        }`}
      >

        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-6 text-center sm:px-6 md:flex-row md:justify-between md:text-left">

          <div className="flex items-center gap-4">

            <Image
              src="/flowex-logo-brand.png"
              alt="Flowex"
              width={110}
              height={30}
            />

            <span
              className={`hidden text-sm text-muted lg:block ${
                isLoggedIn
                  ? "app-dark:text-gray-100"
                  : "app-dark:text-gray-100"
              }`}
            >
              Automate your business.
            </span>

          </div>

          <p
            className={`text-xs text-muted ${
              isLoggedIn
                ? "app-dark:text-muted"
                : "app-dark:text-muted"
            }`}
          >
            © 2026 Flowex. All rights reserved.
          </p>

        </div>

      </footer>

    </main>
  );
}
