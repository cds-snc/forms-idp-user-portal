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
  testAddHumanUserPermissionDenied,
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
  testSetUserPasswordNotFound,
  testSetUserPasswordShortPassword,
  testStartIdentityProviderFlow,
  testStartLDAPIdentityProviderFlow,
  testUpdateHuman,
  testVerifyEmail,
  testVerifyInviteCode,
  testVerifyTOTPRegistration,
  testVerifyTOTPRegistrationShortCode,
  testVerifyU2FRegistration,
} from "./actions";

// ---------------------------------------------------------------------------
// gRPC status code reference data
// ---------------------------------------------------------------------------
type PossibleError = {
  code: number;
  name: string;
  note?: string;
};

// Common gRPC status codes returned by Zitadel APIs
const E_SUCCESS: PossibleError = { code: 0, name: "OK" };
const E_INVALID_ARG: PossibleError = { code: 3, name: "INVALID_ARGUMENT" };
const E_NOT_FOUND: PossibleError = { code: 5, name: "NOT_FOUND" };
const E_PERMISSION_DENIED: PossibleError = { code: 7, name: "PERMISSION_DENIED" };

// ---------------------------------------------------------------------------
// Types – Zitadel API Tests (per-error scenarios)
// ---------------------------------------------------------------------------
type ErrorScenario = {
  possibleError: PossibleError;
  action: () => Promise<ZitadelTestResult>;
  /** Displayed when we can't easily trigger this error with garbage args */
  note?: string;
};

type ApiTestDef = {
  label: string;
  errorScenarios: ErrorScenario[];
};

// ---------------------------------------------------------------------------
// Type – Zitadel Custom Function Tests (simple single-action tests)
// ---------------------------------------------------------------------------
type SimpleTestDef = {
  label: string;
  description: string;
  action: () => Promise<ZitadelTestResult>;
  possibleErrors?: PossibleError[];
};

const ZITADEL_API_TESTS: ApiTestDef[] = [
  {
    label: "addHumanUser",
    errorScenarios: [
      {
        possibleError: E_INVALID_ARG,
        action: testAddHumanUser,
        note: "email: 'not-an-email', firstName: '', lastName: '' — real org used so only field validation fires",
      },
      {
        possibleError: E_PERMISSION_DENIED,
        action: testAddHumanUserPermissionDenied,
        note: "valid email/name; org is a valid-format ID that doesn't exist — Zitadel treats this as an auth boundary, not a DB miss",
      },
    ],
  },
  {
    label: "getSession",
    errorScenarios: [
      {
        possibleError: E_NOT_FOUND,
        action: testGetSession,
        note: "sessionId: valid-format 18-digit ID that doesn't exist. UNAUTHENTICATED (16) is also possible but only when the session exists with a wrong token — untestable with static IDs.",
      },
    ],
  },
  {
    label: "getTOTPStatus",
    errorScenarios: [
      {
        possibleError: E_NOT_FOUND,
        action: testGetTOTPStatus,
        note: "userId: valid-format 18-digit ID that doesn't exist. INVALID_ARG is not reachable — Zitadel does user lookup before any field validation.",
      },
    ],
  },
  {
    label: "getU2FList",
    errorScenarios: [
      {
        possibleError: E_NOT_FOUND,
        action: testGetU2FList,
        note: "userId: valid-format 18-digit ID that doesn't exist. INVALID_ARG is not reachable — Zitadel does user lookup before any field validation.",
      },
    ],
  },
  {
    label: "getUserByID",
    errorScenarios: [
      {
        possibleError: E_NOT_FOUND,
        action: testGetUserByID,
        note: "userId: valid-format 18-digit ID that doesn't exist. INVALID_ARG is not reachable — Zitadel does user lookup before any field validation.",
      },
    ],
  },
  {
    label: "listAuthenticationMethodTypes",
    errorScenarios: [
      {
        possibleError: E_NOT_FOUND,
        action: testListAuthenticationMethodTypes,
        note: "userId: valid-format 18-digit ID that doesn't exist. INVALID_ARG is not reachable — Zitadel does user lookup before any field validation.",
      },
    ],
  },
  {
    label: "listUsers",
    errorScenarios: [
      {
        possibleError: E_SUCCESS,
        action: testListUsers,
        note: "listUsers is a flexible search that always succeeds — returns users matching filters, or empty if none match. No error path reachable via query args.",
      },
    ],
  },
  {
    label: "passwordResetWithReturn",
    errorScenarios: [
      {
        possibleError: E_NOT_FOUND,
        action: testPasswordResetWithReturn,
        note: "userId: valid-format 18-digit ID that doesn't exist.",
      },
    ],
  },
  {
    label: "registerTOTP",
    errorScenarios: [
      {
        possibleError: E_NOT_FOUND,
        action: testRegisterTOTP,
        note: "userId: valid-format 18-digit ID that doesn't exist.",
      },
    ],
  },
  {
    label: "resendEmailCode",
    errorScenarios: [
      {
        possibleError: E_NOT_FOUND,
        action: testResendEmailCode,
        note: "userId: valid-format 18-digit ID that doesn't exist.",
      },
    ],
  },
  {
    label: "setUserPassword",
    errorScenarios: [
      {
        possibleError: E_NOT_FOUND,
        action: testSetUserPasswordNotFound,
        note: "userId: valid-format 18-digit ID that doesn't exist; password: 'TestPass123!'",
      },
      {
        possibleError: E_INVALID_ARG,
        action: testSetUserPasswordShortPassword,
        note: "userId: valid-format ID; only password: 'x' is invalid (too short)",
      },
    ],
  },
  {
    label: "verifyEmail",
    errorScenarios: [
      {
        possibleError: E_NOT_FOUND,
        action: testVerifyEmail,
        note: "userId: valid-format 18-digit ID that doesn't exist. INVALID_ARG for bad code format is not reachable — user lookup fires before code validation.",
      },
    ],
  },
  {
    label: "verifyTOTPRegistration",
    errorScenarios: [
      {
        possibleError: E_NOT_FOUND,
        action: testVerifyTOTPRegistration,
        note: "userId: valid-format 18-digit ID that doesn't exist; code: '000000'",
      },
      {
        possibleError: E_INVALID_ARG,
        action: testVerifyTOTPRegistrationShortCode,
        note: "userId: valid-format ID; only code: '123' is invalid (must be 6 digits)",
      },
    ],
  },
];

const ZITADEL_WRAPER_FUNCTIONS_TESTS: SimpleTestDef[] = [
  {
    label: "addHuman",
    description: "addHuman with empty AddHumanUserRequest",
    action: testAddHuman,
    possibleErrors: [E_INVALID_ARG],
  },
  {
    label: "addIDPLink",
    description: "Link a garbage IDP to a garbage user ID",
    action: testAddIDPLink,
    possibleErrors: [E_NOT_FOUND],
  },
  {
    label: "addOTPEmail",
    description: "Add OTP email for a garbage user ID",
    action: testAddOTPEmail,
    possibleErrors: [E_NOT_FOUND],
  },
  {
    label: "addOTPSMS",
    description: "Add OTP SMS for a garbage user ID",
    action: testAddOTPSMS,
    possibleErrors: [E_NOT_FOUND],
  },
  {
    label: "authorizeOrDenyDeviceAuthorization",
    description: "Authorize a device with a garbage deviceAuthorizationId",
    action: testAuthorizeOrDenyDeviceAuthorization,
    possibleErrors: [E_NOT_FOUND],
  },
  {
    label: "createCallback",
    description: "Create an OIDC callback with a garbage authRequestId",
    action: testCreateCallback,
    possibleErrors: [E_NOT_FOUND],
  },
  {
    label: "createInviteCode",
    description: "Create an invite code for a garbage user ID",
    action: testCreateInviteCode,
    possibleErrors: [E_NOT_FOUND],
  },
  {
    label: "createResponse",
    description: "Create a SAML response with a garbage samlRequestId",
    action: testCreateSAMLResponse,
    possibleErrors: [E_NOT_FOUND],
  },
  {
    label: "createSessionForUserIdAndIdpIntent",
    description: "Create session with garbage userId and IDP intent tokens",
    action: testCreateSessionForUserIdAndIdpIntent,
    possibleErrors: [E_NOT_FOUND],
  },
  {
    label: "createSessionFromChecks",
    description: "Create session with garbage userId and negative lifetime",
    action: testCreateSessionFromChecks,
    possibleErrors: [E_NOT_FOUND],
  },
  {
    label: "deleteSession",
    description: "Delete a session with garbage sessionId and token",
    action: testDeleteSession,
    possibleErrors: [E_NOT_FOUND],
  },
  {
    label: "getActiveIdentityProviders",
    description: "List active IDPs using makeReqCtx (always cascades to instance)",
    action: testGetActiveIdentityProviders,
    possibleErrors: [E_SUCCESS],
  },
  {
    label: "getAuthRequest",
    description: "Fetch an OIDC auth request with a garbage authRequestId",
    action: testGetAuthRequest,
    possibleErrors: [E_NOT_FOUND],
  },
  {
    label: "getBrandingSettings",
    description: "Fetch branding settings — makeReqCtx cascades to instance defaults",
    action: testGetBrandingSettings,
    possibleErrors: [E_SUCCESS],
  },
  {
    label: "getDefaultOrg",
    description: "Fetch the default organisation — list query, returns null if none configured",
    action: testGetDefaultOrg,
    possibleErrors: [E_SUCCESS],
  },
  {
    label: "getDeviceAuthorizationRequest",
    description: "Fetch device auth request with a garbage user code",
    action: testGetDeviceAuthorizationRequest,
    possibleErrors: [E_NOT_FOUND],
  },
  {
    label: "getGeneralSettings",
    description: "Fetch general settings (no invalid args – may succeed)",
    action: testGetGeneralSettings,
    possibleErrors: [],
  },
  {
    label: "getHostedLoginTranslation",
    description:
      "Fetch hosted login translation — org cascades to instance, unknown locale returns empty",
    action: testGetHostedLoginTranslation,
    possibleErrors: [E_SUCCESS],
  },
  {
    label: "getIDPByID",
    description: "Fetch an IDP by a garbage IDP ID",
    action: testGetIDPByID,
    possibleErrors: [E_NOT_FOUND],
  },
  {
    label: "getLegalAndSupportSettings",
    description: "Fetch legal and support settings — makeReqCtx cascades to instance defaults",
    action: testGetLegalAndSupportSettings,
    possibleErrors: [E_SUCCESS],
  },
  {
    label: "getLockoutSettings",
    description: "Fetch lockout settings — makeReqCtx cascades to instance defaults",
    action: testGetLockoutSettings,
    possibleErrors: [E_SUCCESS],
  },
  {
    label: "getLoginSettings",
    description: "Fetch login settings — makeReqCtx cascades to instance defaults",
    action: testGetLoginSettings,
    possibleErrors: [E_SUCCESS],
  },
  {
    label: "getOrgsByDomain",
    description: "Search organisations by a non-existent domain",
    action: testGetOrgsByDomain,
    possibleErrors: [],
  },
  {
    label: "getPasswordComplexitySettings",
    description: "Fetch password complexity settings — makeReqCtx cascades to instance defaults",
    action: testGetPasswordComplexitySettings,
    possibleErrors: [E_SUCCESS],
  },
  {
    label: "getPasswordExpirySettings",
    description: "Fetch password expiry settings — makeReqCtx cascades to instance defaults",
    action: testGetPasswordExpirySettings,
    possibleErrors: [E_SUCCESS],
  },
  {
    label: "getSAMLRequest",
    description: "Fetch a SAML request with a garbage samlRequestId",
    action: testGetSAMLRequest,
    possibleErrors: [E_NOT_FOUND],
  },
  {
    label: "getSecuritySettings",
    description: "Fetch security settings (no invalid args – may succeed)",
    action: testGetSecuritySettings,
    possibleErrors: [],
  },
  {
    label: "getSerializableLoginSettings",
    description: "Fetch serializable login settings — makeReqCtx cascades to instance defaults",
    action: testGetSerializableLoginSettings,
    possibleErrors: [E_SUCCESS],
  },
  {
    label: "humanMFAInitSkipped",
    description: "Mark MFA init as skipped for a garbage user ID",
    action: testHumanMFAInitSkipped,
    possibleErrors: [E_NOT_FOUND],
  },
  {
    label: "listIDPLinks",
    description: "List IDP links for a garbage user ID",
    action: testListIDPLinks,
    possibleErrors: [E_NOT_FOUND],
  },
  {
    label: "listSessions",
    description: "List sessions — IDs query returns empty array for unknown IDs",
    action: testListSessions,
    possibleErrors: [E_SUCCESS],
  },
  {
    label: "passwordReset",
    description: "Send a password reset link for a garbage user ID",
    action: testPasswordReset,
    possibleErrors: [E_NOT_FOUND],
  },
  {
    label: "registerU2F",
    description: "Register a U2F device for a garbage user ID",
    action: testRegisterU2F,
    possibleErrors: [E_NOT_FOUND],
  },
  {
    label: "removeTOTP",
    description: "Remove TOTP for a garbage user ID",
    action: testRemoveTOTP,
    possibleErrors: [E_NOT_FOUND],
  },
  {
    label: "removeU2F",
    description: "Remove a U2F device with garbage userId and u2fId",
    action: testRemoveU2F,
    possibleErrors: [E_NOT_FOUND],
  },
  {
    label: "retrieveIDPIntent",
    description: "Retrieve an IDP intent with garbage id and token",
    action: testRetrieveIDPIntent,
    possibleErrors: [E_NOT_FOUND],
  },
  {
    label: "searchUsers",
    description: "Search users — returns empty result array, not an error, when no matches found",
    action: testSearchUsers,
    possibleErrors: [E_SUCCESS],
  },
  {
    label: "sendEmailCode",
    description: "Send an email verification code for a garbage user ID",
    action: testSendEmailCode,
    possibleErrors: [E_NOT_FOUND],
  },
  {
    label: "sendEmailCodeWithReturn",
    description: "Return an email verification code for a garbage user ID",
    action: testSendEmailCodeWithReturn,
    possibleErrors: [E_NOT_FOUND],
  },
  {
    label: "setPassword",
    description:
      "Set password for a garbage user ID — user lookup fires before password validation",
    action: testSetPassword,
    possibleErrors: [E_NOT_FOUND],
  },
  {
    label: "setSession",
    description: "Update session state with garbage sessionId — lookup fires before token check",
    action: testSetSession,
    possibleErrors: [E_NOT_FOUND],
  },
  {
    label: "startIdentityProviderFlow",
    description: "Start an IDP OAuth flow with a garbage IDP ID",
    action: testStartIdentityProviderFlow,
    possibleErrors: [E_NOT_FOUND],
  },
  {
    label: "startLDAPIdentityProviderFlow",
    description:
      "Start an LDAP IDP flow with a garbage IDP ID — IDP lookup fires before LDAP checks",
    action: testStartLDAPIdentityProviderFlow,
    possibleErrors: [E_NOT_FOUND],
  },
  {
    label: "updateHuman",
    description: "Update a human user with only a garbage userId",
    action: testUpdateHuman,
    possibleErrors: [E_NOT_FOUND],
  },
  {
    label: "verifyInviteCode",
    description:
      "Verify an invite code for a garbage user ID — user lookup fires before code validation",
    action: testVerifyInviteCode,
    possibleErrors: [E_NOT_FOUND],
  },
  {
    label: "verifyU2FRegistration",
    description:
      "Verify a U2F registration for a garbage user ID — user lookup fires before registration check",
    action: testVerifyU2FRegistration,
    possibleErrors: [E_NOT_FOUND],
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
          Test args
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

// ---------------------------------------------------------------------------
// ApiTestRow – one button, one result card per error scenario
// ---------------------------------------------------------------------------

const ERROR_CODE_COLORS: Record<number, string> = {
  0: "bg-green-100 text-green-800 border-green-300",
  3: "bg-orange-100 text-orange-800 border-orange-300",
  5: "bg-yellow-100 text-yellow-800 border-yellow-300",
  7: "bg-red-100 text-red-800 border-red-300",
  9: "bg-pink-100 text-pink-800 border-pink-300",
  16: "bg-blue-100 text-blue-800 border-blue-300",
};

function PossibleErrorBadge({ error, matched }: { error: PossibleError; matched: boolean }) {
  const base = "inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-xs";
  const colorCls = ERROR_CODE_COLORS[error.code] ?? "border-gray-300 bg-gray-100 text-gray-700";
  const matchedCls = matched ? "font-bold ring-2 ring-black ring-offset-1" : "";

  return (
    <span className={`${base} ${colorCls} ${matchedCls}`}>
      {error.code} {error.name}
      {matched && <span className="ml-0.5">←</span>}
    </span>
  );
}

type ScenarioCardProps = {
  scenario: ErrorScenario;
  result: ZitadelTestResult | null;
  isPending: boolean;
};

function ScenarioCard({ scenario, result, isPending }: ScenarioCardProps) {
  const { possibleError, note } = scenario;
  // code 0 = expect success; matched when there is no error. Otherwise match on gRPC code.
  const matched =
    possibleError.code === 0
      ? result !== null && !result.error
      : result?.error?.code === possibleError.code;

  return (
    <div className="rounded border border-gray-200 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Expected:
        </span>
        <PossibleErrorBadge error={possibleError} matched={matched} />
        {note && <span className="text-xs italic text-gray-400">{note}</span>}
      </div>

      {isPending && !result && <p className="mt-2 text-xs text-gray-400">Running…</p>}
      {!result && !isPending && <p className="mt-2 text-xs text-gray-300">Not yet run</p>}
      {result && (
        <div className="mt-2">
          <ResultCard result={result} />
        </div>
      )}
    </div>
  );
}

type ApiTestRowProps = {
  test: ApiTestDef;
};

function ApiTestRow({ test }: ApiTestRowProps) {
  const [results, setResults] = useState<(ZitadelTestResult | null)[]>(
    test.errorScenarios.map(() => null)
  );
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const settled = await Promise.all(test.errorScenarios.map((s) => s.action()));
      settled.forEach((res) => {
        if (res.error) {
          console.error(`[zitadel-error-test] ${res.fnName}`, res);
        } else {
          console.log(`[zitadel-error-test] ${res.fnName}`, res);
        }
      });
      setResults(settled);
    });
  }

  const scenarioCount = test.errorScenarios.length;

  return (
    <li className="border-b border-gray-200 py-4 last:border-b-0">
      <div className="mb-3 flex items-center gap-4">
        <button
          className="min-w-[220px] rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          disabled={isPending}
          onClick={handleClick}
        >
          {isPending ? "Running…" : test.label}
        </button>
        <span className="text-xs text-gray-400">
          {scenarioCount} scenario{scenarioCount > 1 ? "s" : ""}
        </span>
      </div>
      <div className="space-y-2 pl-2">
        {test.errorScenarios.map((scenario, i) => (
          <ScenarioCard
            key={scenario.possibleError.code}
            scenario={scenario}
            result={results[i]}
            isPending={isPending}
          />
        ))}
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// SimpleTestRow – original single-action row (used by NEW_TESTS)
// ---------------------------------------------------------------------------

type SimpleTestRowProps = {
  test: SimpleTestDef;
};

function SimpleTestRow({ test }: SimpleTestRowProps) {
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

  const actualCode = result?.error?.code;

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
        <div className="flex-1 pt-1">
          <p className="text-sm text-gray-600">{test.description}</p>
          {test.possibleErrors && test.possibleErrors.length > 0 && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-gray-400">expected errors:</span>
              {test.possibleErrors.map((e) => (
                <PossibleErrorBadge
                  key={e.code}
                  error={e}
                  matched={actualCode !== undefined && actualCode === e.code}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      {result && <ResultCard result={result} />}
    </li>
  );
}

export default function ZitadelErrorTestPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Zitadel Errors</h1>
      <p>Each test shows how the related function will handle invalid data.</p>

      <section className="my-10">
        <h2 className="mb-3 text-lg font-semibold text-gray-800">Zitadel API Tests</h2>
        <p className="mb-4 text-sm text-gray-500">
          Zitadel API functions used in the app ({ZITADEL_API_TESTS.length})
        </p>
        <ul className="list-none pl-0">
          {[...ZITADEL_API_TESTS]
            .sort((a, b) => a.label.localeCompare(b.label))
            .map((test) => (
              <ApiTestRow key={`app-${test.label}`} test={test} />
            ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-800">Zitadel Custom Functions</h2>
        <p className="mb-4 text-sm text-gray-500">
          Zitadel wraper functions in <code>lib/zitadel.ts</code> (
          {ZITADEL_WRAPER_FUNCTIONS_TESTS.length}).
        </p>
        <ul className="list-none pl-0">
          {[...ZITADEL_WRAPER_FUNCTIONS_TESTS]
            .sort((a, b) => a.label.localeCompare(b.label))
            .map((test) => (
              <SimpleTestRow key={`custom-${test.label}`} test={test} />
            ))}
        </ul>
      </section>
    </main>
  );
}
