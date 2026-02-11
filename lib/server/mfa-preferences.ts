"use server";

import { AuthenticationMethodType } from "@zitadel/proto/zitadel/user/v2/user_service_pb";
import { cookies } from "next/headers";

/**
 * Store user's preferred MFA method in a cookie
 * This persists across sessions and devices (via browser storage)
 */
export async function setPreferredMFAMethod(
  userId: string,
  preferredMethod: AuthenticationMethodType
): Promise<{ success: boolean; error?: string }> {
  try {
    const cookieStore = await cookies();

    // Store with userId key to support multiple users on same device
    const key = `mfa-preference-${userId}`;
    const value = AuthenticationMethodType[preferredMethod];

    cookieStore.set(key, value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 365 * 24 * 60 * 60, // 1 year
      path: "/",
    });

    return { success: true };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error setting preferred MFA method:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
