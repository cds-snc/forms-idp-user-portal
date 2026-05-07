import { NextRequest, NextResponse } from "next/server";

import { ZITADEL_ORGANIZATION } from "@root/constants/config";
import { generateCSP, responseWithCSP } from "@lib/cspScripts";

import {
  API_ROUTES,
  AUTH_FLOW_ROUTES,
  getRequiredAuthLevel,
  matchesPattern,
} from "./lib/middleware-config";
import {
  AuthLevel,
  checkAuthenticationLevel,
  getSmartRedirect,
  requiresStrongMfaSetupVerification,
} from "./lib/server/route-protection";
import { loadSessionById } from "./lib/session";

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon file)
     * - public folder files
     * - files with extensions (images, fonts, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*|img/).*)",
  ],
};

BigInt.prototype.toJSON = function () {
  return this.toString();
};

function isMfaSetupRoute(pathname: string): boolean {
  return (
    pathname === "/mfa/set" ||
    pathname.startsWith("/mfa/set/") ||
    pathname === "/u2f/set" ||
    pathname.startsWith("/u2f/set/") ||
    pathname === "/otp/time-based/set" ||
    pathname.startsWith("/otp/time-based/set/")
  );
}

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Add the original URL as a header to all requests
  const requestHeaders = new Headers(request.headers);

  // Set organization header for Zitadel
  requestHeaders.set("x-zitadel-i18n-organization", ZITADEL_ORGANIZATION);

  // Generate CSP once for this request; propagate nonce to layouts via request header
  const { csp, nonce } = generateCSP();
  requestHeaders.set("x-nonce", nonce);

  // Skip auth checks for API routes
  if (matchesPattern(pathname, API_ROUTES)) {
    return responseWithCSP(NextResponse.next({ request: { headers: requestHeaders } }), csp);
  }

  // Determine required authentication level for this route
  const requiredLevel = getRequiredAuthLevel(pathname);

  // Skip check for open routes
  if (requiredLevel === AuthLevel.OPEN) {
    return responseWithCSP(NextResponse.next({ request: { headers: requestHeaders } }), csp);
  }

  // Check authentication level (loginName will be extracted from session cookie)
  const authCheck = await checkAuthenticationLevel(
    requiredLevel,
    undefined // loginName extracted from session cookie
  );

  // If satisfied, allow the request
  if (authCheck.satisfied) {
    return responseWithCSP(NextResponse.next({ request: { headers: requestHeaders } }), csp);
  }

  // Special handling for auth flow routes
  // Allow partial authentication if user is progressing through multi-step flows
  // This works both with OIDC flows (requestId present) and standalone auth
  const isAuthFlowRoute = matchesPattern(pathname, AUTH_FLOW_ROUTES);

  if (isAuthFlowRoute) {
    // Allow access to MFA pages if password is verified
    if (pathname.startsWith("/mfa") || pathname.startsWith("/otp") || pathname.startsWith("/u2f")) {
      const session = authCheck.session;
      const hasPassword = session?.factors?.password?.verifiedAt;

      if (hasPassword) {
        if (isMfaSetupRoute(pathname) && session?.id) {
          try {
            const setupSession = await loadSessionById(session.id);

            if (requiresStrongMfaSetupVerification(setupSession)) {
              const verifyUrl = request.nextUrl.clone();
              verifyUrl.pathname = "/mfa/set/verify";
              return NextResponse.redirect(verifyUrl);
            }
          } catch {
            // Let the page-level guard handle failures fetching the enriched session.
          }
        }

        // Allow access to MFA flow pages when password is already verified
        return responseWithCSP(NextResponse.next({ request: { headers: requestHeaders } }), csp);
      }
    }

    // Allow access to password pages if session exists
    if (pathname.startsWith("/password")) {
      if (authCheck.session?.factors?.user) {
        return responseWithCSP(NextResponse.next({ request: { headers: requestHeaders } }), csp);
      }
    }
  }

  // Not satisfied and no special case applies - redirect
  const redirectUrl = getSmartRedirect(authCheck.session || null, searchParams);

  const url = request.nextUrl.clone();
  url.pathname = redirectUrl.split("?")[0];

  // Preserve query params from smart redirect
  if (redirectUrl.includes("?")) {
    const redirectParams = new URLSearchParams(redirectUrl.split("?")[1]);
    redirectParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });
  }

  return responseWithCSP(NextResponse.redirect(url), csp);
}
