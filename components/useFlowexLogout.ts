"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function useFlowexLogout() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signOut({
        scope: "local",
      });

      if (error) {
        console.error("Flowex logout error:", error.message);
        setIsLoggingOut(false);
        return;
      }

      /*
        Remove temporary frontend compatibility values.

        Do NOT remove:
        - flowex-account
        - flowex-plan
        - flowex-auth-user-id

        We want the same user's local UI information
        to remain available when they log back in.
      */

      localStorage.removeItem("flowex-is-logged-in");

      router.replace("/");
      router.refresh();
    } catch (error) {
      console.error("Flowex logout error:", error);
      setIsLoggingOut(false);
    }
  };

  return {
    logout,
    isLoggingOut,
  };
}