"use server";
import { revalidatePath } from "next/cache";

import { getTOTPStatus, getU2FList } from "@lib/zitadel";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { protectedRemoveU2F, protectedRemoveTOTP } from "@lib/server/zitadel-protected";
import { logMessage } from "@lib/logger";

// TODO language strings

// TODO check user is authenticated and has the right to remove the u2f device
export async function removeU2FAction(userId: string, u2fId: string) {
  try {
    const _headers = await headers();
    const { serviceUrl } = getServiceUrlFromHeaders(_headers);

    const hasMFA = await _hasMFAConfigured({ serviceUrl, userId });
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
    return { error: "Failed to remove security key" };
  }
}

// TODO check user is authenticated and has the right to remove the u2f device
export async function removeTOTPAction(userId: string) {
  try {
    const _headers = await headers();
    const { serviceUrl } = getServiceUrlFromHeaders(_headers);

    const hasMFA = await _hasMFAConfigured({ serviceUrl, userId });
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

async function _hasMFAConfigured({
  serviceUrl,
  userId,
}: {
  serviceUrl: string;
  userId: string;
}): Promise<boolean> {
  const [totpStatus, u2fList] = await Promise.all([
    getTOTPStatus({ serviceUrl, userId }),
    getU2FList({ serviceUrl, userId }),
  ]);

  return totpStatus || u2fList.length > 0;
}
