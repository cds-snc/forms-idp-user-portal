"use client";

/*--------------------------------------------*
 * Framework and Third-Party
 *--------------------------------------------*/
import { useState, useTransition } from "react";

/*--------------------------------------------*
 * Internal Aliases
 *--------------------------------------------*/
import type { ZitadelTestResult } from "./actions";
import {
  // extended – all zitadel.ts functions
  testAddHuman,
  testAddHumanUser,
  testAddIDPLink,
  testAddOTPEmail,
  testAddOTPSMS,
  testAuthorizeOrDenyDeviceAuthorization,
  testCreateCallback,
  testCreateInviteCode,
  testCreateSAMLResponse,
  testCreateSessionForUserIdAndIdpIntent,
  testCreateSessionFromChecks,
  testDeleteSession,
  testGetActiveIdentityProviders,
  testGetAuthRequest,
  testGetBrandingSettings,
  testGetDefaultOrg,
  testGetDeviceAuthorizationRequest,
  testGetGeneralSettings,
  testGetHostedLoginTranslation,
  testGetIDPByID,
  testGetLegalAndSupportSettings,
  testGetLockoutSettings,
  testGetLoginSettings,
  testGetOrgsByDomain,
  testGetPasswordComplexitySettings,
  testGetPasswordExpirySettings,
  testGetSAMLRequest,
  testGetSecuritySettings,
  testGetSerializableLoginSettings,
  testGetSession,
  testGetTOTPStatus,
  testGetU2FList,
  testGetUserByID,
  testHumanMFAInitSkipped,
  testListAuthenticationMethodTypes,
  testListIDPLinks,
  testListSessions,
  testListUsers,
  testPasswordReset,
  testPasswordResetWithReturn,
  testRegisterTOTP,
  testRegisterU2F,
  testRemoveTOTP,
  testRemoveU2F,
  testResendEmailCode,
  testRetrieveIDPIntent,
  testSearchUsers,
  testSendEmailCode,
  testSendEmailCodeWithReturn,
  testSetPassword,
  testSetSession,
  testSetUserPassword,
  testStartIdentityProviderFlow,
  testStartLDAPIdentityProviderFlow,
  testUpdateHuman,
  testVerifyEmail,
  testVerifyInviteCode,
  testVerifyTOTPRegistration,
  testVerifyU2FRegistration,
} from "./actions";

// ---------------------------------------------------------------------------
// Test definitions
// ---------------------------------------------------------------------------
type TestDef = {
  label: string;
  description: string;
  action: () => Promise<ZitadelTestResult>;
};

const TESTS: TestDef[] = [
  {
    label: "getLoginSettings",
    description: "Fetch login settings with an invalid org ID",
    action: testGetLoginSettings,
  },
  {
    label: "getSerializableLoginSettings",
    description: "Fetch serializable login settings with an invalid org ID",
    action: testGetSerializableLoginSettings,
  },
  {
    label: "getLockoutSettings",
    description: "Fetch lockout settings with an invalid org ID",
    action: testGetLockoutSettings,
  },
  {
    label: "getPasswordComplexitySettings",
    description: "Fetch password complexity settings with an invalid org ID",
    action: testGetPasswordComplexitySettings,
  },
  {
    label: "getLegalAndSupportSettings",
    description: "Fetch legal/support settings with an invalid org ID",
    action: testGetLegalAndSupportSettings,
  },
  {
    label: "getUserByID",
    description: "Fetch a user with a garbage user ID",
    action: testGetUserByID,
  },
  {
    label: "listAuthenticationMethodTypes",
    description: "List auth method types for a garbage user ID",
    action: testListAuthenticationMethodTypes,
  },
  {
    label: "addHumanUser",
    description: "Register a new user with empty name, bad email, invalid org",
    action: testAddHumanUser,
  },
  {
    label: "listUsers",
    description: "Search users with a malformed login name and invalid org",
    action: testListUsers,
  },
  {
    label: "passwordResetWithReturn",
    description: "Trigger a password reset for a garbage user ID",
    action: testPasswordResetWithReturn,
  },
  {
    label: "registerTOTP",
    description: "Register TOTP for a garbage user ID",
    action: testRegisterTOTP,
  },
  {
    label: "getTOTPStatus",
    description: "Get TOTP status for a garbage user ID",
    action: testGetTOTPStatus,
  },
  {
    label: "getU2FList",
    description: "Get U2F list for a garbage user ID",
    action: testGetU2FList,
  },
  {
    label: "verifyEmail",
    description: "Verify email with garbage user ID and code 000000",
    action: testVerifyEmail,
  },
  {
    label: "verifyTOTPRegistration",
    description: "Verify TOTP registration with garbage user ID and code 000000",
    action: testVerifyTOTPRegistration,
  },
  {
    label: "setUserPassword",
    description: "Set password for garbage user ID with a too-short password",
    action: testSetUserPassword,
  },
  {
    label: "getSession",
    description: "Fetch a session with garbage session ID and token",
    action: testGetSession,
  },
  {
    label: "resendEmailCode",
    description: "Resend email verification code for a garbage user ID",
    action: testResendEmailCode,
  },
];

type ResultCardProps = {
  result: ZitadelTestResult;
};

function ResultCard({ result }: ResultCardProps) {
  const isError = Boolean(result.error);

  return (
    <div
      className={`mt-2 rounded border p-3 text-sm ${isError ? "border-red-400 bg-red-50" : "border-green-400 bg-green-50"}`}
    >
      <div className="mb-1 flex items-center gap-2">
        <span
          className={`rounded px-1.5 py-0.5 text-xs font-bold text-white ${isError ? "bg-red-600" : "bg-green-600"}`}
        >
          {isError ? "ERROR" : "SUCCESS"}
        </span>
        <span className="font-mono font-semibold text-gray-800">{result.fnName}</span>
      </div>

      <div className="mb-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Invalid args
        </span>
        <pre className="mt-0.5 overflow-x-auto rounded bg-gray-100 p-2 text-xs text-gray-700">
          {JSON.stringify(result.invalidArgs, null, 2)}
        </pre>
      </div>

      {isError ? (
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Error detail
          </span>
          {result.error?.code !== undefined && (
            <p className="mt-0.5 text-xs">
              <span className="font-semibold text-red-700">gRPC code:</span>{" "}
              <span className="font-mono">{result.error.code}</span>
            </p>
          )}
          {result.error?.message && (
            <p className="mt-0.5 text-xs">
              <span className="font-semibold text-red-700">message:</span>{" "}
              <span className="font-mono">{result.error.message}</span>
            </p>
          )}
          {result.error?.rawMessage && (
            <p className="mt-0.5 text-xs">
              <span className="font-semibold text-red-700">rawMessage:</span>{" "}
              <span className="font-mono">{result.error.rawMessage}</span>
            </p>
          )}
          {result.error?.metadata && Object.keys(result.error.metadata).length > 0 && (
            <div className="mt-0.5 text-xs">
              <span className="font-semibold text-red-700">metadata:</span>
              <pre className="mt-0.5 overflow-x-auto rounded bg-gray-100 p-2 text-xs text-gray-700">
                {JSON.stringify(result.error.metadata, null, 2)}
              </pre>
            </div>
          )}
          {result.error?.raw && (
            <div className="mt-1 text-xs">
              <span className="font-semibold text-red-700">raw (full error):</span>
              <pre className="mt-0.5 overflow-x-auto rounded bg-gray-100 p-2 text-xs text-gray-700">
                {result.error.raw}
              </pre>
            </div>
          )}
        </div>
      ) : (
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Result
          </span>
          <pre className="mt-0.5 overflow-x-auto rounded bg-gray-100 p-2 text-xs text-gray-700">
            {result.result ?? "(no data returned)"}
          </pre>
        </div>
      )}
    </div>
  );
}

type TestRowProps = {
  test: TestDef;
};

function TestRow({ test }: TestRowProps) {
  const [result, setResult] = useState<ZitadelTestResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const res = await test.action();
      // Also log to console for easy inspection
      if (res.error) {
        console.error(`[zitadel-error-test] ${res.fnName}`, res);
      } else {
        console.log(`[zitadel-error-test] ${res.fnName}`, res);
      }
      setResult(res);
    });
  }

  return (
    <li className="border-b border-gray-200 py-4 last:border-b-0">
      <div className="flex items-start gap-4">
        <button
          className="min-w-[220px] rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          disabled={isPending}
          onClick={handleClick}
        >
          {isPending ? "Running…" : test.label}
        </button>
        <p className="pt-2 text-sm text-gray-600">{test.description}</p>
      </div>
      {result && <ResultCard result={result} />}
    </li>
  );
}

// ---------------------------------------------------------------------------
// Extended tests – every exported function in zitadel.ts
// ---------------------------------------------------------------------------
const NEW_TESTS: TestDef[] = [
  {
    label: "addHuman",
    description: "addHuman with empty AddHumanUserRequest",
    action: testAddHuman,
  },
  {
    label: "addIDPLink",
    description: "Link a garbage IDP to a garbage user ID",
    action: testAddIDPLink,
  },
  {
    label: "addOTPEmail",
    description: "Add OTP email for a garbage user ID",
    action: testAddOTPEmail,
  },
  {
    label: "addOTPSMS",
    description: "Add OTP SMS for a garbage user ID",
    action: testAddOTPSMS,
  },
  {
    label: "authorizeOrDenyDeviceAuthorization",
    description: "Authorize a device with a garbage deviceAuthorizationId",
    action: testAuthorizeOrDenyDeviceAuthorization,
  },
  {
    label: "createCallback",
    description: "Create an OIDC callback with a garbage authRequestId",
    action: testCreateCallback,
  },
  {
    label: "createInviteCode",
    description: "Create an invite code for a garbage user ID",
    action: testCreateInviteCode,
  },
  {
    label: "createResponse",
    description: "Create a SAML response with a garbage samlRequestId",
    action: testCreateSAMLResponse,
  },
  {
    label: "createSessionForUserIdAndIdpIntent",
    description: "Create session with garbage userId and IDP intent tokens",
    action: testCreateSessionForUserIdAndIdpIntent,
  },
  {
    label: "createSessionFromChecks",
    description: "Create session with garbage userId and negative lifetime",
    action: testCreateSessionFromChecks,
  },
  {
    label: "deleteSession",
    description: "Delete a session with garbage sessionId and token",
    action: testDeleteSession,
  },
  {
    label: "getActiveIdentityProviders",
    description: "List active IDPs for a garbage org ID",
    action: testGetActiveIdentityProviders,
  },
  {
    label: "getAuthRequest",
    description: "Fetch an OIDC auth request with a garbage authRequestId",
    action: testGetAuthRequest,
  },
  {
    label: "getBrandingSettings",
    description: "Fetch branding settings with a garbage org ID",
    action: testGetBrandingSettings,
  },
  {
    label: "getDefaultOrg",
    description: "Fetch the default organisation (no invalid args – may succeed)",
    action: testGetDefaultOrg,
  },
  {
    label: "getDeviceAuthorizationRequest",
    description: "Fetch device auth request with a garbage user code",
    action: testGetDeviceAuthorizationRequest,
  },
  {
    label: "getGeneralSettings",
    description: "Fetch general settings (no invalid args – may succeed)",
    action: testGetGeneralSettings,
  },
  {
    label: "getHostedLoginTranslation",
    description: "Fetch hosted login translation with garbage org and invalid locale",
    action: testGetHostedLoginTranslation,
  },
  {
    label: "getIDPByID",
    description: "Fetch an IDP by a garbage IDP ID",
    action: testGetIDPByID,
  },
  {
    label: "getOrgsByDomain",
    description: "Search organisations by a non-existent domain",
    action: testGetOrgsByDomain,
  },
  {
    label: "getPasswordExpirySettings",
    description: "Fetch password expiry settings with a garbage org ID",
    action: testGetPasswordExpirySettings,
  },
  {
    label: "getSAMLRequest",
    description: "Fetch a SAML request with a garbage samlRequestId",
    action: testGetSAMLRequest,
  },
  {
    label: "getSecuritySettings",
    description: "Fetch security settings (no invalid args – may succeed)",
    action: testGetSecuritySettings,
  },
  {
    label: "humanMFAInitSkipped",
    description: "Mark MFA init as skipped for a garbage user ID",
    action: testHumanMFAInitSkipped,
  },
  {
    label: "listIDPLinks",
    description: "List IDP links for a garbage user ID",
    action: testListIDPLinks,
  },
  {
    label: "listSessions",
    description: "List sessions with garbage session IDs",
    action: testListSessions,
  },
  {
    label: "passwordReset",
    description: "Send a password reset link for a garbage user ID",
    action: testPasswordReset,
  },
  {
    label: "registerU2F",
    description: "Register a U2F device for a garbage user ID",
    action: testRegisterU2F,
  },
  {
    label: "removeTOTP",
    description: "Remove TOTP for a garbage user ID",
    action: testRemoveTOTP,
  },
  {
    label: "removeU2F",
    description: "Remove a U2F device with garbage userId and u2fId",
    action: testRemoveU2F,
  },
  {
    label: "retrieveIDPIntent",
    description: "Retrieve an IDP intent with garbage id and token",
    action: testRetrieveIDPIntent,
  },
  {
    label: "searchUsers",
    description: "Search users with a malformed value and garbage org ID",
    action: testSearchUsers,
  },
  {
    label: "sendEmailCode",
    description: "Send an email verification code for a garbage user ID",
    action: testSendEmailCode,
  },
  {
    label: "sendEmailCodeWithReturn",
    description: "Return an email verification code for a garbage user ID",
    action: testSendEmailCodeWithReturn,
  },
  {
    label: "setPassword",
    description: "Set password for a garbage user ID with too-short password",
    action: testSetPassword,
  },
  {
    label: "setSession",
    description: "Update session state with garbage sessionId and token",
    action: testSetSession,
  },
  {
    label: "startIdentityProviderFlow",
    description: "Start an IDP OAuth flow with a garbage IDP ID",
    action: testStartIdentityProviderFlow,
  },
  {
    label: "startLDAPIdentityProviderFlow",
    description: "Start an LDAP IDP flow with a garbage IDP ID",
    action: testStartLDAPIdentityProviderFlow,
  },
  {
    label: "updateHuman",
    description: "Update a human user with only a garbage userId",
    action: testUpdateHuman,
  },
  {
    label: "verifyInviteCode",
    description: "Verify an invite code for a garbage user ID",
    action: testVerifyInviteCode,
  },
  {
    label: "verifyU2FRegistration",
    description: "Verify a U2F registration for a garbage user ID",
    action: testVerifyU2FRegistration,
  },
];

export default function ZitadelErrorTestPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Zitadel Error Test</h1>
      <p>
        Each test shows how the related function will handle invalid data. (generated by Claude :)
      </p>

      <section className="my-10">
        <h2 className="mb-3 text-lg font-semibold text-gray-800">Zitadel API Tests</h2>
        <p className="mb-4 text-sm text-gray-500">
          Zitadel API functions used in the app ({TESTS.length})
        </p>
        <ul>
          {[...TESTS]
            .sort((a, b) => a.label.localeCompare(b.label))
            .map((test) => (
              <TestRow key={`app-${test.label}`} test={test} />
            ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-800">Zitadel Custom Functions</h2>
        <p className="mb-4 text-sm text-gray-500">
          Zitadel wraper functions in <code>lib/zitadel.ts</code> ({NEW_TESTS.length}).
        </p>
        <ul>
          {[...NEW_TESTS]
            .sort((a, b) => a.label.localeCompare(b.label))
            .map((test) => (
              <TestRow key={`custom-${test.label}`} test={test} />
            ))}
        </ul>
      </section>
    </main>
  );
}
