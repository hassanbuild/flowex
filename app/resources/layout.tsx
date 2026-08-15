"use client";

import {
  createContext,
  useContext,
  ReactNode,
} from "react";

import { useAppAccount } from "@/components/AppAccountProvider";
import { useAppTheme } from "@/components/AppThemeProvider";

type ResourcesContextType = {
  isLoggedIn: boolean;
  backPath: string;
  theme: "light" | "dark";
  useAppThemeMode: boolean;
};

const ResourcesContext =
  createContext<ResourcesContextType | undefined>(
    undefined
  );

export default function ResourcesLayout({
  children,
}: {
  children: ReactNode;
}) {
  const {
    isLoggedIn,
    plan,
  } = useAppAccount();

  const {
    theme,
  } = useAppTheme();

  const hasPremiumAccess =
    plan === "trial" || plan === "pro";

  /*
    Resources are available to:

    1. Signed-out visitors
    2. Signed-in Free users
    3. Signed-in Trial users
    4. Signed-in Pro users
  */

  const backPath =
    !isLoggedIn
      ? "/"
      : hasPremiumAccess
        ? "/dashboard"
        : "/home";

  /*
    When signed in:
    use the user's saved Flowex theme.

    When signed out:
    individual resource pages continue
    using the normal system dark/light mode.
  */

  const useAppThemeMode =
    isLoggedIn;

  return (
    <ResourcesContext.Provider
      value={{
        isLoggedIn,
        backPath,
        theme,
        useAppThemeMode,
      }}
    >
      {children}
    </ResourcesContext.Provider>
  );
}

export function useResourcesContext() {
  const context =
    useContext(ResourcesContext);

  if (!context) {
    throw new Error(
      "useResourcesContext must be used inside ResourcesLayout"
    );
  }

  return context;
}