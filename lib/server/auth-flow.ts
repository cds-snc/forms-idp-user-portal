"use server";

import { loginWithOIDCAndSession } from "@lib/oidc";
import { loginWithSAMLAndSession } from "@lib/saml";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { loadSessionsWithCookies } from "@lib/server/session";
import { headers } from "next/headers";

export interface AuthFlowParams {
  sessionId: string;
  requestId: string;
  organization?: string;
}

/**
 * Server Action to complete authentication flow
 * Complete OIDC/SAML authentication flow with session
 * This is the shared logic for flow completion
 * Returns either an error or a redirect URL for client-side navigation
 */
export async function completeAuthFlow(
  command: AuthFlowParams
): Promise<{ error: string } | { redirect: string }> {
  const { sessionId, requestId } = command;

  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);

  const { sessions, sessionCookies } = await loadSessionsWithCookies({
    serviceUrl,
    cleanup: true,
  });

  if (requestId.startsWith("oidc_")) {
    // Complete OIDC flow
    const result = await loginWithOIDCAndSession({
      serviceUrl,
      authRequest: requestId.replace("oidc_", ""),
      sessionId,
      sessions,
      sessionCookies,
    });

    // Safety net - ensure we always return a valid object
    if (
      !result ||
      typeof result !== "object" ||
      (!("redirect" in result) && !("error" in result))
    ) {
      return { error: "Authentication completed but navigation failed" };
    }

    return result;
  } else if (requestId.startsWith("saml_")) {
    // Complete SAML flow
    const result = await loginWithSAMLAndSession({
      serviceUrl,
      samlRequest: requestId.replace("saml_", ""),
      sessionId,
      sessions,
      sessionCookies,
    });

    // Safety net - ensure we always return a valid object
    if (
      !result ||
      typeof result !== "object" ||
      (!("redirect" in result) && !("error" in result))
    ) {
      return { error: "Authentication completed but navigation failed" };
    }

    return result;
  }

  return { error: "Invalid request ID format" };
}
