"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function useFlowexLogout() {
  const router = useRouter();

  const [isLoggingOut, setIsLoggingOut] =
    useState(false);

  const logout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      const supabase = createClient();

      const { error } =
        await supabase.auth.signOut({
          scope: "local",
        });

      if (error) {
        console.error(
          "Flowex logout error:",
          error.message
        );

        setIsLoggingOut(false);
        return;
      }

      /*
        Supabase Auth owns the session.

        AppAccountProvider automatically reacts
        to SIGNED_OUT and clears the in-memory
        Flowex account state.
      */

      router.replace("/");
      router.refresh();
    } catch (error) {
      console.error(
        "Flowex logout error:",
        error
      );

      setIsLoggingOut(false);
    }
  };

  return {
    logout,
    isLoggingOut,
  };
}