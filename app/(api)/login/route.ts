import { getAllSessions } from "@lib/cookies";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { validateAuthRequest, isRSCRequest } from "@lib/auth-utils";
import {
  handleOIDCFlowInitiation,
  handleSAMLFlowInitiation,
  FlowInitiationParams,
} from "@lib/server/flow-initiation";
import { loadSessionsByIds } from "@lib/server/session";
import { Session } from "@zitadel/proto/zitadel/session/v2/session_pb";
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

  const sessionCookies = await getAllSessions();
  const ids = sessionCookies.map((s) => s.id);
  let sessions: Session[] = [];
  if (ids && ids.length) {
    sessions = await loadSessionsByIds({ serviceUrl, ids });
  }

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
  } else if (requestId.startsWith("device_")) {
    // Device Authorization does not need to start here as it is handled on the /device endpoint
    return NextResponse.json(
      { error: "Device authorization should use /device endpoint" },
      { status: 400 }
    );
  } else {
    return NextResponse.json({ error: "Invalid request ID format" }, { status: 400 });
  }
}
