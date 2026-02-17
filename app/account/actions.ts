"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { removeU2F } from "@lib/zitadel";

export async function removeU2FAction(userId: string, u2fId: string) {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);

  try {
    await removeU2F({ serviceUrl, userId, u2fId });
    revalidatePath("/account");
    return { success: true };
  } catch (error) {
    console.error("Failed to remove U2F:", error);
    return { error: "Failed to remove security key" };
  }
}
