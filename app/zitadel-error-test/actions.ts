"use server";

/*--------------------------------------------*
 * Framework and Third-Party
 *--------------------------------------------*/
import { headers } from "next/headers";
import { create, type Duration } from "@zitadel/client";
import type { CreateCallbackRequest } from "@zitadel/proto/zitadel/oidc/v2/oidc_service_pb";
import type { CreateResponseRequest } from "@zitadel/proto/zitadel/saml/v2/saml_service_pb";
import { type Checks, ChecksSchema } from "@zitadel/proto/zitadel/session/v2/session_service_pb";
import type { LoginSettings } from "@zitadel/proto/zitadel/settings/v2/login_settings_pb";
import type { RedirectURLsJson } from "@zitadel/proto/zitadel/user/v2/idp_pb";
import {
  AddHumanUserRequestSchema,
  SetPasswordRequestSchema,
  type UpdateHumanUserRequest,
  type VerifyU2FRegistrationRequest,
} from "@zitadel/proto/zitadel/user/v2/user_service_pb";

/*--------------------------------------------*
 * Internal Aliases
 *--------------------------------------------*/
import { getServiceUrlFromHeaders } from "@lib/service-url";
import {
  addHuman,
  addHumanUser,
  addIDPLink,
  addOTPEmail,
  addOTPSMS,
  authorizeOrDenyDeviceAuthorization,
  createCallback,
  createInviteCode,
  createResponse,
  createSessionForUserIdAndIdpIntent,
  createSessionFromChecks,
  deleteSession,
  getActiveIdentityProviders,
  getAuthRequest,
  getBrandingSettings,
  getDefaultOrg,
  getDeviceAuthorizationRequest,
  getGeneralSettings,
  getHostedLoginTranslation,
  getIDPByID,
  getLegalAndSupportSettings,
  getLockoutSettings,
  getLoginSettings,
  getOrgsByDomain,
  getPasswordComplexitySettings,
  getPasswordExpirySettings,
  getSAMLRequest,
  getSecuritySettings,
  getSerializableLoginSettings,
  getSession,
  getTOTPStatus,
  getU2FList,
  getUserByID,
  humanMFAInitSkipped,
  listAuthenticationMethodTypes,
  listIDPLinks,
  listSessions,
  listUsers,
  passwordReset,
  passwordResetWithReturn,
  registerTOTP,
  registerU2F,
  removeTOTP,
  removeU2F,
  resendEmailCode,
  retrieveIDPIntent,
  searchUsers,
  sendEmailCode,
  sendEmailCodeWithReturn,
  setPassword,
  setSession,
  setUserPassword,
  startIdentityProviderFlow,
  startLDAPIdentityProviderFlow,
  updateHuman,
  verifyEmail,
  verifyInviteCode,
  verifyTOTPRegistration,
  verifyU2FRegistration,
} from "@lib/zitadel";

// ---------------------------------------------------------------------------
// Constants – deliberately invalid to provoke Zitadel errors
// ---------------------------------------------------------------------------
const INVALID_USER_ID = "invalid-user-id-test-garbage-000";
const INVALID_ORG_ID = "invalid-org-id-test-garbage-000";
const INVALID_SESSION_ID = "invalid-session-id-test-garbage-000";
const INVALID_SESSION_TOKEN = "invalid-session-token-garbage-000";
const INVALID_IDP_ID = "invalid-idp-id-test-garbage-000";
const INVALID_AUTH_REQUEST_ID = "invalid-auth-request-id-garbage-000";

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

// ---------------------------------------------------------------------------
// Extended test actions – every remaining exported function in zitadel.ts
// ---------------------------------------------------------------------------

export async function testAddHuman(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const emptyRequest = create(AddHumanUserRequestSchema, {});
  const args = { request: "(empty AddHumanUserRequest)" };
  return runTest("addHuman", args, () => addHuman({ serviceUrl, request: emptyRequest }));
}

export async function testAddIDPLink(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const args = {
    userId: INVALID_USER_ID,
    idp: { id: INVALID_IDP_ID, userId: "garbage-idp-user", userName: "garbage-username" },
  };
  return runTest("addIDPLink", args, () =>
    addIDPLink({
      serviceUrl,
      userId: INVALID_USER_ID,
      idp: { id: INVALID_IDP_ID, userId: "garbage-idp-user", userName: "garbage-username" },
    })
  );
}

export async function testAddOTPEmail(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const args = { userId: INVALID_USER_ID };
  return runTest("addOTPEmail", args, () => addOTPEmail({ serviceUrl, userId: INVALID_USER_ID }));
}

export async function testAddOTPSMS(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const args = { userId: INVALID_USER_ID };
  return runTest("addOTPSMS", args, () => addOTPSMS({ serviceUrl, userId: INVALID_USER_ID }));
}

export async function testAuthorizeOrDenyDeviceAuthorization(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const args = { deviceAuthorizationId: "garbage-device-auth-id" };
  return runTest("authorizeOrDenyDeviceAuthorization", args, () =>
    authorizeOrDenyDeviceAuthorization({
      serviceUrl,
      deviceAuthorizationId: "garbage-device-auth-id",
    })
  );
}

export async function testCreateCallback(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const fakeReq = {
    authRequestId: INVALID_AUTH_REQUEST_ID,
  } as unknown as CreateCallbackRequest;
  const args = { authRequestId: INVALID_AUTH_REQUEST_ID };
  return runTest("createCallback", args, () => createCallback({ serviceUrl, req: fakeReq }));
}

export async function testCreateInviteCode(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const args = { userId: INVALID_USER_ID, urlTemplate: "https://example.com/invite" };
  return runTest("createInviteCode", args, () =>
    createInviteCode({
      serviceUrl,
      userId: INVALID_USER_ID,
      urlTemplate: "https://example.com/invite",
    })
  );
}

export async function testCreateSAMLResponse(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const fakeReq = {
    samlRequestId: "garbage-saml-request-id",
  } as unknown as CreateResponseRequest;
  const args = { samlRequestId: "garbage-saml-request-id" };
  return runTest("createResponse", args, () => createResponse({ serviceUrl, req: fakeReq }));
}

export async function testCreateSessionForUserIdAndIdpIntent(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const fakeLifetime = { seconds: BigInt(300) } as unknown as Duration;
  const args = {
    userId: INVALID_USER_ID,
    idpIntentId: "garbage-intent-id",
    idpIntentToken: "garbage-token",
  };
  return runTest("createSessionForUserIdAndIdpIntent", args, () =>
    createSessionForUserIdAndIdpIntent({
      serviceUrl,
      userId: INVALID_USER_ID,
      idpIntent: { idpIntentId: "garbage-intent-id", idpIntentToken: "garbage-token" },
      lifetime: fakeLifetime,
    })
  );
}

export async function testCreateSessionFromChecks(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const fakeChecks = create(ChecksSchema, {
    user: { search: { case: "userId", value: INVALID_USER_ID } },
  }) as Checks;
  const fakeLifetime = { seconds: BigInt(-1) } as unknown as Duration;
  const args = { userId: INVALID_USER_ID, lifetime: "-1s (invalid)" };
  return runTest("createSessionFromChecks", args, () =>
    createSessionFromChecks({ serviceUrl, checks: fakeChecks, lifetime: fakeLifetime })
  );
}

export async function testDeleteSession(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const args = { sessionId: INVALID_SESSION_ID, sessionToken: INVALID_SESSION_TOKEN };
  return runTest("deleteSession", args, () =>
    deleteSession({
      serviceUrl,
      sessionId: INVALID_SESSION_ID,
      sessionToken: INVALID_SESSION_TOKEN,
    })
  );
}

export async function testGetActiveIdentityProviders(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const args = { orgId: INVALID_ORG_ID };
  return runTest("getActiveIdentityProviders", args, () =>
    getActiveIdentityProviders({ serviceUrl, orgId: INVALID_ORG_ID })
  );
}

export async function testGetAuthRequest(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const args = { authRequestId: INVALID_AUTH_REQUEST_ID };
  return runTest("getAuthRequest", args, () =>
    getAuthRequest({ serviceUrl, authRequestId: INVALID_AUTH_REQUEST_ID })
  );
}

export async function testGetBrandingSettings(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const args = { organization: INVALID_ORG_ID };
  return runTest("getBrandingSettings", args, () =>
    getBrandingSettings({ serviceUrl, organization: INVALID_ORG_ID })
  );
}

export async function testGetDefaultOrg(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const args = {};
  return runTest("getDefaultOrg", args, () => getDefaultOrg({ serviceUrl }));
}

export async function testGetDeviceAuthorizationRequest(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const args = { userCode: "GARBAGE-CODE" };
  return runTest("getDeviceAuthorizationRequest", args, () =>
    getDeviceAuthorizationRequest({ serviceUrl, userCode: "GARBAGE-CODE" })
  );
}

export async function testGetGeneralSettings(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const args = {};
  return runTest("getGeneralSettings", args, () => getGeneralSettings({ serviceUrl }));
}

export async function testGetHostedLoginTranslation(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const args = { organization: INVALID_ORG_ID, locale: "xx-INVALID" };
  return runTest("getHostedLoginTranslation", args, () =>
    getHostedLoginTranslation({ serviceUrl, organization: INVALID_ORG_ID, locale: "xx-INVALID" })
  );
}

export async function testGetIDPByID(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const args = { id: INVALID_IDP_ID };
  return runTest("getIDPByID", args, () => getIDPByID({ serviceUrl, id: INVALID_IDP_ID }));
}

export async function testGetOrgsByDomain(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const args = { domain: "garbage-domain-does-not-exist.invalid" };
  return runTest("getOrgsByDomain", args, () =>
    getOrgsByDomain({ serviceUrl, domain: "garbage-domain-does-not-exist.invalid" })
  );
}

export async function testGetPasswordExpirySettings(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const args = { orgId: INVALID_ORG_ID };
  return runTest("getPasswordExpirySettings", args, () =>
    getPasswordExpirySettings({ serviceUrl, orgId: INVALID_ORG_ID })
  );
}

export async function testGetSAMLRequest(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const args = { samlRequestId: "garbage-saml-request-id" };
  return runTest("getSAMLRequest", args, () =>
    getSAMLRequest({ serviceUrl, samlRequestId: "garbage-saml-request-id" })
  );
}

export async function testGetSecuritySettings(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const args = {};
  return runTest("getSecuritySettings", args, () => getSecuritySettings({ serviceUrl }));
}

export async function testHumanMFAInitSkipped(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const args = { userId: INVALID_USER_ID };
  return runTest("humanMFAInitSkipped", args, () =>
    humanMFAInitSkipped({ serviceUrl, userId: INVALID_USER_ID })
  );
}

export async function testListIDPLinks(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const args = { userId: INVALID_USER_ID };
  return runTest("listIDPLinks", args, () => listIDPLinks({ serviceUrl, userId: INVALID_USER_ID }));
}

export async function testListSessions(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const args = { ids: ["garbage-session-id-1", "garbage-session-id-2"] };
  return runTest("listSessions", args, () =>
    listSessions({ serviceUrl, ids: ["garbage-session-id-1", "garbage-session-id-2"] })
  );
}

export async function testPasswordReset(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const args = { userId: INVALID_USER_ID };
  return runTest("passwordReset", args, () =>
    passwordReset({ serviceUrl, userId: INVALID_USER_ID })
  );
}

export async function testRegisterU2F(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const args = { userId: INVALID_USER_ID, domain: "localhost" };
  return runTest("registerU2F", args, () =>
    registerU2F({ serviceUrl, userId: INVALID_USER_ID, domain: "localhost" })
  );
}

export async function testRemoveTOTP(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const args = { userId: INVALID_USER_ID };
  return runTest("removeTOTP", args, () => removeTOTP({ serviceUrl, userId: INVALID_USER_ID }));
}

export async function testRemoveU2F(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const args = { userId: INVALID_USER_ID, u2fId: "garbage-u2f-id" };
  return runTest("removeU2F", args, () =>
    removeU2F({ serviceUrl, userId: INVALID_USER_ID, u2fId: "garbage-u2f-id" })
  );
}

export async function testRetrieveIDPIntent(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const args = { id: "garbage-idp-intent-id", token: "garbage-idp-intent-token" };
  return runTest("retrieveIDPIntent", args, () =>
    retrieveIDPIntent({
      serviceUrl,
      id: "garbage-idp-intent-id",
      token: "garbage-idp-intent-token",
    })
  );
}

export async function testSearchUsers(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const fakeLoginSettings = {
    disableLoginWithEmail: false,
    disableLoginWithPhone: false,
  } as unknown as LoginSettings;
  const args = { searchValue: "garbage@@##search", organizationId: INVALID_ORG_ID };
  return runTest("searchUsers", args, () =>
    searchUsers({
      serviceUrl,
      searchValue: "garbage@@##search",
      loginSettings: fakeLoginSettings,
      organizationId: INVALID_ORG_ID,
    })
  );
}

export async function testSendEmailCode(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const args = {
    userId: INVALID_USER_ID,
    urlTemplate: "https://example.com/verify?code={{.Code}}",
  };
  return runTest("sendEmailCode", args, () =>
    sendEmailCode({
      serviceUrl,
      userId: INVALID_USER_ID,
      urlTemplate: "https://example.com/verify?code={{.Code}}",
    })
  );
}

export async function testSendEmailCodeWithReturn(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const args = { userId: INVALID_USER_ID };
  return runTest("sendEmailCodeWithReturn", args, () =>
    sendEmailCodeWithReturn({ serviceUrl, userId: INVALID_USER_ID })
  );
}

export async function testSetPassword(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const fakePayload = create(SetPasswordRequestSchema, {
    userId: INVALID_USER_ID,
    newPassword: { password: "x" },
  });
  const args = { userId: INVALID_USER_ID, password: "x" };
  return runTest("setPassword", args, () => setPassword({ serviceUrl, payload: fakePayload }));
}

export async function testSetSession(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const fakeChecks = create(ChecksSchema, {}) as Checks;
  const fakeLifetime = { seconds: BigInt(300) } as unknown as Duration;
  const args = { sessionId: INVALID_SESSION_ID, sessionToken: INVALID_SESSION_TOKEN };
  return runTest("setSession", args, () =>
    setSession({
      serviceUrl,
      sessionId: INVALID_SESSION_ID,
      sessionToken: INVALID_SESSION_TOKEN,
      challenges: undefined,
      checks: fakeChecks,
      lifetime: fakeLifetime,
    })
  );
}

export async function testStartIdentityProviderFlow(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const fakeUrls = {
    successUrl: "https://example.com/success",
    failureUrl: "https://example.com/failure",
  } as unknown as RedirectURLsJson;
  const args = { idpId: INVALID_IDP_ID };
  return runTest("startIdentityProviderFlow", args, () =>
    startIdentityProviderFlow({ serviceUrl, idpId: INVALID_IDP_ID, urls: fakeUrls })
  );
}

export async function testStartLDAPIdentityProviderFlow(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const args = { idpId: INVALID_IDP_ID, username: "garbage-user", password: "garbage-pass" };
  return runTest("startLDAPIdentityProviderFlow", args, () =>
    startLDAPIdentityProviderFlow({
      serviceUrl,
      idpId: INVALID_IDP_ID,
      username: "garbage-user",
      password: "garbage-pass",
    })
  );
}

export async function testUpdateHuman(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const fakeRequest = { userId: INVALID_USER_ID } as unknown as UpdateHumanUserRequest;
  const args = { userId: INVALID_USER_ID };
  return runTest("updateHuman", args, () => updateHuman({ serviceUrl, request: fakeRequest }));
}

export async function testVerifyInviteCode(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const args = { userId: INVALID_USER_ID, verificationCode: "garbage-invite-code" };
  return runTest("verifyInviteCode", args, () =>
    verifyInviteCode({
      serviceUrl,
      userId: INVALID_USER_ID,
      verificationCode: "garbage-invite-code",
    })
  );
}

export async function testVerifyU2FRegistration(): Promise<ZitadelTestResult> {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const fakeRequest = { userId: INVALID_USER_ID } as unknown as VerifyU2FRegistrationRequest;
  const args = { userId: INVALID_USER_ID };
  return runTest("verifyU2FRegistration", args, () =>
    verifyU2FRegistration({ serviceUrl, request: fakeRequest })
  );
}
