import { logoutCurrentSession } from "@lib/server/session";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const organization = searchParams.get("organization") || undefined;
  const returnUrl = searchParams.get("returnUrl") || "/start";

  const result = await logoutCurrentSession({
    organization,
    postLogoutRedirectUri: returnUrl,
  });

  revalidatePath(returnUrl);

  if ("redirect" in result) {
    redirect(result.redirect);
  } else {
    redirect(returnUrl);
  }
}
