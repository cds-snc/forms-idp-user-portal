"use server";

import { getSession, getLoginSettings, registerU2F, verifyU2FRegistration } from "@lib/zitadel";
import { create, Duration } from "@zitadel/client";
import { VerifyU2FRegistrationRequestSchema } from "@zitadel/proto/zitadel/user/v2/user_service_pb";
import { Checks } from "@zitadel/proto/zitadel/session/v2/session_service_pb";
import { headers } from "next/headers";
import { userAgent } from "next/server";
import { getSessionCookieById, getSessionCookieByLoginName } from "../cookies";
import { getServiceUrlFromHeaders } from "../../lib/service-url";
import { getOriginalHost } from "./host";
import { setSessionAndUpdateCookie } from "./cookie";
import { continueWithSession } from "./session";
import { U2F_ERRORS } from "./u2f-errors";

type RegisterU2FCommand = {
  sessionId: string;
};

type PublicKeyCredentialJSON = {
  id: string;
  rawId: string;
  type: string;
  response: {
    attestationObject: string;
    clientDataJSON: string;
  };
};

type VerifyU2FCommand = {
  u2fId: string;
  passkeyName?: string;
  publicKeyCredential: PublicKeyCredentialJSON;
  sessionId: string;
};

interface ProtobufMessage {
  toJson(): unknown;
}

function isProtobufMessage(obj: unknown): obj is ProtobufMessage {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "toJson" in obj &&
    typeof (obj as Record<string, unknown>).toJson === "function"
  );
}

export async function addU2F(command: RegisterU2FCommand) {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const host = await getOriginalHost();

  const sessionCookie = await getSessionCookieById({
    sessionId: command.sessionId,
  });

  if (!sessionCookie) {
    return { error: U2F_ERRORS.SESSION_NOT_FOUND };
  }

  const session = await getSession({
    serviceUrl,
    sessionId: sessionCookie.id,
    sessionToken: sessionCookie.token,
  });

  const [hostname] = host.split(":");

  if (!hostname) {
    throw new Error("Could not get hostname");
  }

  const userId = session?.session?.factors?.user?.id;

  if (!session || !userId) {
    return { error: U2F_ERRORS.SESSION_NOT_FOUND };
  }

  const result = await registerU2F({ serviceUrl, userId, domain: hostname });

  // The publicKeyCredentialCreationOptions is a structpb.Struct
  // We need to use toJson() to get a plain object
  const options = result.publicKeyCredentialCreationOptions;
  let serializedOptions: unknown = null;

  if (isProtobufMessage(options)) {
    // Use protobuf's toJson() method
    serializedOptions = options.toJson();
  } else if (options) {
    // Fallback to JSON serialization
    serializedOptions = JSON.parse(JSON.stringify(options));
  }

  return {
    u2fId: result.u2fId,
    publicKeyCredentialCreationOptions: serializedOptions,
    details: result.details,
  };
}

export async function verifyU2F(command: VerifyU2FCommand) {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  let passkeyName = command.passkeyName;

  if (!passkeyName) {
    const headersList = await headers();
    const userAgentStructure = { headers: headersList };
    const { browser, device, os } = userAgent(userAgentStructure);

    passkeyName = `${device.vendor ?? ""} ${device.model ?? ""}${
      device.vendor || device.model ? ", " : ""
    }${os.name}${os.name ? ", " : ""}${browser.name}`;
  }

  const sessionCookie = await getSessionCookieById({
    sessionId: command.sessionId,
  });

  if (!sessionCookie) {
    return { error: U2F_ERRORS.SESSION_NOT_FOUND };
  }

  const session = await getSession({
    serviceUrl,
    sessionId: sessionCookie.id,
    sessionToken: sessionCookie.token,
  });

  const userId = session?.session?.factors?.user?.id;

  if (!userId) {
    return { error: U2F_ERRORS.SESSION_NOT_FOUND };
  }

  const request = create(VerifyU2FRegistrationRequestSchema, {
    u2fId: command.u2fId,
    publicKeyCredential: command.publicKeyCredential,
    tokenName: passkeyName,
    userId,
  });

  const result = await verifyU2FRegistration({ serviceUrl, request });

  // Check if the error is due to credential already being registered
  if (result && "error" in result && result.error) {
    const errorMessage = String(result.error).toLowerCase();
    if (
      errorMessage.includes("already") ||
      errorMessage.includes("duplicate") ||
      errorMessage.includes("exists")
    ) {
      return { error: U2F_ERRORS.CREDENTIAL_ALREADY_REGISTERED };
    }
  }

  return result;
}

type VerifyU2FLoginCommand = {
  loginName?: string;
  sessionId?: string;
  organization?: string;
  checks: Checks;
  requestId?: string;
  redirect?: string | null;
};

export async function verifyU2FLogin({
  loginName,
  sessionId,
  organization,
  checks,
  requestId,
  redirect,
}: VerifyU2FLoginCommand) {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);

  let sessionCookie;
  if (sessionId) {
    sessionCookie = await getSessionCookieById({ sessionId, organization });
  } else if (loginName) {
    sessionCookie = await getSessionCookieByLoginName({ loginName, organization });
  }

  if (!sessionCookie) {
    return { error: U2F_ERRORS.SESSION_NOT_FOUND };
  }

  // Get login settings to determine lifetime
  const loginSettings = await getLoginSettings({
    serviceUrl,
    organization,
  });

  const lifetime = loginSettings?.multiFactorCheckLifetime ?? {
    seconds: BigInt(60 * 60 * 24), // default to 24 hours
    nanos: 0,
  };

  // Actually verify the U2F credential by updating the session with the checks
  const updatedSession = await setSessionAndUpdateCookie({
    recentCookie: sessionCookie,
    checks,
    requestId,
    lifetime: lifetime as Duration,
  });

  if (!updatedSession) {
    return { error: U2F_ERRORS.SESSION_VERIFICATION_FAILED };
  }

  return continueWithSession({ ...updatedSession, requestId, redirect });
}
