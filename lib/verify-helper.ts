import { timestampDate } from "@zitadel/client";
import { Session } from "@zitadel/proto/zitadel/session/v2/session_pb";
import { LoginSettings } from "@zitadel/proto/zitadel/settings/v2/login_settings_pb";
import { PasswordExpirySettings } from "@zitadel/proto/zitadel/settings/v2/password_settings_pb";
import { HumanUser } from "@zitadel/proto/zitadel/user/v2/user_pb";
import { AuthenticationMethodType } from "@zitadel/proto/zitadel/user/v2/user_service_pb";
import crypto from "crypto";
import moment from "moment";
import { cookies } from "next/headers";
import { getFingerprintIdCookie } from "./fingerprint";
import { getUserByID } from "../lib/zitadel";
import { logMessage } from "./logger";

export function checkPasswordChangeRequired(
  expirySettings: PasswordExpirySettings | undefined,
  session: Session,
  humanUser: HumanUser | undefined,
  organization?: string,
  requestId?: string
) {
  let isOutdated = false;
  if (expirySettings?.maxAgeDays && humanUser?.passwordChanged) {
    const maxAgeDays = Number(expirySettings.maxAgeDays); // Convert bigint to number
    const passwordChangedDate = moment(timestampDate(humanUser.passwordChanged));
    const outdatedPassword = passwordChangedDate.add(maxAgeDays, "days");
    isOutdated = moment().isAfter(outdatedPassword);
  }

  if (humanUser?.passwordChangeRequired || isOutdated) {
    const params = new URLSearchParams({
      loginName: session.factors?.user?.loginName as string,
    });

    if (organization || session.factors?.user?.organizationId) {
      params.append("organization", session.factors?.user?.organizationId as string);
    }

    if (requestId) {
      params.append("requestId", requestId);
    }

    return { redirect: "/password/change?" + params };
  }
}

export function checkEmailVerified(
  session: Session,
  humanUser?: HumanUser,
  organization?: string,
  requestId?: string
) {
  if (!humanUser?.email?.isVerified) {
    const paramsVerify = new URLSearchParams({
      loginName: session.factors?.user?.loginName as string,
      userId: session.factors?.user?.id as string, // verify needs user id
      send: "true", // we request a new email code once the page is loaded
    });

    if (organization || session.factors?.user?.organizationId) {
      paramsVerify.append(
        "organization",
        organization ?? (session.factors?.user?.organizationId as string)
      );
    }

    if (requestId) {
      paramsVerify.append("requestId", requestId);
    }

    return { redirect: "/verify?" + paramsVerify };
  }
}

export function checkEmailVerification(
  session: Session,
  humanUser?: HumanUser,
  organization?: string,
  requestId?: string
) {
  if (!humanUser?.email?.isVerified && process.env.EMAIL_VERIFICATION === "true") {
    const params = new URLSearchParams({
      loginName: session.factors?.user?.loginName as string,
      send: "true", // set this to true as we dont expect old email codes to be valid anymore
    });

    if (requestId) {
      params.append("requestId", requestId);
    }

    if (organization || session.factors?.user?.organizationId) {
      params.append(
        "organization",
        organization ?? (session.factors?.user?.organizationId as string)
      );
    }

    return { redirect: `/verify?` + params };
  }
}

export async function checkMFAFactors(
  serviceUrl: string,
  session: Session,
  loginSettings: LoginSettings | undefined,
  authMethods: AuthenticationMethodType[]
) {
  const availableMultiFactors = authMethods?.filter(
    (m: AuthenticationMethodType) =>
      m === AuthenticationMethodType.TOTP || m === AuthenticationMethodType.U2F
  );

  // if user has only one mfa factor that is not OTP_EMAIL, redirect to that
  const hasSingleStrongFactor = availableMultiFactors?.length === 1;

  if (hasSingleStrongFactor) {
    const params = new URLSearchParams({
      loginName: session.factors?.user?.loginName as string,
    });

    const factor = availableMultiFactors[0];
    if (factor === AuthenticationMethodType.TOTP) {
      logMessage.info("Redirecting user to TOTP verification");
      return { redirect: `/otp/time-based?` + params };
    } else if (factor === AuthenticationMethodType.U2F) {
      logMessage.info("Redirecting user to U2F verification");
      return { redirect: `/u2f?` + params };
    }
  } else if (availableMultiFactors?.length > 1) {
    // Show MFA selection page
    logMessage.info("Redirecting user to MFA selection page");
    return { redirect: `/mfa` };
  } else if (shouldEnforceMFA(session, loginSettings) && !availableMultiFactors.length) {
    logMessage.info("Redirecting user to MFA setup - MFA enforced");
    return { redirect: `/mfa/set` };
  } else if (
    loginSettings?.mfaInitSkipLifetime &&
    (loginSettings.mfaInitSkipLifetime.nanos > 0 ||
      loginSettings.mfaInitSkipLifetime.seconds > 0) &&
    !availableMultiFactors.length &&
    session?.factors?.user?.id &&
    shouldEnforceMFA(session, loginSettings)
  ) {
    const userResponse = await getUserByID({
      serviceUrl,
      userId: session.factors?.user?.id,
    });

    const humanUser =
      userResponse?.user?.type.case === "human" ? userResponse?.user.type.value : undefined;

    if (humanUser?.mfaInitSkipped) {
      const mfaInitSkippedTimestamp = timestampDate(humanUser.mfaInitSkipped);

      const mfaInitSkipLifetimeMillis =
        Number(loginSettings.mfaInitSkipLifetime.seconds) * 1000 +
        loginSettings.mfaInitSkipLifetime.nanos / 1000000;
      const currentTime = Date.now();
      const mfaInitSkippedTime = mfaInitSkippedTimestamp.getTime();
      const timeDifference = currentTime - mfaInitSkippedTime;

      if (!(timeDifference > mfaInitSkipLifetimeMillis)) {
        // if the time difference is smaller than the lifetime, skip the mfa setup
        logMessage.info(
          { userId: session.factors?.user?.id },
          "Skipping MFA setup - user skipped recently"
        );
        return;
      }
    }

    logMessage.info(
      { userId: session.factors?.user?.id },
      "Redirecting user to MFA setup - skip lifetime expired"
    );
    return { redirect: `/mfa/set` };
  }
}

/**
 * Determines if MFA should be enforced based on the authentication method used and login settings
 * @param session - The current session
 * @param loginSettings - The login settings containing MFA enforcement rules
 * @returns true if MFA should be enforced, false otherwise
 */
export function shouldEnforceMFA(
  session: Session,
  loginSettings: LoginSettings | undefined
): boolean {
  if (!loginSettings) {
    return false;
  }

  // If forceMfa is enabled, MFA is required for ALL authentication methods
  if (loginSettings.forceMfa) {
    return true;
  }

  // If forceMfaLocalOnly is enabled, MFA is only required for local/password authentication
  if (loginSettings.forceMfaLocalOnly) {
    // Check if user authenticated with password (local authentication)
    const authenticatedWithPassword = !!session.factors?.password?.verifiedAt;

    // Check if user authenticated with IDP (external authentication)
    const authenticatedWithIDP = !!session.factors?.intent?.verifiedAt;

    // If user authenticated with IDP, MFA is not required for forceMfaLocalOnly
    if (authenticatedWithIDP) {
      return false;
    }

    // If user authenticated with password, MFA is required for forceMfaLocalOnly
    if (authenticatedWithPassword) {
      return true;
    }
  }

  return false;
}

export async function checkUserVerification(userId: string): Promise<boolean> {
  // check if a verification was done earlier
  const cookiesList = await cookies();

  // only read cookie to prevent issues on page.tsx
  const fingerPrintCookie = await getFingerprintIdCookie();

  if (!fingerPrintCookie || !fingerPrintCookie.value) {
    return false;
  }

  const verificationCheck = crypto
    .createHash("sha256")
    .update(`${userId}:${fingerPrintCookie.value}`)
    .digest("hex");

  const cookieValue = await cookiesList.get("verificationCheck")?.value;

  if (!cookieValue) {
    return false;
  }

  if (cookieValue !== verificationCheck) {
    return false;
  }

  return true;
}
