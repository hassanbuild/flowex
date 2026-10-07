"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import RouteGuard from "@/components/RouteGuard";

export default function Home() {

  const [leadsCount, setLeadsCount] = useState(0);
  const [replyTime, setReplyTime] = useState(0);
  const [successRate, setSuccessRate] = useState(0);

  useEffect(() => {
  const duration = 1400;
  const steps = 40;
  const intervalTime = duration / steps;

  let currentStep = 0;

  const counter = setInterval(() => {
    currentStep += 1;

    const progress = currentStep / steps;

    setLeadsCount(Math.round(127 * progress));
    setReplyTime(Number((1.8 * progress).toFixed(1)));
    setSuccessRate(Math.round(99 * progress));

    if (currentStep >= steps) {
      setLeadsCount(127);
      setReplyTime(1.8);
      setSuccessRate(99);
      clearInterval(counter);
    }
  }, intervalTime);

  return () => clearInterval(counter);
  }, []);

return (
  <RouteGuard access="guest">
    <main className="relative min-h-screen overflow-x-hidden bg-background text-foreground transition-colors duration-300 app-dark:bg-surface app-dark:text-gray-100">

      {/* ================= AMBIENT BACKGROUND ================= */}

      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">

        {/* Emerald glow - top left */}
       <div className="absolute -left-40 top-20 h-[500px] w-[500px] animate-[float1_18s_ease-in-out_infinite] rounded-full bg-transparent blur-[150px]" />

        {/* Cyan glow - hero center */}
       <div className="absolute left-[40%] top-[250px] h-[420px] w-[420px] animate-[float2_22s_ease-in-out_infinite] rounded-full bg-transparent blur-[160px]" />

       {/* Indigo glow - top right */}
       <div className="absolute -right-40 top-10 h-[500px] w-[500px] animate-[float3_20s_ease-in-out_infinite] rounded-full bg-transparent blur-[160px]" />

      </div>

      {/* ================= NAVBAR ================= */}

      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-border-subtle/70 bg-white/85 backdrop-blur-xl app-dark:border-border-subtle/80 app-dark:bg-surface">

        <div className="mx-auto flex h-[55px] max-w-8xl items-center justify-between px-6 lg:px-8">

          <Image
            src="/flowex-logo-brand.png"
            alt="Flowex"
            width={125}
            height={34}
            priority
          />

          <div className="hidden items-center gap-10 lg:flex">

            <a
              href="#product"
             className="transition hover:text-foreground app-dark:hover:text-gray-100"
            >
              Product
           </a>

            <a
              href="#solutions"
              className="transition hover:text-foreground app-dark:hover:text-gray-100"
            >
              Solutions
           </a>

            <a
             href="#pricing"
             className="transition hover:text-foreground app-dark:hover:text-gray-100"
            >
             Pricing
           </a>


          </div>

         <div className="flex items-center gap-3">
             {/* Logged out state */}
           <Link
             href="/login"
             className="hidden rounded-xl px-4 py-2 text-sm font-medium text-muted app-dark:text-muted transition hover:bg-gray-100 hover:text-black app-dark:text-muted app-dark:hover:bg-brand-primary app-dark:hover:text-gray-100 md:block"
             >
              Login
           </Link>

            <Link
             href="/signup"
             className="rounded-xl bg-brand-primary    px-5 py-2.5 text-sm font-semibold text-gray-100 shadow-sm transition-all duration-300 hover:-translate-y-0.5"
             >
              Sign Up
             </Link>

          </div>

        </div>

      </nav>

      {/* ================= HERO ================= */}

      <section className="mx-auto max-w-7xl px-8 pt-16 pb-12">

        <div className="grid items-center gap-20 lg:grid-cols-2">

          {/* LEFT */}

          <div>

            <span className="inline-flex rounded-full border border-border-subtle bg-surface-subtle p-[1px] text-sm font-semibold text-brand-primary app-dark:border-0 app-dark:bg-surface  ">
              <span className="rounded-full px-5 py-2 app-dark:bg-surface app-dark:text-gray-100">
               Setup in under 2 minutes
             </span>
           </span>

            <h1 className="mt-1 text-5xl font-black leading-tight md:text-6xl">

              Never Lose

              <br />

              Another

              <br />

              <span className="bg-surface     ">

                Lead

              </span>

            </h1>

            <p className="mt-6 max-w-lg text-lg leading-8 text-muted app-dark:text-muted">

              Flowex captures every lead, replies instantly, notifies your team,
              and keeps your business running 24/7—so you never miss another customer.

            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">

              <Link
  href="/checkout"
  className="rounded-2xl bg-brand-primary    px-8 py-4 text-center font-semibold text-gray-100 shadow-sm transition hover:-translate-y-1"
>
  Start 7-Day Free Trial
</Link>

            </div>

            <div className="mt-10 flex flex-wrap gap-8 text-sm font-medium text-gray-500 app-dark:text-muted">

              <span>✓ Setup in 2 Minutes</span>

              <span>✓ 7-Day Free Trial</span>

              <span>✓ Cancel Anytime</span>

            </div>

          </div>

{/* RIGHT */}

<div className="relative">

  {/* Dashboard Glow */}
  <div className="pointer-events-none absolute -inset-8 -z-10 rounded-[40px] bg-surface    blur-3xl" />

  {/* Dashboard Card */}
  <div className="animate-[dashboard_8s_ease-in-out_infinite] rounded-[36px] border border-white/50 bg-white/90 app-dark:border-border-subtle/70 app-dark:bg-surface/90 p-8  backdrop-blur">

    <div className="mb-8 flex items-center justify-between">

      <div>
        <p className="text-sm text-gray-500 app-dark:text-muted">
          Flowex Dashboard
        </p>

        <h3 className="text-2xl font-bold">
          Lead Automation
        </h3>
      </div>

      <div className="inline-flex rounded-full bg-surface-subtle px-3 py-1 text-sm font-semibold text-brand-primary app-dark:bg-surface   app-dark:p-[1px]">
       <span className="rounded-full app-dark:bg-surface app-dark:px-[11px] app-dark:py-[3px] app-dark:text-gray-100">
         ● Active
       </span>
      </div>

    </div>

    <div className="space-y-6">

      {/* Stats */}

      <div className="grid grid-cols-3 gap-4">

        <div className="rounded-2xl bg-surface-subtle p-4 app-dark:bg-surface">
          <p className="text-xs text-gray-500 app-dark:text-muted">Leads</p>
          <h4 className="mt-2 text-3xl font-black">
           {leadsCount}
         </h4>
        </div>

        <div className="rounded-2xl bg-surface-subtle p-4 app-dark:bg-surface">
          <p className="text-xs text-gray-500 app-dark:text-muted">Reply Time</p>
          <h4 className="mt-2 text-3xl font-black">
           {replyTime.toFixed(1)}s
         </h4>
        </div>

        <div className="rounded-2xl bg-surface    p-4 text-brand-primary   ">
            <p className="text-xs opacity-80 app-dark:opacity-100">
              Success
           </p>

            <h4 className="mt-2 text-3xl font-black">
             {successRate}%
           </h4>
        </div>

      </div>

      {/* Workflow */}

      <div className="rounded-3xl border border-border-subtle p-6 app-dark:border-border-subtle">

        <p className="font-semibold">
          Latest Automation
        </p>

        <div className="mt-5 space-y-4">

          <div className="flex items-center justify-between">
            <span>New Lead</span>
            <span className="font-medium text-gray-500 app-dark:text-muted">
              Acme Marketing
            </span>
          </div>

          <div className="h-px bg-gray-100 app-dark:bg-surface" />

          <div className="flex items-center justify-between">
            <span>Reply Sent</span>
            <span className="text-brand-primary">✓</span>
          </div>

          <div className="h-px bg-gray-100 app-dark:bg-surface" />

          <div className="flex items-center justify-between">
            <span>CRM Updated</span>
            <span className="text-brand-primary">✓</span>
          </div>

          <div className="h-px bg-gray-100 app-dark:bg-surface" />

          <div className="flex items-center justify-between">
            <span>Team Notified</span>
            <span className="text-brand-primary">✓</span>
          </div>

        </div>

      </div>

    </div>

  </div>
</div>

 </div>

  </section>
{/* ================= PRICING ================= */}

<section
  id="pricing"
  className="relative scroll-mt-[52px] overflow-hidden border-y border-border-subtle/70 bg-surface    app-dark:border-border-subtle    py-5"
>
     <div className="pointer-events-none absolute left-1/2 top-1/2 -z-0 h-[350px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-surface-subtle/20 blur-[120px]" />

    <div className="relative z-10 mx-auto max-w-6xl px-8">

    <div className="mt-1 grid gap-5 lg:grid-cols-3">

      {/* PLAN 1 */}

      <div className="relative scale-[0.92] rounded-[24px] border border-border-subtle bg-white p-5 app-dark:border-border-subtle app-dark:bg-surface opacity-50 blur-[1.5px]">

        <span className="absolute right-5 top-5 rounded-full bg-brand-primary px-3 py-1 text-xs font-semibold text-gray-100">
          Coming Soon
        </span>

        <h3 className="text-2xl font-bold">
          Flowex Plus
        </h3>

        <p className="mt-3 text-gray-500 app-dark:text-muted">
          For growing teams needing multiple workflows.
        </p>

        <div className="mt-8">

          <span className="text-5xl font-black">
            —
          </span>

        </div>

        <div className="mt-8 space-y-4 text-muted app-dark:text-muted">

          <p>✓ Multiple Automations</p>

          <p>✓ Team Members</p>

          <p>✓ Advanced Analytics</p>

          <p>✓ Shared Workspace</p>

        </div>

      </div>

      {/* PLAN 2 */}

      <div className="relative rounded-[28px] border-2 border-border-subtle bg-white px-7 py-5 app-dark:bg-surface shadow-md transition-all duration-500 hover:-translate-y-2 hover:shadow-md">

        <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-primary    px-5 py-2 text-sm font-bold text-gray-100 shadow-sm">
          MOST POPULAR
        </span>

        <h3 className="text-3xl font-bold">
          Flowex Pro
        </h3>

        <p className="mt-3 text-gray-500 app-dark:text-muted">
          Everything you need to automate your lead capture.
        </p>

        <div className="mt-8 flex items-end gap-3">

          <span className="text-2xl text-muted app-dark:text-slate-500 line-through">
            $15
          </span>

          <span className="text-5xl font-black">
            $10
          </span>

          <span className="pb-2 text-gray-500 app-dark:text-muted">
            /month
          </span>

        </div>
         <div className="mt-3 inline-flex rounded-full bg-surface-subtle px-3 py-1 text-sm font-semibold text-brand-primary app-dark:bg-surface   app-dark:p-[1px]">
           <span className="rounded-full app-dark:bg-surface app-dark:px-[11px] app-dark:py-[3px] app-dark:text-gray-100">
             • 33% OFF
           </span>
         </div>

        <div className="mt-5 space-y-2 text-gray-700 app-dark:text-gray-100">

          <p>✓ Unlimited Leads</p>

          <p>✓ Instant Customer Replies</p>

          <p>✓ CRM Sync</p>

          <p>✓ Email Notifications</p>

          <p>✓ Live Dashboard</p>

        </div>

        <Link
  href="/checkout"
  className="mt-10 block w-full rounded-2xl bg-brand-primary    py-3.5 text-center font-semibold text-gray-100 transition hover:scale-[1.02]"
>
  Start 7-Day Free Trial
</Link>

        <p className="mt-4 text-center text-sm text-gray-500 app-dark:text-muted">
         7-day free trial • Cancel anytime
        </p>

      </div>

      {/* PLAN 3 */}

      <div className="relative scale-[0.92] rounded-[24px] border border-border-subtle bg-white p-5 app-dark:border-border-subtle app-dark:bg-surface opacity-50 blur-[1.5px]">

        <span className="absolute right-5 top-5 rounded-full bg-brand-primary px-3 py-1 text-xs font-semibold text-gray-100">
          Coming Soon
        </span>

        <h3 className="text-2xl font-bold">
         Flowex 
        </h3>
        <h3 className="text-2xl font-bold">
         Enterprise
        </h3>

        <p className="mt-3 text-gray-500 app-dark:text-muted">
          AI-powered automation and advanced business workflows.
        </p>

        <div className="mt-8">

          <span className="text-5xl font-black">
            Custom
          </span>

        </div>

        <div className="mt-8 space-y-4 text-muted app-dark:text-muted">

          <p>✓ AI Agents</p>

          <p>✓ Custom Integrations</p>

          <p>✓ Priority Support</p>

          <p>✓ Unlimited Workflows</p>

        </div>

      </div>

    </div>

  </div>

</section>

{/* ================= PRODUCT ================= */}

<section
  id="product"
  className="relative scroll-mt-[50px] px-6 py-16 sm:px-6 lg:px-8"
>
  <div className="mx-auto max-w-8xl">

    {/* HEADING */}

    <div className="mx-auto max-w-2xl text-center">
      <h2 className="mt-6 text-5xl font-black">
        <span className="bg-surface     ">
           {" "}PRODUCTS
         </span>
     </h2>

      <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
        Automation that grows with you.
      </h2>

      <p className="mt-3 text-gray-500 app-dark:text-muted">
        Start with lead capture. More Flowex automations are on the way.
      </p>
    </div>

    {/* PRODUCT CARDS */}

    <div className="mt-9 grid gap-5 md:grid-cols-3">

      {/* LEAD CAPTURE */}

      <div className="group relative overflow-hidden rounded-[26px] border border-border-subtle bg-white p-6 app-dark:border-border-subtle/60 app-dark:bg-surface shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-sm">

        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-surface-subtle/30 blur-3xl" />

        <div className="relative">

          <div className="flex items-start justify-between">

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface   text-lg  ">
             ⚡
           </div>

            <span className="flex items-center gap-1.5 rounded-full bg-surface-subtle px-3 py-1 text-xs font-semibold text-brand-primary app-dark:bg-surface   app-dark:p-[1px]">
             <span className="flex items-center gap-1.5 rounded-full app-dark:bg-surface app-dark:px-[11px] app-dark:py-[3px] app-dark:text-gray-100">
               <span className="h-2 w-2 rounded-full bg-surface-subtle" />
                 Available
               </span>
             </span>

          </div>

          <h3 className="mt-6 text-xl font-bold">
            Lead Capture
          </h3>

          <p className="mt-2 text-sm leading-6 text-gray-500 app-dark:text-muted">
            Capture every lead, reply instantly, notify your team and follow up automatically.
          </p>

          <div className="mt-6 border-t border-border-subtle pt-5">

            <a
              href="/checkout"
              className="inline-flex items-center text-sm font-semibold text-brand-primary transition hover:text-brand-primary"
            >
              Get started
              <span className="ml-2">→</span>
            </a>

          </div>

        </div>
      </div>

      {/* AI ASSISTANT */}

      <div className="relative overflow-hidden rounded-[26px] border border-border-subtle bg-white/70 p-6 app-dark:border-border-subtle app-dark:bg-surface/80">

        <div className="absolute inset-0 bg-gray-50/30 app-dark:bg-surface/20" />

        <div className="relative">

          <div className="flex items-start justify-between">

           <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface   text-lg  ">
             ✦
           </div>
            <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500 app-dark:bg-surface   app-dark:p-[1px]">
              <span className="rounded-full app-dark:bg-surface app-dark:px-[11px] app-dark:py-[3px] app-dark:text-gray-100">
               Coming Soon
             </span>
           </span>

          </div>

          <h3 className="mt-6 text-xl font-bold text-gray-700 app-dark:text-gray-100">
            AI Assistant
          </h3>

          <p className="mt-2 text-sm leading-6 text-gray-500 app-dark:text-muted">
            An AI assistant that handles customer questions and conversations automatically.
          </p>

          <div className="mt-6 border-t border-border-subtle pt-5">

            <span className="text-sm font-semibold text-muted app-dark:text-slate-500">
              In development
            </span>

          </div>

        </div>
      </div>

      {/* APPOINTMENT AUTOMATION */}

      <div className="relative overflow-hidden rounded-[26px] border border-border-subtle bg-white/70 p-6 app-dark:border-border-subtle app-dark:bg-surface/80">

        <div className="absolute inset-0 bg-gray-50/30 app-dark:bg-surface/20" />

        <div className="relative">

          <div className="flex items-start justify-between">

           <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface   text-lg  ">
             ◷
           </div>
            <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500 app-dark:bg-surface   app-dark:p-[1px]">
              <span className="rounded-full app-dark:bg-surface app-dark:px-[11px] app-dark:py-[3px] app-dark:text-gray-100">
               Coming Soon
             </span>
           </span>

          </div>

          <h3 className="mt-6 text-xl font-bold text-gray-700 app-dark:text-gray-100">
            Appointment Automation
          </h3>

          <p className="mt-2 text-sm leading-6 text-gray-500 app-dark:text-muted">
            Automate bookings, confirmations and reminders without the manual work.
          </p>

          <div className="mt-6 border-t border-border-subtle pt-5">

            <span className="text-sm font-semibold text-muted app-dark:text-slate-500">
              Coming soon
            </span>

          </div>

        </div>
      </div>

    </div>

  </div>
</section>

      {/* ================= HOW IT WORKS ================= */}

      <section
        id="solutions"
       className="relative scroll-mt-[95px] border-y border-border-subtle bg-surface-subtle/70 app-dark:border-border-subtle app-dark:bg-surface/60 py-10"
      >    
        <div className="mx-auto max-w-7xl px-8">

          <div className="text-center">

            <h2 className="mt-6 text-5xl font-black">

              Automation in

              <span className="bg-surface     ">

                {" "}4 simple steps

              </span>

            </h2>

          </div>

          <div className="mt-20 grid gap-8 md:grid-cols-2 xl:grid-cols-4">

            {[
              {
                number: "01",
                title: "Connect",
                desc: "Connect your website, forms or CRM in minutes.",
              },
              {
                number: "02",
                title: "Capture",
                desc: "Every customer inquiry enters Flowex instantly.",
              },
              {
                number: "03",
                title: "Respond",
                desc: "Automatic replies are sent within seconds.",
              },
              {
                number: "04",
                title: "Grow",
                desc: "Your team stays informed while Flowex keeps working.",
              },
            ].map((step) => (

              <div
                key={step.number}
                className="rounded-[30px] border border-border-subtle bg-white p-8 app-dark:border-border-subtle app-dark:bg-surface shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-md"
              >

                <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-primary    text-xl font-bold text-gray-100">

                  {step.number}

                </div>

                <h3 className="text-2xl font-bold">

                  {step.title}

                </h3>

                <p className="mt-4 leading-8 text-muted app-dark:text-muted">

                  {step.desc}

                </p>

              </div>

            ))}

          </div>

        </div>

      </section>
{/* ================= SIMPLE PLAN ================= */}

<section className="relative overflow-hidden bg-surface       py-8">

  <div className="relative z-10 mx-auto max-w-5xl px-6 lg:px-8">

    <div className="text-center">

      <h2 className="text-3xl font-black">
        One plan.
        <span className="bg-surface     ">
          {" "}Everything included.
        </span>
      </h2>

      <p className="mt-2 text-sm text-gray-500 app-dark:text-muted">
        No hidden fees. No contracts. Cancel anytime.
      </p>

    </div>

    <div className="mx-auto mt-6 max-w-3xl rounded-[26px] border border-border-subtle/80 bg-white/90 app-dark:border-border-subtle app-dark:bg-surface/90 px-8 py-6 shadow-sm backdrop-blur">

      <div className="grid items-center gap-8 md:grid-cols-[0.8fr_1.2fr]">

        {/* PRICE */}

        <div className="text-center md:text-left">

          <h3 className="text-xl font-bold">
            Flowex Pro
          </h3>

          <div className="mt-3 flex items-end justify-center gap-2 md:justify-start">

            <span className="text-lg text-muted app-dark:text-slate-500 line-through">
              $15
            </span>

            <span className="text-5xl font-black">
              $10
            </span>

            <span className="pb-1 text-sm text-gray-500 app-dark:text-muted">
              /month
            </span>

          </div>

          <div className="mt-3 inline-flex rounded-full bg-surface-subtle px-3 py-1 text-sm font-semibold text-brand-primary app-dark:bg-surface   app-dark:p-[1px]">
            <span className="rounded-full app-dark:bg-surface app-dark:px-[11px] app-dark:py-[3px] app-dark:text-gray-100">
             • Save 33%
           </span>
         </div>

        </div>

        {/* FEATURES */}

        <div>

          <div className="grid grid-cols-2 gap-x-5 gap-y-2.5 text-sm text-gray-700 app-dark:text-gray-100">

            <span>✓ Unlimited Leads</span>
            <span>✓ Instant Replies</span>
            <span>✓ CRM Integration</span>
            <span>✓ Notifications</span>
            <span>✓ Live Dashboard</span>
            <span>✓ Cancel Anytime</span>

          </div>

          <Link
  href="/checkout"
  className="mt-5 block w-full rounded-xl bg-brand-primary    py-3 text-center font-semibold text-gray-100 shadow-sm transition-all duration-300 hover:-translate-y-0.5"
>
  Start 7-Day Free Trial
</Link>

          <p className="mt-2 text-center text-xs text-muted app-dark:text-slate-500">
            7-day free trial • Cancel anytime
          </p>

        </div>

      </div>

    </div>

  </div>

</section>
{/* ================= FAQ ================= */}

<section id="faq" className=" py-9">

  <div className="mx-auto max-w-6xl px-8">

    <div className="text-center">

      <h2 className="mt-6 text-5xl font-black">
        Frequently Asked
        <span className="bg-surface     ">
          {" "}Questions
        </span>
      </h2>

      <p className="mt-5 text-lg text-muted app-dark:text-muted">
        Everything you need to know before getting started.
      </p>

    </div>

    <div className="mt-14 space-y-5">

      {[
        {
          q: "How long does setup take?",
          a: "Most businesses are connected and receiving leads in under 2 minutes.",
        },
        {
          q: "Do I need coding experience?",
          a: "No. Flowex is built for non-technical users. Just connect your apps and you're ready.",
        },
        {
          q: "Can I cancel anytime?",
          a: "Yes. There are no contracts or hidden fees. Cancel whenever you want.",
        },
        {
          q: "Which platforms can I connect?",
          a: "Website forms, Facebook, Instagram, WhatsApp, CRM systems, Slack and more.",
        },
      ].map((faq) => (

        <details
          key={faq.q}
          className="group rounded-3xl border border-border-subtle bg-white p-7 app-dark:border-border-subtle app-dark:bg-surface shadow-sm transition hover:shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-md"
        >

          <summary className="cursor-pointer list-none text-lg font-bold flex items-center justify-between">

            {faq.q}

            <span className="text-2xl transition group-open:rotate-45">
              +
            </span>

          </summary>

          <p className="mt-5 leading-8 text-muted app-dark:text-muted">
            {faq.a}
          </p>

        </details>

      ))}

    </div>

  </div>

</section>
{/* ================= FOOTER ================= */}

<footer className="border-t border-border-subtle/70 bg-white/85 backdrop-blur-xl app-dark:border-border-subtle/80 app-dark:bg-surface">
  <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">

    {/* LEFT */}

    <div className="flex items-center gap-4">
      <Image
        src="/flowex-logo-brand.png"
        alt="Flowex"
        width={110}
        height={30}
      />

      <span className="hidden text-sm text-muted app-dark:text-gray-100 lg:block">
        Automate your business.
      </span>
    </div>

    {/* LINKS */}

    <div className="flex items-center gap-6 text-sm font-medium text-gray-500 app-dark:text-gray-100">

      <a
        href="#pricing"
        className="transition-colors hover:text-foreground app-dark:hover:text-gray-100"
      >
        Pricing
      </a>

      <a
        href="/resources"
        className="transition-colors hover:text-foreground app-dark:hover:text-gray-100"
      >
        Resources
      </a>

      <a
        href="/contact"
        className="transition-colors hover:text-foreground app-dark:hover:text-gray-100"
      >
        Contact
      </a>

      <a
        href="/privacy"
        className="transition-colors hover:text-foreground app-dark:hover:text-gray-100"
      >
        Privacy
      </a>

      <a
        href="/terms"
        className="transition-colors hover:text-foreground app-dark:hover:text-gray-100"
      >
        Terms
      </a>

    </div>

    {/* COPYRIGHT */}

    <p className="text-xs text-muted app-dark:text-muted">
      © 2026 Flowex. All rights reserved.
    </p>

  </div>
</footer>

       </main>
  </RouteGuard>
);
}