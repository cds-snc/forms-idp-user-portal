"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { removeTOTP, removeU2F } from "@lib/zitadel";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { logMessage } from "@lib/logger";

export async function removeU2FAction(userId: string, u2fId: string) {
  // TODO check user is authenticated and has the right to remove the u2f device

  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);

  try {
    await removeU2F({ serviceUrl, userId, u2fId });
    revalidatePath("/account");
    return { success: true };
  } catch (error) {
    logMessage.info(`Failed to remove U2F: ${JSON.stringify(error)}`);
    return { error: "Failed to remove security key" };
  }
}

export async function removeTOTPAction(userId: string) {
  // TODO check user is authenticated and has the right to remove the u2f device

  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);

  try {
    await removeTOTP({ serviceUrl, userId });
    revalidatePath("/account");
    return { success: true };
  } catch (error) {
    logMessage.info(`Failed to remove TOTP: ${JSON.stringify(error)}`);
    return { error: "Failed to remove Authentication method" };
  }
}
