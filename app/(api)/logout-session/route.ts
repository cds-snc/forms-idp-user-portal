import { logoutCurrentSession } from "@lib/server/session";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const organization = searchParams.get("organization") || undefined;
  const returnUrl = searchParams.get("returnUrl") || "/start";

  await logoutCurrentSession({
    organization,
    postLogoutRedirectUri: returnUrl,
  });

  // Revalidate both the specific path and layout to force full refresh
  revalidatePath(returnUrl, "layout");
  revalidatePath("/", "layout");

  // Add cache-busting timestamp to really-really force reload
  const redirectUrl = new URL(returnUrl, request.url);
  redirectUrl.searchParams.set("_t", Date.now().toString());

  // And just to be really-really sure set no-cache headers
  return NextResponse.redirect(redirectUrl, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
    },
  });
}
