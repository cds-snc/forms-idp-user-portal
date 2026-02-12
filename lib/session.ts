import { timestampDate, Timestamp } from "@zitadel/client";
import { AuthRequest } from "@zitadel/proto/zitadel/oidc/v2/authorization_pb";
import { SAMLRequest } from "@zitadel/proto/zitadel/saml/v2/authorization_pb";
import { Session } from "@zitadel/proto/zitadel/session/v2/session_pb";
import { GetSessionResponse } from "@zitadel/proto/zitadel/session/v2/session_service_pb";
import { AuthenticationMethodType } from "@zitadel/proto/zitadel/user/v2/user_service_pb";
import { getMostRecentCookieWithLoginname, getSessionCookieById } from "./cookies";
import { shouldEnforceMFA } from "./verify-helper";
import { logMessage } from "./logger";
import {
  getLoginSettings,
  getSession,
  getUserByID,
  listAuthenticationMethodTypes,
} from "../lib/zitadel";

export function checkSessionFactorValidity(session: Partial<Session>): {
  valid: boolean;
  verifiedAt?: Timestamp;
} {
  const validPassword = session?.factors?.password?.verifiedAt;
  const validPasskey = session?.factors?.webAuthN?.verifiedAt;
  const validIDP = session?.factors?.intent?.verifiedAt;
  const stillValid = session.expirationDate
    ? timestampDate(session.expirationDate) > new Date()
    : true;

  const verifiedAt = validPassword || validPasskey || validIDP;
  const valid = !!((validPassword || validPasskey || validIDP) && stillValid);

  return { valid, verifiedAt };
}

type LoadMostRecentSessionParams = {
  serviceUrl: string;
  sessionParams: {
    loginName?: string;
    organization?: string;
  };
};

export async function loadMostRecentSession({
  serviceUrl,
  sessionParams,
}: LoadMostRecentSessionParams): Promise<Session | undefined> {
  const recent = await getMostRecentCookieWithLoginname({
    loginName: sessionParams.loginName,
    organization: sessionParams.organization,
  });

  return getSession({
    serviceUrl,
    sessionId: recent.id,
    sessionToken: recent.token,
  }).then((resp: GetSessionResponse) => resp.session);
}

type SessionWithAuthData = {
  id?: string;
  factors?: Session["factors"];
  authMethods: AuthenticationMethodType[];
  phoneVerified: boolean;
  emailVerified: boolean;
  expirationDate?: Session["expirationDate"];
};

async function getAuthMethodsAndUser(
  serviceUrl: string,
  session?: Session
): Promise<SessionWithAuthData> {
  const userId = session?.factors?.user?.id;

  if (!userId) {
    throw Error("Could not get user id from session");
  }

  const methods = await listAuthenticationMethodTypes({
    serviceUrl,
    userId,
  });

  const user = await getUserByID({ serviceUrl, userId });
  const humanUser = user.user?.type.case === "human" ? user.user?.type.value : undefined;

  return {
    id: session?.id,
    factors: session?.factors,
    authMethods: methods.authMethodTypes ?? [],
    phoneVerified: humanUser?.phone?.isVerified ?? false,
    emailVerified: humanUser?.email?.isVerified ?? false,
    expirationDate: session?.expirationDate,
  };
}

export async function loadSessionById(
  serviceUrl: string,
  sessionId: string,
  organization?: string
): Promise<SessionWithAuthData> {
  const recent = await getSessionCookieById({ sessionId, organization });
  const sessionResponse = await getSession({
    serviceUrl,
    sessionId: recent.id,
    sessionToken: recent.token,
  });
  return getAuthMethodsAndUser(serviceUrl, sessionResponse.session);
}

export async function loadSessionByLoginname(
  serviceUrl: string,
  loginName?: string,
  organization?: string
): Promise<SessionWithAuthData> {
  const session = await loadMostRecentSession({
    serviceUrl,
    sessionParams: {
      loginName,
      organization,
    },
  });
  return getAuthMethodsAndUser(serviceUrl, session);
}

/**
 * Load session factors (authentication state) by session ID without fetching auth methods or user verification data.
 * Use this when you only need the session's authentication factors, not the complete enriched session data.
 */
export async function loadSessionFactorsById(
  serviceUrl: string,
  sessionId: string,
  organization?: string
): Promise<Session | undefined> {
  const recent = await getSessionCookieById({ sessionId, organization });
  return getSession({
    serviceUrl,
    sessionId: recent.id,
    sessionToken: recent.token,
  }).then((response) => {
    if (response?.session) {
      return response.session;
    }
  });
}

/**
 * mfa is required, session is not valid anymore (e.g. session expired, user logged out, etc.)
 * to check for mfa for automatically selected session -> const response = await listAuthenticationMethodTypes(userId);
 **/
export async function isSessionValid({
  serviceUrl,
  session,
}: {
  serviceUrl: string;
  session: Session;
}): Promise<boolean> {
  // session can't be checked without user
  if (!session.factors?.user) {
    logMessage.info("Session has no user");
    return false;
  }

  let mfaValid = true;

  // Check if user authenticated via different methods
  const validIDP = session?.factors?.intent?.verifiedAt;
  const validPassword = session?.factors?.password?.verifiedAt;
  const validPasskey = session?.factors?.webAuthN?.verifiedAt;

  // Get login settings to determine if MFA is actually required by policy
  const loginSettings = await getLoginSettings({
    serviceUrl,
    organization: session.factors?.user?.organizationId,
  });

  // Use the existing shouldEnforceMFA function to determine if MFA is required
  const isMfaRequired = shouldEnforceMFA(session, loginSettings);

  // Only enforce MFA validation if MFA is required by policy
  if (isMfaRequired) {
    const authMethodTypes = await listAuthenticationMethodTypes({
      serviceUrl,
      userId: session.factors.user.id,
    });

    const authMethods = authMethodTypes.authMethodTypes;
    // Filter to only MFA methods (exclude PASSWORD and PASSKEY)
    const mfaMethods = authMethods?.filter(
      (method) =>
        method === AuthenticationMethodType.TOTP ||
        method === AuthenticationMethodType.OTP_EMAIL ||
        method === AuthenticationMethodType.OTP_SMS ||
        method === AuthenticationMethodType.U2F
    );

    if (mfaMethods && mfaMethods.length > 0) {
      // Check if any of the configured MFA methods have been verified
      const totpValid =
        mfaMethods.includes(AuthenticationMethodType.TOTP) && !!session.factors.totp?.verifiedAt;
      const otpEmailValid =
        mfaMethods.includes(AuthenticationMethodType.OTP_EMAIL) &&
        !!session.factors.otpEmail?.verifiedAt;
      const otpSmsValid =
        mfaMethods.includes(AuthenticationMethodType.OTP_SMS) &&
        !!session.factors.otpSms?.verifiedAt;
      const u2fValid =
        mfaMethods.includes(AuthenticationMethodType.U2F) && !!session.factors.webAuthN?.verifiedAt;

      mfaValid = totpValid || otpEmailValid || otpSmsValid || u2fValid;

      if (!mfaValid) {
        logMessage.info(
          {
            mfaMethods,
            sessionFactors: {
              totp: session.factors.totp?.verifiedAt,
              otpEmail: session.factors.otpEmail?.verifiedAt,
              otpSms: session.factors.otpSms?.verifiedAt,
              webAuthN: session.factors.webAuthN?.verifiedAt,
            },
          },
          "Session has no valid MFA factor"
        );
      }
    } else {
      // No specific MFA methods configured, but MFA is forced - check for any verified MFA factors
      // (excluding IDP which should be handled separately)
      const otpEmail = session.factors.otpEmail?.verifiedAt;
      const otpSms = session.factors.otpSms?.verifiedAt;
      const totp = session.factors.totp?.verifiedAt;
      const webAuthN = session.factors.webAuthN?.verifiedAt;
      // Note: Removed IDP (session.factors.intent?.verifiedAt) as requested

      mfaValid = !!(otpEmail || otpSms || totp || webAuthN);
      if (!mfaValid) {
        logMessage.info({ sessionFactors: session.factors }, "Session has no valid multifactor");
      }
    }
  }

  // If MFA is not required by policy, mfaValid remains true

  const stillValid = session.expirationDate
    ? timestampDate(session.expirationDate).getTime() > new Date().getTime()
    : true;

  if (!stillValid) {
    logMessage.info(
      {
        expirationDate: session.expirationDate
          ? timestampDate(session.expirationDate).toDateString()
          : "no expiration date",
      },
      "Session is expired"
    );
    return false;
  }

  const validChecks = !!(validPassword || validPasskey || validIDP);

  if (!validChecks) {
    return false;
  }

  if (!mfaValid) {
    return false;
  }

  // Check email verification if EMAIL_VERIFICATION environment variable is enabled
  if (process.env.EMAIL_VERIFICATION === "true") {
    const userResponse = await getUserByID({
      serviceUrl,
      userId: session.factors.user.id,
    });

    const humanUser =
      userResponse?.user?.type.case === "human" ? userResponse?.user.type.value : undefined;

    if (humanUser && !humanUser.email?.isVerified) {
      logMessage.info(
        { userId: session.factors.user.id },
        "Session invalid: Email not verified and EMAIL_VERIFICATION is enabled"
      );
      return false;
    }
  }

  return true;
}

export async function findValidSession({
  serviceUrl,
  sessions,
  authRequest,
  samlRequest,
}: {
  serviceUrl: string;
  sessions: Session[];
  authRequest?: AuthRequest;
  samlRequest?: SAMLRequest;
}): Promise<Session | undefined> {
  const sessionsWithHint = sessions.filter((s) => {
    if (authRequest && authRequest.hintUserId) {
      return s.factors?.user?.id === authRequest.hintUserId;
    }
    if (authRequest && authRequest.loginHint) {
      return s.factors?.user?.loginName === authRequest.loginHint;
    }
    if (samlRequest) {
      // SAML requests don't contain user hints like OIDC (hintUserId/loginHint)
      // so we return all sessions for further processing
      return true;
    }
    return true;
  });

  if (sessionsWithHint.length === 0) {
    return undefined;
  }

  // sort by change date descending
  sessionsWithHint.sort((a, b) => {
    const dateA = a.changeDate ? timestampDate(a.changeDate).getTime() : 0;
    const dateB = b.changeDate ? timestampDate(b.changeDate).getTime() : 0;
    return dateB - dateA;
  });

  // return the first valid session according to settings
  for (const session of sessionsWithHint) {
    // eslint-disable-next-line no-await-in-loop
    if (await isSessionValid({ serviceUrl, session })) {
      return session;
    }
  }

  return undefined;
}
