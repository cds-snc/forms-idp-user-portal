import { redirect } from "next/navigation";

import { logMessage } from "@lib/logger";
import { loadSessionById, loadSessionByLoginname, type SessionWithAuthData } from "@lib/session";

import {
  AuthLevel,
  checkAuthenticationLevel,
  requiresStrongMfaSetupVerification,
} from "./route-protection";

type LoadMfaSetupSessionParams = {
  sessionId?: string;
  loginName?: string;
  pageName: string;
  missingSessionRedirect: string;
};

export async function loadMfaSetupSession({
  sessionId,
  loginName,

  pageName,
  missingSessionRedirect,
}: LoadMfaSetupSessionParams): Promise<SessionWithAuthData> {
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

  if (requiresStrongMfaSetupVerification(sessionData)) {
    logMessage.debug({
      message: `${pageName} requires strong MFA re-verification`,
    });
    redirect("/mfa/set/verify");
  }

  return sessionData;
}
