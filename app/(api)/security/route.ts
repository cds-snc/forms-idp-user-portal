/*--------------------------------------------*
 * Framework and Third-Party
 *--------------------------------------------*/

import { NextResponse } from "next/server";

/*--------------------------------------------*
 * Internal Aliases
 *--------------------------------------------*/
import { getServiceForHost } from "@lib/service";

export async function GET() {
  const settingsService = await getServiceForHost("SettingsService");

  const settings = await settingsService
    .getSecuritySettings({})
    .then((resp) => (resp.settings ? resp.settings : undefined));

  const response = NextResponse.json({ settings }, { status: 200 });

  // Add Cache-Control header to cache the response for up to 1 hour
  response.headers.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");

  return response;
}
