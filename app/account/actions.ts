"use server";
import { revalidatePath } from "next/cache";

import {
  protectedRemoveU2F,
  protectedRemoveTOTP,
  protectedGetTOTPStatus,
  protectedGetU2FList,
} from "@lib/server/zitadel-protected";
import { logMessage } from "@lib/logger";

export async function removeU2FAction(userId: string, u2fId: string) {
  try {
    const hasMFA = await _hasMFAConfigured(userId);
    if (!hasMFA) {
      return { error: "At least one two-factor authentication method must be configured" };
    }

    const result = await protectedRemoveU2F(userId, u2fId);
    if ("error" in result) {
      return result;
    }
    revalidatePath("/account");
    return { success: true };
  } catch (error) {
    logMessage.error(
      `Failed to remove U2F: ${error instanceof Error ? error.message : String(error)}`
    );
    return { error: error instanceof Error ? error.message : "Failed to remove security key" };
  }
}

export async function removeTOTPAction(userId: string) {
  try {
    const hasMFA = await _hasMFAConfigured(userId);
    if (!hasMFA) {
      return { error: "At least one two-factor authentication method must be configured" };
    }

    const result = await protectedRemoveTOTP(userId);
    if ("error" in result) {
      return result;
    }
    revalidatePath("/account");
    return { success: true };
  } catch (error) {
    logMessage.error(
      `Failed to remove TOTP: ${error instanceof Error ? error.message : String(error)}`
    );
    return { error: "Failed to remove Authentication method" };
  }
}

async function _hasMFAConfigured(userId: string): Promise<boolean> {
  const [totpResult, u2fResult] = await Promise.all([
    protectedGetTOTPStatus(userId),
    protectedGetU2FList(userId),
  ]);

  // Handle error cases - return false if we can't determine MFA status
  if (typeof totpResult === "object" && "error" in totpResult) {
    return false;
  }
  if (typeof u2fResult === "object" && "error" in u2fResult) {
    return false;
  }

  return totpResult || u2fResult.length > 0;
}
