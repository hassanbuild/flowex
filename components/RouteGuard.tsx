"use client";

import {
  ReactNode,
  useEffect,
} from "react";

import { useRouter } from "next/navigation";

import { useAppAccount } from "@/components/AppAccountProvider";

type AccessType =
  | "guest"
  | "signed-in"
  | "free"
  | "premium";

type RouteGuardProps = {
  access: AccessType;
  children: ReactNode;
};

const AUTH_RETURN_KEY =
  "flowex-auth-return-to";

export default function RouteGuard({
  access,
  children,
}: RouteGuardProps) {
  const router = useRouter();

  const {
    isLoggedIn,
    plan,
    authReady,
  } = useAppAccount();

  const hasPremiumAccess =
    plan === "trial" || plan === "pro";

  useEffect(() => {
    if (!authReady) {
      return;
    }

    /* ================= GUEST ONLY ================= */

    if (access === "guest") {
      if (isLoggedIn) {
        /*
          If this exact browser tab came from
          checkout, return it to checkout.

          sessionStorage is tab-specific, so the
          separate verification-email tab will not
          normally contain this value and will use
          the normal Flowex redirect instead.
        */

        const savedReturnTo =
          sessionStorage.getItem(
            AUTH_RETURN_KEY
          );

        if (
          savedReturnTo === "/checkout"
        ) {
          router.replace("/checkout");
          return;
        }

        router.replace(
          hasPremiumAccess
            ? "/dashboard"
            : "/home"
        );
      }

      return;
    }

    /* ================= SIGNED-IN ONLY ================= */

    if (access === "signed-in") {
      if (!isLoggedIn) {
        router.replace("/");
      }

      return;
    }

    /* ================= FREE ONLY ================= */

    if (access === "free") {
      if (!isLoggedIn) {
        router.replace("/");
        return;
      }

      if (hasPremiumAccess) {
        router.replace("/dashboard");
      }

      return;
    }

    /* ================= PREMIUM ONLY ================= */

    if (access === "premium") {
      if (!isLoggedIn) {
        router.replace("/");
        return;
      }

      if (!hasPremiumAccess) {
        router.replace("/home");
      }
    }
  }, [
    access,
    authReady,
    hasPremiumAccess,
    isLoggedIn,
    router,
  ]);

  /* ================= AUTH LOADING ================= */

  if (!authReady) {
    return (
      <main className="min-h-screen bg-[#f8fafc] app-dark:bg-[#0b0f14]" />
    );
  }

  /* ================= GUEST ONLY ================= */

  if (access === "guest") {
    if (isLoggedIn) {
      return (
        <main className="min-h-screen bg-[#f8fafc] app-dark:bg-[#0b0f14]" />
      );
    }

    return <>{children}</>;
  }

  /* ================= SIGNED-IN ONLY ================= */

  if (access === "signed-in") {
    if (!isLoggedIn) {
      return (
        <main className="min-h-screen bg-[#f8fafc] dark:bg-[#0b0f14]" />
      );
    }

    return <>{children}</>;
  }

  /* ================= FREE ONLY ================= */

  if (access === "free") {
    if (
      !isLoggedIn ||
      hasPremiumAccess
    ) {
      return (
        <main className="min-h-screen bg-[#f8fafc] app-dark:bg-[#0b0f14]" />
      );
    }

    return <>{children}</>;
  }

  /* ================= PREMIUM ONLY ================= */

  if (access === "premium") {
    if (
      !isLoggedIn ||
      !hasPremiumAccess
    ) {
      return (
        <main className="min-h-screen bg-[#f8fafc] app-dark:bg-[#0b0f14]" />
      );
    }

    return <>{children}</>;
  }

  return null;
}