import { redirect } from "next/navigation";

import { getSessionCredentials } from "@lib/cookies";
import { logMessage } from "@lib/logger";
import { loadSessionById, loadSessionByLoginname, type SessionWithAuthData } from "@lib/session";

import { AuthLevel, checkAuthenticationLevel } from "./route-protection";

type LoadMfaVerificationSessionParams = {
  pageName: string;
  missingSessionRedirect: string;
};

type MfaVerificationSession = {
  sessionId?: string;
  loginName?: string;
  sessionData: SessionWithAuthData;
};

export async function loadMfaVerificationSession({
  pageName,
  missingSessionRedirect,
}: LoadMfaVerificationSessionParams): Promise<MfaVerificationSession> {
  let sessionId: string | undefined;
  let loginName: string | undefined;

  try {
    ({ sessionId, loginName } = await getSessionCredentials());
  } catch {
    redirect("/password");
  }

  const authCheck = await checkAuthenticationLevel(AuthLevel.PASSWORD_REQUIRED, loginName);

  if (!authCheck.satisfied) {
    logMessage.debug({
      message: `${pageName} auth check failed`,
      reason: authCheck.reason,
      redirect: authCheck.redirect,
    });
    redirect(authCheck.redirect || "/password");
  }

  let sessionData: SessionWithAuthData;

  try {
    sessionData = sessionId
      ? await loadSessionById(sessionId)
      : await loadSessionByLoginname(loginName);
  } catch {
    logMessage.debug({
      message: `${pageName} missing session factors`,
      hasSessionId: !!sessionId,
      hasLoginName: !!loginName,
    });
    redirect(missingSessionRedirect);
  }

  return {
    sessionId,
    loginName,

    sessionData,
  };
}
