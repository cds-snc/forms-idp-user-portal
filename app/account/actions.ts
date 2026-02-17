"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { getTOTPStatus, getU2FList, removeTOTP, removeU2F } from "@lib/zitadel";
import { getServiceUrlFromHeaders } from "@lib/service-url";
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

    await removeU2F({ serviceUrl, userId, u2fId });
    revalidatePath("/account");
    return { success: true };
  } catch (error) {
    logMessage.info(`Failed to remove U2F: ${JSON.stringify(error)}`);
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

    await removeTOTP({ serviceUrl, userId });
    revalidatePath("/account");
    return { success: true };
  } catch (error) {
    logMessage.info(`Failed to remove TOTP: ${JSON.stringify(error)}`);
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
