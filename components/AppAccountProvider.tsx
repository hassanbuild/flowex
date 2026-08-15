"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

import { createClient } from "@/lib/supabase/client";

type Plan = "free" | "trial" | "pro";

type AccountContextType = {
  name: string;
  email: string;
  phone: string;
  profileImage: string | null;

  plan: Plan;

  isLoggedIn: boolean;
  authReady: boolean;

  setName: (name: string) => void;
  setEmail: (email: string) => void;
  setPhone: (phone: string) => void;
  setProfileImage: (image: string | null) => void;

  setPlan: (plan: Plan) => void;
  setIsLoggedIn: (loggedIn: boolean) => void;

  saveAccount: () => void;
};

const AccountContext = createContext<AccountContextType | undefined>(
  undefined
);

export function AppAccountProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [supabase] = useState(() => createClient());

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [profileImage, setProfileImage] =
    useState<string | null>(null);

  const [plan, setPlanState] =
    useState<Plan>("free");

  const [isLoggedIn, setIsLoggedInState] =
    useState(false);

  const [authReady, setAuthReady] =
    useState(false);

  useEffect(() => {
    /*
      Supabase now owns the real login state.

      INITIAL_SESSION runs when the browser client
      finishes checking whether a valid session exists.

      SIGNED_IN / SIGNED_OUT keep Flowex synchronized
      whenever authentication changes.
    */

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const user = session?.user ?? null;

        /* ================= SIGNED OUT ================= */

        if (!user) {
          setIsLoggedInState(false);

          setName("");
          setEmail("");
          setPhone("");
          setProfileImage(null);

          setPlanState("free");

          setAuthReady(true);

          return;
        }

        /* ================= SIGNED IN ================= */

        setIsLoggedInState(true);

        const userId = user.id;

        const userEmail =
          user.email || "";

        const metadataName =
          typeof user.user_metadata?.full_name === "string"
            ? user.user_metadata.full_name
            : "";

        const metadataAvatar =
          typeof user.user_metadata?.avatar_url === "string"
            ? user.user_metadata.avatar_url
            : null;

        const previousUserId =
          localStorage.getItem(
            "flowex-auth-user-id"
          );

        /*
          If a completely different Supabase user
          has signed in, start them on the Free plan.

          This prevents old Trial / Pro test values
          from leaking into a newly created account.
        */

        const isNewAuthenticatedUser =
          previousUserId !== userId;

        if (isNewAuthenticatedUser) {
          localStorage.setItem(
            "flowex-auth-user-id",
            userId
          );

          localStorage.setItem(
            "flowex-plan",
            "free"
          );

          localStorage.removeItem(
            "flowex-account"
          );

          setPlanState("free");

          setName(
            metadataName || "Flowex User"
          );

          setEmail(userEmail);

          setPhone("");

          setProfileImage(
            metadataAvatar
          );
        } else {
          /* ================= EXISTING ACCOUNT ================= */

          const savedPlan =
            localStorage.getItem(
              "flowex-plan"
            );

          if (
            savedPlan === "free" ||
            savedPlan === "trial" ||
            savedPlan === "pro"
          ) {
            setPlanState(savedPlan);
          } else {
            setPlanState("free");

            localStorage.setItem(
              "flowex-plan",
              "free"
            );
          }

          const savedAccount =
            localStorage.getItem(
              "flowex-account"
            );

          if (savedAccount) {
            try {
              const data =
                JSON.parse(savedAccount);

              setName(
                data.name ||
                  metadataName ||
                  "Flowex User"
              );

              setEmail(
                userEmail
              );

              setPhone(
                data.phone || ""
              );

              setProfileImage(
                data.profileImage ||
                  metadataAvatar ||
                  null
              );
            } catch {
              setName(
                metadataName ||
                  "Flowex User"
              );

              setEmail(userEmail);

              setPhone("");

              setProfileImage(
                metadataAvatar
              );
            }
          } else {
            setName(
              metadataName ||
                "Flowex User"
            );

            setEmail(userEmail);

            setPhone("");

            setProfileImage(
              metadataAvatar
            );
          }
        }

        /*
          Keep these old values temporarily because
          some existing Flowex pages still reference
          them while we migrate the frontend.

          They are no longer the authority for login.
          Supabase is.
        */

        localStorage.setItem(
          "flowex-is-logged-in",
          "true"
        );

        setAuthReady(true);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  /* ================= SAVE ACCOUNT ================= */

  const saveAccount = () => {
    localStorage.setItem(
      "flowex-account",
      JSON.stringify({
        name,
        email,
        phone,
        profileImage,
      })
    );
  };

  /* ================= SET PLAN ================= */

  const setPlan = (
    newPlan: Plan
  ) => {
    setPlanState(newPlan);

    localStorage.setItem(
      "flowex-plan",
      newPlan
    );
  };

  /* ================= LEGACY LOGIN SETTER ================= */

  const setIsLoggedIn = (
    loggedIn: boolean
  ) => {
    /*
      Kept temporarily so existing components
      don't break during migration.

      Real authentication state is now controlled
      by Supabase's session.
    */

    setIsLoggedInState(
      loggedIn
    );

    localStorage.setItem(
      "flowex-is-logged-in",
      String(loggedIn)
    );
  };

  return (
    <AccountContext.Provider
      value={{
        name,
        email,
        phone,
        profileImage,

        plan,

        isLoggedIn,
        authReady,

        setName,
        setEmail,
        setPhone,
        setProfileImage,

        setPlan,
        setIsLoggedIn,

        saveAccount,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}

export function useAppAccount() {
  const context =
    useContext(AccountContext);

  if (!context) {
    throw new Error(
      "useAppAccount must be used inside AppAccountProvider"
    );
  }

  return context;
}