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

  saveAccount: () => Promise<{ emailChangePending: boolean }>;
};

const AccountContext =
  createContext<AccountContextType | undefined>(
    undefined
  );

export function AppAccountProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [supabase] = useState(() =>
    createClient()
  );

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [profileImage, setProfileImage] =
    useState<string | null>(null);

  const [plan, setPlanState] =
    useState<Plan>("free");

  const [isLoggedIn, setIsLoggedInState] =
    useState(false);

  const [authReady, setAuthReady] =
    useState(false);

  /*
    ================= LOAD FLOWEX ACCOUNT =================

    Auth tells us WHO the user is.

    profiles tells us:
    - full name
    - phone
    - avatar

    subscriptions tells us:
    - free
    - trial
    - pro

    Supabase is now the real source of truth.
  */

  const loadAccountData = async (
    userId: string,
    userEmail: string,
    metadataName: string,
    metadataAvatar: string | null
  ) => {
    try {
      const [
        profileResult,
        subscriptionResult,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "full_name, phone, avatar_url"
          )
          .eq("id", userId)
          .single(),

        supabase
          .from("subscriptions")
          .select("plan")
          .eq("user_id", userId)
          .single(),
      ]);

      /* ================= PROFILE ================= */

      if (profileResult.error) {
        console.error(
          "Flowex profile load error:",
          profileResult.error.message
        );

        setName(
          metadataName ||
            "Flowex User"
        );

        setPhone("");

        setProfileImage(
          metadataAvatar
        );
      } else {
        const profile =
          profileResult.data;

        setName(
          profile.full_name ||
            metadataName ||
            "Flowex User"
        );

        setPhone(
          profile.phone || ""
        );

        setProfileImage(
          profile.avatar_url ||
            metadataAvatar ||
            null
        );
      }

      /* ================= EMAIL ================= */

      setEmail(
        userEmail
      );

      /* ================= SUBSCRIPTION ================= */

      if (subscriptionResult.error) {
        console.error(
          "Flowex subscription load error:",
          subscriptionResult.error.message
        );

        /*
          Safe fallback:
          if subscription data cannot be verified,
          Flowex treats the user as Free.
        */

        setPlanState(
          "free"
        );
      } else {
        const databasePlan =
          subscriptionResult.data?.plan;

        if (
          databasePlan === "free" ||
          databasePlan === "trial" ||
          databasePlan === "pro"
        ) {
          setPlanState(
            databasePlan
          );
        } else {
          setPlanState(
            "free"
          );
        }
      }
    } catch (error) {
      console.error(
        "Flowex account load error:",
        error
      );

      /*
        Never grant premium access because of
        a database/network failure.
      */

      setName(
        metadataName ||
          "Flowex User"
      );

      setEmail(
        userEmail
      );

      setPhone("");

      setProfileImage(
        metadataAvatar
      );

      setPlanState(
        "free"
      );
    } finally {
      setAuthReady(
        true
      );
    }
  };

  useEffect(() => {
    /*
      Supabase owns the real authentication state.

      INITIAL_SESSION checks the existing session
      when Flowex first loads.

      SIGNED_IN / SIGNED_OUT keep the provider
      synchronized as auth changes.
    */

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
          const user =
            session?.user ?? null;

          /* ================= SIGNED OUT ================= */

          if (!user) {
            setIsLoggedInState(
              false
            );

            setName("");
            setEmail("");
            setPhone("");

            setProfileImage(
              null
            );

            setPlanState(
              "free"
            );

            /*
              Remove remaining obsolete local
              account compatibility values.

              Authentication and plan access are
              now controlled by Supabase.
            */

            localStorage.removeItem(
              "flowex-account"
            );

            localStorage.removeItem(
              "flowex-auth-user-id"
            );

            setAuthReady(
              true
            );

            return;
          }

          /* ================= SIGNED IN ================= */

          setIsLoggedInState(
            true
          );

          setAuthReady(
            false
          );

          const userEmail =
            user.email || "";

          const metadataName =
            typeof user.user_metadata
              ?.full_name === "string"
              ? user.user_metadata.full_name
              : "";

          const metadataAvatar =
            typeof user.user_metadata
              ?.avatar_url === "string"
              ? user.user_metadata.avatar_url
              : null;

          /*
            Load the authenticated user's real
            Flowex profile and subscription
            directly from Supabase.
          */

          void loadAccountData(
            user.id,
            userEmail,
            metadataName,
            metadataAvatar
          );
        }
      );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  /*
    ================= SAVE ACCOUNT =================

    Save profile information directly to Supabase.

    The authenticated user can update only their
    own profile because of RLS.
  */

  const saveAccount =
    async () => {
      const {
        data: {
          user,
        },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (
        userError ||
        !user
      ) {
        throw new Error(
          userError?.message || "Your session could not be verified."
        );
      }

      const normalizedEmail = email.trim();
      if (!normalizedEmail) {
        throw new Error("Enter a valid email address.");
      }

      if (profileImage?.startsWith("data:")) {
        const dataUrlMatch = profileImage.match(
          /^data:image\/(png|jpeg|webp|gif);base64,([A-Za-z0-9+/]+={0,2})$/i
        );
        const imageSize = dataUrlMatch
          ? Math.floor((dataUrlMatch[2].length * 3) / 4) - (dataUrlMatch[2].endsWith("==") ? 2 : dataUrlMatch[2].endsWith("=") ? 1 : 0)
          : Number.POSITIVE_INFINITY;
        if (!dataUrlMatch || imageSize > 2 * 1024 * 1024) {
          throw new Error("Profile images must be valid PNG, JPEG, WebP, or GIF files no larger than 2 MB.");
        }
      }

      const emailChangePending = normalizedEmail.toLowerCase() !== (user.email || "").toLowerCase();

      const { error: authUpdateError, data: authUpdateData } =
        await supabase.auth.updateUser({
          ...(emailChangePending ? { email: normalizedEmail } : {}),
          data: {
            full_name: name.trim(),
            avatar_url: profileImage,
          },
        });

      if (authUpdateError) {
        throw new Error(authUpdateError.message);
      }

      const {
        error,
      } =
        await supabase
          .from("profiles")
          .update({
            full_name:
              name.trim(),
            phone:
              phone.trim(),
            avatar_url:
              profileImage,
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            user.id
          );

      if (error) {
        throw new Error(error.message);
      }

      return {
        emailChangePending: emailChangePending && Boolean(authUpdateData.user.new_email),
      };
    };

  /*
    ================= PLAN SETTER =================

    Kept temporarily so existing components compile.

    IMPORTANT:
    this does NOT write to the database.

    Users cannot grant themselves Trial/Pro from
    frontend code anymore.

    Later, payment webhook/backend logic will be
    responsible for subscription changes.
  */

  const setPlan = (
    _newPlan: Plan
  ) => {
    console.warn(
      "Flowex plan changes must come from trusted backend subscription logic."
    );
  };

  /*
    ================= LEGACY LOGIN SETTER =================

    Kept temporarily so older components compile.

    Real login state comes only from Supabase Auth.
  */

  const setIsLoggedIn = (
    _loggedIn: boolean
  ) => {
    console.warn(
      "Flowex login state is controlled by Supabase Auth."
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
    useContext(
      AccountContext
    );

  if (!context) {
    throw new Error(
      "useAppAccount must be used inside AppAccountProvider"
    );
  }

  return context;
}
