"use server";
import { revalidatePath } from "next/cache";

import { protectedRemoveU2F, protectedRemoveTOTP } from "@lib/server/zitadel-protected";
import { logMessage } from "@lib/logger";

export async function removeU2FAction(userId: string, u2fId: string) {
  try {
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
    return { error: "Failed to remove security key" };
  }
}

export async function removeTOTPAction(userId: string) {
  try {
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
