"use server";

/*--------------------------------------------*
 * Framework and Third-Party
 *--------------------------------------------*/
import { headers } from "next/headers";

/*--------------------------------------------*
 * Internal Aliases
 *--------------------------------------------*/
import { getServiceUrlFromHeaders } from "@lib/service-url";
import {
  addHumanUser,
  getLegalAndSupportSettings,
  getLockoutSettings,
  getLoginSettings,
  getPasswordComplexitySettings,
  getSerializableLoginSettings,
  getSession,
  getTOTPStatus,
  getU2FList,
  getUserByID,
  listAuthenticationMethodTypes,
  listUsers,
  passwordResetWithReturn,
  registerTOTP,
  resendEmailCode,
  setUserPassword,
  verifyEmail,
  verifyTOTPRegistration,
} from "@lib/zitadel";

// ---------------------------------------------------------------------------
// Constants – deliberately invalid to provoke Zitadel errors
// ---------------------------------------------------------------------------
const INVALID_USER_ID = "invalid-user-id-test-garbage-000";
const INVALID_ORG_ID = "invalid-org-id-test-garbage-000";
const INVALID_SESSION_ID = "invalid-session-id-test-garbage-000";
const INVALID_SESSION_TOKEN = "invalid-session-token-garbage-000";

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------
export type ZitadelTestResult = {
  fnName: string;
  invalidArgs: Record<string, unknown>;
  result?: string; // JSON-stringified success value
  error?: SerializedError;
};

export type SerializedError = {
  code?: number;
  message?: string;
  rawMessage?: string;
  metadata?: Record<string, string>;
  raw?: string;
};

// ---------------------------------------------------------------------------
// Error serializer – mirrors logic from lib/zitadel-errors.ts
// ---------------------------------------------------------------------------
function serializeError(err: unknown): SerializedError {
  if (!err || typeof err !== "object") {
    return { raw: String(err) };
  }

  const e = err as Record<string, unknown>;

  let metadata: Record<string, string> | undefined;
  if (e.metadata && typeof e.metadata === "object") {
    try {
      const metaObj = e.metadata as { get?: (k: string) => string | null };
      if (typeof metaObj.get === "function") {
        const grpcStatus = metaObj.get("grpc-status");
        const grpcMessage = metaObj.get("grpc-message");
        metadata = {};
        if (grpcStatus) metadata["grpc-status"] = grpcStatus;
        if (grpcMessage) metadata["grpc-message"] = grpcMessage;
      }
    } catch {
      // ignore metadata extraction errors
    }
  }

  let raw: string | undefined;
  try {
    raw = JSON.stringify(err, Object.getOwnPropertyNames(err));
  } catch {
    raw = String(err);
  }

  return {
    code: typeof e.code === "number" ? e.code : undefined,
    message: typeof e.message === "string" ? e.message : undefined,
    rawMessage: typeof e.rawMessage === "string" ? e.rawMessage : undefined,
    metadata,
    raw,
  };
}

async function runTest(
  fnName: string,
  invalidArgs: Record<string, unknown>,
  fn: () => Promise<unknown>
): Promise<ZitadelTestResult> {
  try {
    const result = await fn();
    return {
      fnName,
      invalidArgs,
      result: JSON.stringify(result, (_, v) => (typeof v === "bigint" ? v.toString() : v)),
    };
  } catch (err) {
    return {
      fnName,
      invalidArgs,
      error: serializeError(err),
    };
  }
}

// ---------------------------------------------------------------------------
// Individual test actions
// ---------------------------------------------------------------------------

export async function testGetLoginSettings(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const args = { organization: INVALID_ORG_ID };
  return runTest("getLoginSettings", args, () =>
    getLoginSettings({ serviceUrl, organization: INVALID_ORG_ID })
  );
}

export async function testGetSerializableLoginSettings(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const args = { organizationId: INVALID_ORG_ID };
  return runTest("getSerializableLoginSettings", args, () =>
    getSerializableLoginSettings({ serviceUrl, organizationId: INVALID_ORG_ID })
  );
}

export async function testGetLockoutSettings(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const args = { orgId: INVALID_ORG_ID };
  return runTest("getLockoutSettings", args, () =>
    getLockoutSettings({ serviceUrl, orgId: INVALID_ORG_ID })
  );
}

export async function testGetPasswordComplexitySettings(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const args = { organization: INVALID_ORG_ID };
  return runTest("getPasswordComplexitySettings", args, () =>
    getPasswordComplexitySettings({ serviceUrl, organization: INVALID_ORG_ID })
  );
}

export async function testGetLegalAndSupportSettings(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const args = { organization: INVALID_ORG_ID };
  return runTest("getLegalAndSupportSettings", args, () =>
    getLegalAndSupportSettings({ serviceUrl, organization: INVALID_ORG_ID })
  );
}

export async function testGetUserByID(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const args = { userId: INVALID_USER_ID };
  return runTest("getUserByID", args, () => getUserByID({ serviceUrl, userId: INVALID_USER_ID }));
}

export async function testListAuthenticationMethodTypes(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const args = { userId: INVALID_USER_ID };
  return runTest("listAuthenticationMethodTypes", args, () =>
    listAuthenticationMethodTypes({ serviceUrl, userId: INVALID_USER_ID })
  );
}

export async function testAddHumanUser(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  // Invalid: empty firstName/lastName, malformed email, garbage org
  const args = {
    email: "not-an-email",
    firstName: "",
    lastName: "",
    organization: INVALID_ORG_ID,
  };
  return runTest("addHumanUser", args, () =>
    addHumanUser({
      serviceUrl,
      email: "not-an-email",
      firstName: "",
      lastName: "",
      organization: INVALID_ORG_ID,
    })
  );
}

export async function testListUsers(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  // Use a garbage org ID to trigger an error; loginName alone usually returns empty, not an error
  const args = { loginName: "garbage@@@@##invalid", organizationId: INVALID_ORG_ID };
  return runTest("listUsers", args, () =>
    listUsers({
      serviceUrl,
      loginName: "garbage@@@@##invalid",
      organizationId: INVALID_ORG_ID,
    })
  );
}

export async function testPasswordResetWithReturn(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const args = { userId: INVALID_USER_ID };
  return runTest("passwordResetWithReturn", args, () =>
    passwordResetWithReturn({ serviceUrl, userId: INVALID_USER_ID })
  );
}

export async function testRegisterTOTP(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const args = { userId: INVALID_USER_ID };
  return runTest("registerTOTP", args, () => registerTOTP({ serviceUrl, userId: INVALID_USER_ID }));
}

export async function testGetTOTPStatus(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const args = { userId: INVALID_USER_ID };
  return runTest("getTOTPStatus", args, () =>
    getTOTPStatus({ serviceUrl, userId: INVALID_USER_ID })
  );
}

export async function testGetU2FList(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const args = { userId: INVALID_USER_ID };
  return runTest("getU2FList", args, () => getU2FList({ serviceUrl, userId: INVALID_USER_ID }));
}

export async function testVerifyEmail(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const args = { userId: INVALID_USER_ID, verificationCode: "000000" };
  return runTest("verifyEmail", args, () =>
    verifyEmail({ serviceUrl, userId: INVALID_USER_ID, verificationCode: "000000" })
  );
}

export async function testVerifyTOTPRegistration(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const args = { userId: INVALID_USER_ID, code: "000000" };
  return runTest("verifyTOTPRegistration", args, () =>
    verifyTOTPRegistration({ serviceUrl, userId: INVALID_USER_ID, code: "000000" })
  );
}

export async function testSetUserPassword(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const args = { userId: INVALID_USER_ID, password: "x", code: "000000" };
  return runTest("setUserPassword", args, () =>
    setUserPassword({
      serviceUrl,
      userId: INVALID_USER_ID,
      password: "x",
      code: "000000",
    })
  );
}

export async function testGetSession(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const args = { sessionId: INVALID_SESSION_ID, sessionToken: INVALID_SESSION_TOKEN };
  return runTest("getSession", args, () =>
    getSession({
      serviceUrl,
      sessionId: INVALID_SESSION_ID,
      sessionToken: INVALID_SESSION_TOKEN,
    })
  );
}

export async function testResendEmailCode(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const args = { userId: INVALID_USER_ID, urlTemplate: "https://example.com" };
  return runTest("resendEmailCode", args, () =>
    resendEmailCode({
      serviceUrl,
      userId: INVALID_USER_ID,
      urlTemplate: "https://example.com",
    })
  );
}
