"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAppAccount } from "@/components/AppAccountProvider";
import RouteGuard from "@/components/RouteGuard";
import { createClient } from "@/lib/supabase/client";
import { FlowexAppShell } from "@/components/FlowexAppShell";

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
  const [isDeleting, setIsDeleting] = useState(false);


  const saveChanges = () => {
    saveAccount();
    alert("Changes saved!");
  };

  const deleteAccount = async () => {
    if (
      isDeleting ||
      !window.confirm(
        "Delete your Flowex account and stored Flowex data? This cannot be undone. External integration data and subscriptions are not deleted."
      )
    ) {
      return;
    }

    setIsDeleting(true);

    try {
      const supabase = createClient();
      const {
        data: {
          session,
        },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Your session could not be verified.");
      }

      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Flowex could not delete this account.");
      }

      await supabase.auth.signOut({
        scope: "local",
      });

      window.location.assign("/");
    } catch (error) {
      console.error("Flowex account deletion error:", error);
      alert("Flowex could not delete this account. Please try again.");
      setIsDeleting(false);
    }
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
      <main className="min-h-screen bg-background text-foreground transition-colors duration-300 app-dark:bg-surface app-dark:text-gray-100">
      <FlowexAppShell />

      {/* ================= NAVBAR ================= */}

      <header className="border-b border-border-subtle/70 bg-white/90 backdrop-blur-xl transition-colors duration-300 app-dark:border-border-subtle/80 app-dark:bg-surface">

        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-6 lg:px-8">

          <Link href={returnPath}>
            <Image
              src="/flowex-logo-brand.png"
              alt="Flowex"
              width={120}
              height={34}
              priority
            />
          </Link>

          <Link
            href={returnPath}
            className="rounded-xl border border-border-subtle bg-white px-4 py-2 text-sm font-semibold text-muted transition hover:bg-gray-50 app-dark:border-border-subtle app-dark:bg-surface app-dark:text-muted app-dark:hover:bg-surface"
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

            <p className="text-sm font-semibold text-brand-primary app-dark:text-brand-primary">
              ACCOUNT
            </p>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl app-dark:text-gray-100">
              Your Account
            </h1>

            <p className="mt-2 text-gray-500 app-dark:text-muted">
              Manage your personal information and profile.
            </p>

          </div>

          {/* ================= MAIN CARD ================= */}

          <div className="mt-8 rounded-[28px] border border-border-subtle bg-white p-6 shadow-sm transition-colors duration-300 sm:p-8 app-dark:border-border-subtle app-dark:bg-surface">

            {/* ================= PROFILE PICTURE ================= */}

            <div className="flex flex-col gap-6 border-b border-border-subtle pb-8 sm:flex-row sm:items-center app-dark:border-border-subtle">

              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-surface    shadow-sm">

                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl font-black text-gray-100">
                    {name.charAt(0).toUpperCase() || "H"}
                  </div>
                )}

              </div>

              <div>

                <h2 className="text-lg font-bold app-dark:text-gray-100">
                  Profile Picture
                </h2>

                <p className="mt-1 text-sm text-gray-500 app-dark:text-muted">
                  Upload your own photo or choose a Flowex avatar.
                </p>

                <div className="mt-4 flex flex-wrap gap-3">

                  {/* UPLOAD PHOTO */}

                  <label className="cursor-pointer rounded-xl border border-border-subtle bg-white px-4 py-2.5 text-sm font-semibold text-muted transition hover:bg-gray-50 app-dark:border-border-subtle app-dark:bg-surface app-dark:text-muted app-dark:hover:bg-surface">

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
                    className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-semibold text-muted transition hover:bg-gray-200 app-dark:bg-surface app-dark:text-muted app-dark:hover:bg-slate-700"
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
              <div className="border-b border-border-subtle py-7 app-dark:border-border-subtle">

                <p className="text-sm font-semibold text-gray-700 app-dark:text-gray-100">
                  Flowex Avatars
                </p>

                <p className="mt-1 text-xs text-muted app-dark:text-slate-500">
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
                      className="relative h-14 w-14 overflow-hidden rounded-full border-2 border-transparent transition hover:scale-105 hover:border-border-subtle"
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

                <label className="mb-2 block text-sm font-semibold text-gray-700 app-dark:text-gray-100">
                  Name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  className="w-full rounded-xl border border-border-subtle bg-white px-4 py-3 outline-none transition focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/20 app-dark:border-border-subtle app-dark:bg-surface app-dark:text-gray-100 app-dark:focus:border-brand-primary app-dark:focus:ring-brand-primary/10"
                />

              </div>

              {/* EMAIL */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-gray-700 app-dark:text-gray-100">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  className="w-full rounded-xl border border-border-subtle bg-white px-4 py-3 outline-none transition focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/20 app-dark:border-border-subtle app-dark:bg-surface app-dark:text-gray-100 app-dark:focus:border-brand-primary app-dark:focus:ring-brand-primary/10"
                />

              </div>

              {/* PHONE */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-gray-700 app-dark:text-gray-100">
                  Phone Number
                </label>

                <input
                  type="tel"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value)
                  }
                  placeholder="+1 234 567 8900"
                  className="w-full rounded-xl border border-border-subtle bg-white px-4 py-3 outline-none transition focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/20 app-dark:border-border-subtle app-dark:bg-surface app-dark:text-gray-100 app-dark:placeholder:text-muted app-dark:focus:border-brand-primary app-dark:focus:ring-brand-primary/10"
                />

              </div>

              {/* ================= CURRENT PLAN ================= */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-gray-700 app-dark:text-gray-100">
                  Current Plan
                </label>

                <div className="flex h-[50px] items-center justify-between rounded-xl border border-border-subtle bg-gray-50 px-4 app-dark:border-border-subtle app-dark:bg-surface">

                  <span className="font-semibold app-dark:text-gray-100">
                    {planName}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      plan === "pro"
                        ? "bg-surface-subtle text-brand-primary app-dark:bg-surface-subtle/10 app-dark:text-brand-primary"
                        : plan === "trial"
                          ? "bg-surface-subtle text-brand-primary app-dark:bg-surface-subtle/10 app-dark:text-brand-primary"
                          : "bg-gray-200 text-muted app-dark:bg-surface app-dark:text-muted"
                    }`}
                  >
                    {planLabel}
                  </span>

                </div>

              </div>

            </div>

            {/* ================= ACTIONS ================= */}

            <div className="flex flex-col-reverse gap-3 border-t border-border-subtle pt-6 sm:flex-row sm:items-center sm:justify-between app-dark:border-border-subtle">

              {/* DELETE */}

              <button
                type="button"
                onClick={deleteAccount}
                disabled={isDeleting}
                className="rounded-xl border border-red-200 bg-white px-5 py-3 text-sm font-semibold text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 app-dark:border-red-500/30 app-dark:bg-surface app-dark:text-red-400 app-dark:hover:bg-red-500/10"
              >
                Delete Account
              </button>

              {/* SAVE */}

              <button
                type="button"
                onClick={saveChanges}
                className="rounded-xl bg-brand-primary    px-6 py-3 text-sm font-semibold text-gray-100 shadow-sm transition hover:-translate-y-0.5"
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
