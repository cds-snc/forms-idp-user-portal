/*--------------------------------------------*
 * Framework and Third-Party
 *--------------------------------------------*/

import { headers } from "next/headers";
import { NextRequest } from "next/server";

import { getOriginalHostFromHeaders } from "./server/host";
/**
 * Extracts the service url and region from the headers
 * @param headers
 * @returns the service url and region from the headers
 * @throws if the service url could not be determined
 *
 */
export async function getServiceUrlFromHeaders(): Promise<{
  serviceUrl: string;
}> {
  if (process.env.ZITADEL_API_URL) {
    return { serviceUrl: process.env.ZITADEL_API_URL };
  }
  const _headers = await headers();

  const host = getOriginalHostFromHeaders(_headers);

  return { serviceUrl: host.includes("localhost") ? `http://${host}` : `https://${host}` };
}

export function constructUrl(request: NextRequest, path: string) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  const host = getOriginalHostFromHeaders(request.headers);
  const origin = host.includes("localhost") ? `http://${host}` : `https://${host}`;

  return new URL(`${basePath}${path}`, origin);
}
