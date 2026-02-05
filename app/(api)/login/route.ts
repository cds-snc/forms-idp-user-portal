import { getServiceUrlFromHeaders } from "@lib/service-url";
import { validateAuthRequest, isRSCRequest } from "@lib/auth-utils";
import {
  handleOIDCFlowInitiation,
  handleSAMLFlowInitiation,
  FlowInitiationParams,
} from "@lib/server/flow-initiation";
import { loadSessionsWithCookies } from "@lib/server/session";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = false;
export const fetchCache = "default-no-store";
// Add this to prevent RSC requests
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);

  const searchParams = request.nextUrl.searchParams;

  // Defensive check: block RSC requests early
  if (isRSCRequest(searchParams)) {
    return NextResponse.json({ error: "RSC requests not supported" }, { status: 400 });
  }

  // Early validation: if no valid request parameters, return error immediately
  const requestId = validateAuthRequest(searchParams);
  if (!requestId) {
    return NextResponse.json({ error: "No valid authentication request found" }, { status: 400 });
  }

  const { sessions, sessionCookies } = await loadSessionsWithCookies({
    serviceUrl,
  });

  // Flow initiation - delegate to appropriate handler
  const flowParams: FlowInitiationParams = {
    serviceUrl,
    requestId,
    sessions,
    sessionCookies,
    request,
  };

  if (requestId.startsWith("oidc_")) {
    return handleOIDCFlowInitiation(flowParams);
  } else if (requestId.startsWith("saml_")) {
    return handleSAMLFlowInitiation(flowParams);
  } else {
    return NextResponse.json({ error: "Invalid request ID format" }, { status: 400 });
  }
}
