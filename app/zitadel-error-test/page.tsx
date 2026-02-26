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
  testAddHumanUser,
  testGetLegalAndSupportSettings,
  testGetLockoutSettings,
  testGetLoginSettings,
  testGetPasswordComplexitySettings,
  testGetSerializableLoginSettings,
  testGetSession,
  testGetTOTPStatus,
  testGetU2FList,
  testGetUserByID,
  testListAuthenticationMethodTypes,
  testListUsers,
  testPasswordResetWithReturn,
  testRegisterTOTP,
  testResendEmailCode,
  testSetUserPassword,
  testVerifyEmail,
  testVerifyTOTPRegistration,
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

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
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
// Run-all state machine
// ---------------------------------------------------------------------------
type AllResultsState = {
  results: ZitadelTestResult[];
  running: boolean;
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function ZitadelErrorTestPage() {
  const [allState, setAllState] = useState<AllResultsState>({
    results: [],
    running: false,
  });

  async function runAll() {
    setAllState({ results: [], running: true });
    const results = await Promise.all(
      TESTS.map(async (test) => {
        const res = await test.action();
        if (res.error) {
          console.error(`[zitadel-error-test] ${res.fnName}`, res);
        } else {
          console.log(`[zitadel-error-test] ${res.fnName}`, res);
        }
        return res;
      })
    );
    setAllState({ results, running: false });
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Zitadel Error Test</h1>
      <p className="mb-6 text-sm text-gray-500">
        Each button calls the named Zitadel function with intentionally invalid arguments. Results
        and errors are displayed inline and also written to the browser console via{" "}
        <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">[zitadel-error-test]</code>.
      </p>

      {/* Run-all section */}
      <section className="mb-8 rounded border border-gray-300 bg-gray-50 p-4">
        <div className="flex items-center gap-4">
          <button
            className="rounded bg-gray-800 px-5 py-2 text-sm font-bold text-white hover:bg-gray-900 disabled:opacity-50"
            disabled={allState.running}
            onClick={runAll}
          >
            {allState.running ? "Running all tests…" : "Run all tests in parallel"}
          </button>
          {!allState.running && allState.results.length > 0 && (
            <span className="text-sm text-gray-600">
              {allState.results.filter((r) => r.error).length} errors /{" "}
              {allState.results.filter((r) => !r.error).length} successes out of{" "}
              {allState.results.length} tests
            </span>
          )}
        </div>

        {allState.results.length > 0 && (
          <ul className="mt-4 space-y-2">
            {allState.results.map((r) => (
              <ResultCard key={r.fnName} result={r} />
            ))}
          </ul>
        )}
      </section>

      {/* Individual test rows */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-800">Individual tests</h2>
        <ul>
          {[...TESTS]
            .sort((a, b) => a.label.localeCompare(b.label))
            .map((test) => (
              <TestRow key={test.label} test={test} />
            ))}
        </ul>
      </section>
    </main>
  );
}
