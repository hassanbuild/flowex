"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAppAccount } from "@/components/AppAccountProvider";
import RouteGuard from "@/components/RouteGuard";

const avatars = [
  "/avatars/avatar-1.png",
  "/avatars/avatar-2.png",
  "/avatars/avatar-3.png",
  "/avatars/avatar-4.png",
];

function AccountPageContent() {
  const searchParams = useSearchParams();

  const {
    name,
    email,
    phone,
    profileImage,
    plan,
    setName,
    setEmail,
    setPhone,
    setProfileImage,
    saveAccount,
  } = useAppAccount();

  const [showAvatars, setShowAvatars] = useState(false);


  const saveChanges = () => {
    saveAccount();
    alert("Changes saved!");
  };

  const hasPremiumAccess =
    plan === "trial" || plan === "pro";

  const fromLeadCapture =
    searchParams.get("from") === "lead-capture";

  const returnPath =
    fromLeadCapture
      ? "/lead-capture/dashboard"
      : hasPremiumAccess
        ? "/dashboard"
        : "/home";

  const returnLabel =
    fromLeadCapture
      ? "Lead Capture"
      : hasPremiumAccess
        ? "Dashboard"
        : "Home";

  const planName =
    plan === "pro"
      ? "Flowex Pro"
      : plan === "trial"
        ? "Flowex Pro Trial"
        : "Free";

  const planLabel =
    plan === "pro"
      ? "$10/month"
      : plan === "trial"
        ? "7-day trial"
        : "No active plan";


  return (
    <RouteGuard access="signed-in">
      <main className="min-h-screen bg-[#f8fafc] text-gray-900 transition-colors duration-300 app-dark:bg-[#0b0f14] app-dark:text-slate-100">

      {/* ================= NAVBAR ================= */}

      <header className="border-b border-gray-200/70 bg-white/90 backdrop-blur-xl transition-colors duration-300 app-dark:border-slate-800/80 app-dark:bg-[linear-gradient(90deg,#0b0f14_0%,#172033_8%,#252b70_25%,#006454_50%,#252b70_75%,#172033_92%,#0b0f14_100%)]">

        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-6 lg:px-8">

          <Link href={returnPath}>
            <Image
              src="/flowex-logo.png"
              alt="Flowex"
              width={120}
              height={34}
              priority
            />
          </Link>

          <Link
            href={returnPath}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 app-dark:border-slate-700 app-dark:bg-[#11161d] app-dark:text-slate-300 app-dark:hover:bg-slate-800"
          >
            Back
          </Link>

        </div>

      </header>

      {/* ================= ACCOUNT ================= */}

      <section className="px-4 py-10 sm:px-6 lg:px-8">

        <div className="mx-auto max-w-4xl">

          {/* Heading */}

          <div>

            <p className="text-sm font-semibold text-emerald-600 app-dark:text-emerald-400">
              ACCOUNT
            </p>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl app-dark:text-white">
              Your Account
            </h1>

            <p className="mt-2 text-gray-500 app-dark:text-slate-400">
              Manage your personal information and profile.
            </p>

          </div>

          {/* ================= MAIN CARD ================= */}

          <div className="mt-8 rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm transition-colors duration-300 sm:p-8 app-dark:border-slate-800 app-dark:bg-[#11161d]">

            {/* ================= PROFILE PICTURE ================= */}

            <div className="flex flex-col gap-6 border-b border-gray-100 pb-8 sm:flex-row sm:items-center app-dark:border-slate-800">

              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 shadow-lg">

                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl font-black text-white">
                    {name.charAt(0).toUpperCase() || "H"}
                  </div>
                )}

              </div>

              <div>

                <h2 className="text-lg font-bold app-dark:text-white">
                  Profile Picture
                </h2>

                <p className="mt-1 text-sm text-gray-500 app-dark:text-slate-400">
                  Upload your own photo or choose a Flowex avatar.
                </p>

                <div className="mt-4 flex flex-wrap gap-3">

                  {/* UPLOAD PHOTO */}

                  <label className="cursor-pointer rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 app-dark:border-slate-700 app-dark:bg-[#0b0f14] app-dark:text-slate-300 app-dark:hover:bg-slate-800">

                    Upload Photo

                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];

                        if (!file) return;

                        const reader = new FileReader();

                        reader.onloadend = () => {
                          setProfileImage(
                            reader.result as string
                          );
                        };

                        reader.readAsDataURL(file);
                      }}
                    />

                  </label>

                  {/* CHOOSE AVATAR */}

                  <button
                    type="button"
                    className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-200 app-dark:bg-slate-800 app-dark:text-slate-300 app-dark:hover:bg-slate-700"
                    onClick={() =>
                      setShowAvatars(!showAvatars)
                    }
                  >
                    Choose Avatar
                  </button>

                </div>

              </div>

            </div>

            {/* ================= AVATARS ================= */}

            {showAvatars && (
              <div className="border-b border-gray-100 py-7 app-dark:border-slate-800">

                <p className="text-sm font-semibold text-gray-700 app-dark:text-slate-200">
                  Flowex Avatars
                </p>

                <p className="mt-1 text-xs text-gray-400 app-dark:text-slate-500">
                  Choose a prebuilt avatar for your profile.
                </p>

                <div className="mt-4 flex flex-wrap gap-3">

                  {avatars.map((avatar, index) => (
                    <button
                      key={avatar}
                      type="button"
                      onClick={() => {
                        setProfileImage(avatar);
                        setShowAvatars(false);
                      }}
                      className="relative h-14 w-14 overflow-hidden rounded-full border-2 border-transparent transition hover:scale-105 hover:border-cyan-400"
                    >
                      <Image
                        src={avatar}
                        alt={`Avatar ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}

                </div>

              </div>
            )}

            {/* ================= INFORMATION ================= */}

            <div className="grid gap-5 py-7 sm:grid-cols-2">

              {/* NAME */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-gray-700 app-dark:text-slate-200">
                  Name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 app-dark:border-slate-700 app-dark:bg-[#0b0f14] app-dark:text-white app-dark:focus:border-cyan-500 app-dark:focus:ring-cyan-500/10"
                />

              </div>

              {/* EMAIL */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-gray-700 app-dark:text-slate-200">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 app-dark:border-slate-700 app-dark:bg-[#0b0f14] app-dark:text-white app-dark:focus:border-cyan-500 app-dark:focus:ring-cyan-500/10"
                />

              </div>

              {/* PHONE */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-gray-700 app-dark:text-slate-200">
                  Phone Number
                </label>

                <input
                  type="tel"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value)
                  }
                  placeholder="+1 234 567 8900"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 app-dark:border-slate-700 app-dark:bg-[#0b0f14] app-dark:text-white app-dark:placeholder:text-slate-500 app-dark:focus:border-cyan-500 app-dark:focus:ring-cyan-500/10"
                />

              </div>

              {/* ================= CURRENT PLAN ================= */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-gray-700 app-dark:text-slate-200">
                  Current Plan
                </label>

                <div className="flex h-[50px] items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 app-dark:border-slate-700 app-dark:bg-[#0b0f14]">

                  <span className="font-semibold app-dark:text-white">
                    {planName}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      plan === "pro"
                        ? "bg-emerald-100 text-emerald-700 app-dark:bg-emerald-500/10 app-dark:text-emerald-400"
                        : plan === "trial"
                          ? "bg-cyan-100 text-cyan-700 app-dark:bg-cyan-500/10 app-dark:text-cyan-400"
                          : "bg-gray-200 text-gray-600 app-dark:bg-slate-800 app-dark:text-slate-300"
                    }`}
                  >
                    {planLabel}
                  </span>

                </div>

              </div>

            </div>

            {/* ================= ACTIONS ================= */}

            <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-between app-dark:border-slate-800">

              {/* DELETE */}

              <button className="rounded-xl border border-red-200 bg-white px-5 py-3 text-sm font-semibold text-red-500 transition hover:bg-red-50 app-dark:border-red-500/30 app-dark:bg-[#11161d] app-dark:text-red-400 app-dark:hover:bg-red-500/10">
                Delete Account
              </button>

              {/* SAVE */}

              <button
                type="button"
                onClick={saveChanges}
                className="rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5"
              >
                Save Changes
              </button>

            </div>

          </div>

        </div>

      </section>

      </main>
    </RouteGuard>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={null}>
      <AccountPageContent />
    </Suspense>
  );
}