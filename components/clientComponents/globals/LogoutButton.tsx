"use client";

import { logoutCurrentSession } from "@lib/server/session";
import { useRouter } from "next/navigation";
import { useState } from "react";

type LogoutButtonProps = {
  className?: string;
  label: string;
  organization?: string;
  postLogoutRedirectUri?: string;
};

export function LogoutButton({
  className,
  label,
  organization,
  postLogoutRedirectUri,
}: LogoutButtonProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      const result = await logoutCurrentSession({
        organization,
        postLogoutRedirectUri,
      });

      if ("redirect" in result) {
        router.push(result.redirect);
      } else if ("error" in result) {
        // Fallback to logout page if direct logout fails
        router.push("/logout");
      }
    } catch {
      // Fallback to logout page
      router.push("/logout");
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <button
      onClick={handleLogout}
      className={`cursor-pointer border-none bg-transparent p-0 text-inherit underline hover:no-underline ${className ?? ""}`}
      aria-label={label}
      disabled={isLoggingOut}
    >
      {label}
    </button>
  );
}
