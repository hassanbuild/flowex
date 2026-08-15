"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppAccount } from "@/components/AppAccountProvider";
import { useEffect, useState } from "react";

type SourceType = "flowex" | "website" | "link";
type StorageType = "sheets" | "airtable" | "slack";
type ReplyType = "instant" | "friendly" | "custom";

export default function ManageLeadCapturePage() {
  const { plan } = useAppAccount();
  const router = useRouter();

  const hasPremiumAccess =
    plan === "trial" || plan === "pro";

  useEffect(() => {
    if (!hasPremiumAccess) {
      router.replace("/home");
    }
  }, [hasPremiumAccess, router]);

  const [active, setActive] = useState(true);

  const [sourceType, setSourceType] = useState<SourceType>("flowex");
  const [sourceLink, setSourceLink] = useState("");
  const [linkError, setLinkError] = useState("");

  const [storageType, setStorageType] =
    useState<StorageType>("sheets");

  const [storageDestination, setStorageDestination] =
    useState("");

  const [replyType, setReplyType] =
    useState<ReplyType>("instant");

  const [customReply, setCustomReply] = useState(
    "Thanks for reaching out. We’ve received your message and will get back to you shortly."
  );

  const [companyEmail, setCompanyEmail] = useState("");

  const [followUpEnabled, setFollowUpEnabled] =
    useState(true);

  const [followUpDelay, setFollowUpDelay] =
    useState("24");

  const [followUpMessage, setFollowUpMessage] =
    useState(
      "Just following up in case you missed our previous message. Let us know if you have any questions."
    );

  useEffect(() => {
    const saved = localStorage.getItem(
      "flowex-lead-capture"
    );

    if (!saved) return;

    const data = JSON.parse(saved);

    setActive(data.active ?? true);
    setSourceType(data.sourceType || "flowex");
    setSourceLink(data.sourceLink || "");
    setStorageType(data.storageType || "sheets");
    setStorageDestination(
      data.storageDestination || ""
    );
    setReplyType(data.replyType || "instant");
    setCustomReply(data.customReply || "");
    setCompanyEmail(data.companyEmail || "");
    setFollowUpEnabled(
      data.followUpEnabled ?? true
    );
    setFollowUpDelay(
      data.followUpDelay || "24"
    );
    setFollowUpMessage(
      data.followUpMessage || ""
    );
  }, []);

  const validateLink = () => {
    if (!sourceLink) {
      setLinkError("Enter a link first.");
      return false;
    }

    try {
      const url = new URL(sourceLink);

      if (
        url.protocol !== "https:" &&
        url.protocol !== "http:"
      ) {
        throw new Error();
      }

      setLinkError("");
      return true;
    } catch {
      setLinkError(
        "Enter a valid website URL."
      );

      return false;
    }
  };

  const replyTemplates = {
    instant:
      "Thanks for reaching out. We’ve received your message and will get back to you shortly.",

    friendly:
      "Hey! Thanks for contacting us. Your message is in, and someone from our team will be with you soon.",

    custom: customReply,
  };

  const saveChanges = () => {
    if (sourceType === "link" && !validateLink()) {
      return;
    }

    const currentReply =
      replyType === "custom"
        ? customReply
        : replyTemplates[replyType];

    const automationData = {
      active,
      sourceType,
      sourceLink,
      storageType,
      storageDestination,
      replyType,
      replyMessage: currentReply,
      companyEmail,
      followUpEnabled,
      followUpDelay,
      followUpMessage,
    };

    localStorage.setItem(
      "flowex-lead-capture",
      JSON.stringify(automationData)
    );

    alert("Automation saved successfully!");
  };

  if (!hasPremiumAccess) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#f7f9fb] text-gray-900 transition-colors duration-300 app-dark:bg-[#0b0f14] app-dark:text-slate-100">

      {/* NAVBAR */}

      <header className="sticky top-0 z-50 border-b border-gray-200/70 bg-white/90 backdrop-blur-xl transition-colors duration-300 app-dark:border-slate-800/80 app-dark:bg-[linear-gradient(90deg,#0b0f14_0%,#172033_8%,#252b70_25%,#006454_50%,#252b70_75%,#172033_92%,#0b0f14_100%)]">

        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-6 lg:px-8">

          <Link href="/dashboard">
            <Image
              src="/flowex-logo.png"
              alt="Flowex"
              width={120}
              height={34}
              priority
            />
          </Link>

          <div className="flex items-center gap-3">

            <Link
              href="/lead-capture/dashboard"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 app-dark:text-slate-300 app-dark:hover:bg-white/10 app-dark:hover:text-white"
            >
              Back
            </Link>

            <button
              onClick={saveChanges}
              className="rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5"
            >
              Save Automation
            </button>

          </div>

        </div>

      </header>

      {/* PAGE */}

      <section className="px-4 py-10 sm:px-6 lg:px-8">

        <div className="mx-auto max-w-4xl">

          {/* HEADER */}

          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">

            <div>

              <p className="text-sm font-semibold text-emerald-600 app-dark:text-emerald-400">
                LEAD CAPTURE
              </p>

              <h1 className="mt-2 text-3xl font-black sm:text-4xl app-dark:text-white">
                Automation Flow
              </h1>

              <p className="mt-2 max-w-xl text-gray-500 app-dark:text-slate-400">
                Build your lead workflow from capture to follow-up.
              </p>

            </div>

            <button
              type="button"
              onClick={() => setActive(!active)}
              className={`rounded-xl px-5 py-3 text-sm font-semibold shadow-sm transition-all hover:-translate-y-0.5 ${
                active
                  ? "border border-red-200 bg-white text-red-600 hover:bg-red-50 app-dark:border-red-500/30 app-dark:bg-[#11161d] app-dark:text-red-400 app-dark:hover:bg-red-500/10"
                  : "bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 text-white shadow-md"
              }`}
            >
              {active ? "Pause Automation" : "Resume Automation"}
            </button>

          </div>

          {/* PAUSED BANNER */}

          {!active && (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800 app-dark:border-amber-500/30 app-dark:bg-amber-500/10 app-dark:text-amber-300">
              Automation is paused. New leads will not be processed until you resume it.
            </div>
          )}

          {/* FLOW */}

          <div className="relative mt-10">

            {/* vertical connector */}

            <div className="absolute bottom-20 left-[31px] top-20 w-px bg-gradient-to-b from-emerald-300 via-cyan-300 to-indigo-300 sm:left-[39px]" />

            {/* ================= STEP 1 ================= */}

            <FlowStep
              number="01"
              title="Capture Lead"
              description="Choose how new leads enter Flowex."
            >

              <div className="grid gap-3 sm:grid-cols-3">

                <Option
                  active={
                    sourceType === "flowex"
                  }
                  onClick={() =>
                    setSourceType("flowex")
                  }
                  title="Flowex Form"
                  description="Create a ready-to-use form."
                />

                <Option
                  active={
                    sourceType === "website"
                  }
                  onClick={() =>
                    setSourceType("website")
                  }
                  title="Website Form"
                  description="Connect an existing form."
                />

                <Option
                  active={
                    sourceType === "link"
                  }
                  onClick={() =>
                    setSourceType("link")
                  }
                  title="Connect Link"
                  description="Use a valid form or page URL."
                />

              </div>

              {sourceType === "flowex" && (
                <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4 app-dark:border-slate-700 app-dark:bg-[#0b0f14]">

                  <div className="flex items-center justify-between">

                    <div>

                      <p className="font-semibold app-dark:text-white">
                        Flowex Lead Form
                      </p>

                      <p className="mt-1 text-sm text-gray-500 app-dark:text-slate-400">
                        Name, email, phone and message fields included.
                      </p>

                    </div>

                    <button className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 app-dark:border-slate-700 app-dark:bg-[#11161d] app-dark:text-slate-300">
                      Customize
                    </button>

                  </div>

                </div>
              )}

              {sourceType === "website" && (
                <div className="mt-5">

                  <input
                    type="url"
                    placeholder="https://yourwebsite.com/contact"
                    value={sourceLink}
                    onChange={(e) =>
                      setSourceLink(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 app-dark:border-slate-700 app-dark:bg-[#0b0f14] app-dark:text-white app-dark:placeholder:text-slate-500 app-dark:focus:border-cyan-500 app-dark:focus:ring-cyan-500/10"
                  />

                  <p className="mt-2 text-xs text-gray-400 app-dark:text-slate-500">
                    Flowex will later detect compatible form fields automatically.
                  </p>

                </div>
              )}

              {sourceType === "link" && (
                <div className="mt-5">

                  <div className="flex gap-3">

                    <input
                      type="url"
                      placeholder="https://..."
                      value={sourceLink}
                      onChange={(e) => {
                        setSourceLink(
                          e.target.value
                        );
                        setLinkError("");
                      }}
                      className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 app-dark:border-slate-700 app-dark:bg-[#0b0f14] app-dark:text-white app-dark:placeholder:text-slate-500 app-dark:focus:border-cyan-500 app-dark:focus:ring-cyan-500/10"
                    />

                    <button
                      type="button"
                      onClick={validateLink}
                      className="rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-600 hover:bg-gray-50 app-dark:border-slate-700 app-dark:bg-[#11161d] app-dark:text-slate-300 app-dark:hover:bg-slate-800"
                    >
                      Connect
                    </button>

                  </div>

                  {linkError && (
                    <p className="mt-2 text-sm text-red-500 app-dark:text-red-400">
                      {linkError}
                    </p>
                  )}

                </div>
              )}

            </FlowStep>

            <Arrow />

            {/* ================= STEP 2 ================= */}

            <FlowStep
              number="02"
              title="Store Lead"
              description="Choose where captured lead data should be sent."
            >

              <div className="grid gap-3 sm:grid-cols-3">

                <Option
                  active={
                    storageType === "sheets"
                  }
                  onClick={() =>
                    setStorageType("sheets")
                  }
                  title="Google Sheets"
                  description="Add each lead as a new row."
                />

                <Option
                  active={
                    storageType ===
                    "airtable"
                  }
                  onClick={() =>
                    setStorageType(
                      "airtable"
                    )
                  }
                  title="Airtable"
                  description="Store leads in your base."
                />

                <Option
                  active={
                    storageType === "slack"
                  }
                  onClick={() =>
                    setStorageType("slack")
                  }
                  title="Slack"
                  description="Send leads to a channel."
                />

              </div>

              <div className="mt-5">

                <input
                  value={storageDestination}
                  onChange={(e) =>
                    setStorageDestination(
                      e.target.value
                    )
                  }
                  placeholder={
                    storageType === "sheets"
                      ? "Google Sheet URL"
                      : storageType ===
                        "airtable"
                      ? "Airtable base URL"
                      : "Slack channel or workspace"
                  }
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 app-dark:border-slate-700 app-dark:bg-[#0b0f14] app-dark:text-white app-dark:placeholder:text-slate-500 app-dark:focus:border-cyan-500 app-dark:focus:ring-cyan-500/10"
                />

                <p className="mt-2 text-xs text-gray-400 app-dark:text-slate-500">
                  Flowex will map detected form fields to matching columns automatically.
                </p>

              </div>

            </FlowStep>

            <Arrow />

            {/* ================= STEP 3 ================= */}

            <FlowStep
              number="03"
              title="Reply Automatically"
              description="Choose what your lead receives immediately."
            >

              <div className="grid gap-3 sm:grid-cols-3">

                <Option
                  active={
                    replyType === "instant"
                  }
                  onClick={() => {
                    setReplyType("instant");
                    setCustomReply(
                      replyTemplates.instant
                    );
                  }}
                  title="Professional"
                  description="Short and business-focused."
                />

                <Option
                  active={
                    replyType === "friendly"
                  }
                  onClick={() => {
                    setReplyType("friendly");
                    setCustomReply(
                      replyTemplates.friendly
                    );
                  }}
                  title="Friendly"
                  description="More casual and welcoming."
                />

                <Option
                  active={
                    replyType === "custom"
                  }
                  onClick={() =>
                    setReplyType("custom")
                  }
                  title="Custom"
                  description="Write your own response."
                />

              </div>

              <textarea
                rows={4}
                value={
                  replyType === "custom"
                    ? customReply
                    : replyTemplates[
                        replyType
                      ]
                }
                onChange={(e) => {
                  setReplyType("custom");
                  setCustomReply(
                    e.target.value
                  );
                }}
                className="mt-5 w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 app-dark:border-slate-700 app-dark:bg-[#0b0f14] app-dark:text-white app-dark:focus:border-cyan-500 app-dark:focus:ring-cyan-500/10"
              />

            </FlowStep>

            <Arrow />

            {/* ================= STEP 4 ================= */}

            <FlowStep
              number="04"
              title="Notify Your Team"
              description="Send a notification whenever a new lead arrives."
            >

              <label className="text-sm font-semibold text-gray-700 app-dark:text-slate-200">
                Company Email
              </label>

              <input
                type="email"
                value={companyEmail}
                onChange={(e) =>
                  setCompanyEmail(
                    e.target.value
                  )
                }
                placeholder="team@company.com"
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 app-dark:border-slate-700 app-dark:bg-[#0b0f14] app-dark:text-white app-dark:placeholder:text-slate-500 app-dark:focus:border-cyan-500 app-dark:focus:ring-cyan-500/10"
              />

            </FlowStep>

            <Arrow />

            {/* ================= STEP 5 ================= */}

            <FlowStep
              number="05"
              title="Follow Up"
              description="Automatically follow up when a lead hasn't replied."
            >

              <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 p-4 app-dark:border-slate-700 app-dark:bg-[#0b0f14]">

                <div>

                  <p className="font-semibold app-dark:text-white">
                    Automated Follow-up
                  </p>

                  <p className="mt-1 text-sm text-gray-500 app-dark:text-slate-400">
                    Send another message after a set delay.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setFollowUpEnabled(
                      !followUpEnabled
                    )
                  }
                  className={`relative h-7 w-12 rounded-full transition ${
                    followUpEnabled
                      ? "bg-emerald-500"
                      : "bg-gray-300 app-dark:bg-slate-600"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                      followUpEnabled
                        ? "left-6"
                        : "left-1"
                    }`}
                  />
                </button>

              </div>

              {followUpEnabled && (
                <div className="mt-5 space-y-4">

                  <div>

                    <label className="text-sm font-semibold text-gray-700 app-dark:text-slate-200">
                      Send after
                    </label>

                    <select
                      value={followUpDelay}
                      onChange={(e) =>
                        setFollowUpDelay(
                          e.target.value
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none app-dark:border-slate-700 app-dark:bg-[#0b0f14] app-dark:text-white"
                    >
                      <option value="1">
                        1 hour
                      </option>

                      <option value="6">
                        6 hours
                      </option>

                      <option value="12">
                        12 hours
                      </option>

                      <option value="24">
                        24 hours
                      </option>

                      <option value="48">
                        48 hours
                      </option>

                    </select>

                  </div>

                  <textarea
                    rows={3}
                    value={followUpMessage}
                    onChange={(e) =>
                      setFollowUpMessage(
                        e.target.value
                      )
                    }
                    className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 app-dark:border-slate-700 app-dark:bg-[#0b0f14] app-dark:text-white app-dark:focus:border-cyan-500 app-dark:focus:ring-cyan-500/10"
                  />

                </div>
              )}

            </FlowStep>

          </div>

          {/* BOTTOM SAVE */}

          <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6 app-dark:border-slate-800">

            <p className="text-sm text-gray-400 app-dark:text-slate-500">
              Changes only apply after saving.
            </p>

            <button
              onClick={saveChanges}
              className="rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 px-7 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5"
            >
              Save Automation
            </button>

          </div>

        </div>

      </section>

    </main>
  );
}

function FlowStep({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex gap-4 sm:gap-6">

      <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-cyan-400 to-indigo-600 text-sm font-black text-white shadow-md sm:h-20 sm:w-20">
        {number}
      </div>

      <div className="min-w-0 flex-1 rounded-[26px] border border-gray-200 bg-white p-6 shadow-sm transition-colors duration-300 sm:p-7 app-dark:border-slate-800 app-dark:bg-[#11161d]">

        <h2 className="text-xl font-bold app-dark:text-white">
          {title}
        </h2>

        <p className="mt-1 text-sm text-gray-500 app-dark:text-slate-400">
          {description}
        </p>

        <div className="mt-6">
          {children}
        </div>

      </div>

    </div>
  );
}

function Option({
  active,
  onClick,
  title,
  description,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition-all ${
        active
          ? "border-cyan-400 bg-cyan-50/60 shadow-sm ring-2 ring-cyan-100 app-dark:border-cyan-500 app-dark:bg-cyan-500/10 app-dark:ring-cyan-500/10"
          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 app-dark:border-slate-700 app-dark:bg-[#0b0f14] app-dark:hover:border-slate-600 app-dark:hover:bg-slate-900"
      }`}
    >

      <p className="text-sm font-bold app-dark:text-white">
        {title}
      </p>

      <p className="mt-1 text-xs leading-5 text-gray-500 app-dark:text-slate-400">
        {description}
      </p>

    </button>
  );
}

function Arrow() {
  return (
    <div className="relative flex h-12 items-center pl-[24px] sm:pl-[32px]">

      <div className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-sm text-gray-400 shadow-sm app-dark:border-slate-700 app-dark:bg-[#11161d] app-dark:text-slate-400">
        ↓
      </div>

    </div>
  );
}