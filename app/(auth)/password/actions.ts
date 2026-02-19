"use server";

import { serverTranslation } from "@i18n/server";
import { getSessionCookieByLoginName } from "@lib/cookies";
import { getPasswordResetTemplate } from "@lib/emailTemplates";
import { logMessage } from "@lib/logger";
import { CreateSessionFailedError, setSessionAndUpdateCookie } from "@lib/server/cookie";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { checkMFAFactors } from "@lib/verify-helper";
import {
  getLockoutSettings,
  getLoginSettings,
  getUserByID,
  listAuthenticationMethodTypes,
  listUsers,
  passwordResetWithReturn,
} from "@lib/zitadel";
import { Duration } from "@zitadel/client";
import { Checks } from "@zitadel/proto/zitadel/session/v2/session_service_pb";
import { UserState } from "@zitadel/proto/zitadel/user/v2/user_pb";
import { headers } from "next/headers";
import { GCNotifyConnector } from "@gcforms/connectors";

export type SubmitPasswordCommand = {
  loginName: string;
  organization?: string;
  checks: Checks;
  requestId?: string;
};

export const submitPasswordForm = async (
  command: SubmitPasswordCommand
): Promise<{ error: string } | { redirect: string }> => {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const { t } = await serverTranslation("password");

  const sessionCookie = await getSessionCookieByLoginName({
    loginName: command.loginName,
    organization: command.organization,
  }).catch((error) => {
    logMessage.warn(`Ignored error: ${error?.message}`); // TODO: how to handle this error?
  });

  let session;

  // @TODO: confirm approach - previous code tried to find a user to login from email
  if (!sessionCookie) {
    logMessage.info("No session cookie found, proceeding without it");
    return { error: t("errors.noValidSession") };
  }

  const loginSettings = await getLoginSettings({
    serviceUrl,
    organization: sessionCookie.organization,
  });

  if (!loginSettings) {
    return { error: "Could not load login settings" };
  }

  let lifetime = loginSettings.passwordCheckLifetime;

  if (!lifetime || !lifetime.seconds) {
    logMessage.warn("No password lifetime provided, defaulting to 24 hours");
    lifetime = {
      seconds: BigInt(60 * 60 * 24), // default to 24 hours
      nanos: 0,
    } as Duration;
  }

  try {
    session = await setSessionAndUpdateCookie({
      recentCookie: sessionCookie,
      checks: command.checks,
      requestId: command.requestId,
      lifetime,
    });
  } catch (error: unknown) {
    const errorDetail = error as CreateSessionFailedError;
    if ("failedAttempts" in errorDetail && errorDetail.failedAttempts) {
      const lockoutSettings = await getLockoutSettings({
        serviceUrl,
        orgId: command.organization,
      });

      const hasLimit =
        lockoutSettings?.maxPasswordAttempts !== undefined &&
        lockoutSettings?.maxPasswordAttempts > BigInt(0);
      const locked = hasLimit && errorDetail.failedAttempts >= lockoutSettings?.maxPasswordAttempts;
      const messageKey = hasLimit
        ? "errors.failedToAuthenticate"
        : "errors.failedToAuthenticateNoLimit";

      return {
        error: t(messageKey, {
          failedAttempts: errorDetail.failedAttempts,
          maxPasswordAttempts: hasLimit ? (lockoutSettings?.maxPasswordAttempts).toString() : "?",
          lockoutMessage: locked ? t("errors.accountLockedContactAdmin") : "",
        }),
      };
    }
    throw error;
  }

  if (!session?.factors?.user?.id) {
    return { error: t("errors.couldNotCreateSessionForUser") };
  }

  const userResponse = await getUserByID({
    serviceUrl,
    userId: session?.factors?.user?.id,
  });

  if (!userResponse.user) {
    return { error: t("errors.userNotFound") };
  }

  const user = userResponse.user;

  // @TODO: needed?
  if (!session?.factors?.user?.id || !sessionCookie) {
    return { error: t("errors.couldNotCreateSessionForUser") };
  }

  // @TODO: How to handle Expired passwords (also, will we expire passwords?)

  // throw error if user is in initial state here and do not continue
  if (user.state === UserState.INITIAL) {
    return { error: t("errors.initialUserNotSupported") };
  }

  // if password, check if user has MFA methods
  let authMethods;
  if (command.checks && command.checks.password && session.factors?.user?.id) {
    const response = await listAuthenticationMethodTypes({
      serviceUrl,
      userId: session.factors.user.id,
    });
    if (response.authMethodTypes && response.authMethodTypes.length) {
      authMethods = response.authMethodTypes;
    }
  }

  if (!authMethods) {
    return { error: t("errors.couldNotVerifyPassword") };
  }

  const mfaFactorCheck = await checkMFAFactors(
    serviceUrl,
    session,
    loginSettings,
    authMethods,
    command.requestId
  );

  return mfaFactorCheck;
};

type ResetPasswordCommand = {
  loginName: string;
  organization?: string;
  requestId?: string;
};

export async function resetPassword(command: ResetPasswordCommand) {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);

  const { t } = await serverTranslation("password");

  const users = await listUsers({
    serviceUrl,
    loginName: command.loginName,
    organizationId: command.organization,
  });

  if (!users.details || users.details.totalResult !== BigInt(1) || !users.result[0].userId) {
    return { error: t("errors.couldNotSendResetLink") };
  }

  const user = users.result[0];
  const userId = user.userId;

  // Get user email
  let email: string | undefined;
  if (user.type.case === "human") {
    email = user.type.value.email?.email;
  }

  if (!email) {
    return { error: t("errors.couldNotSendResetLink") };
  }

  // Get password reset code from Zitadel (returnCode mode - does not send email)
  const codeResponse = await passwordResetWithReturn({
    serviceUrl,
    userId,
  }).catch((error) => {
    logMessage.debug({ message: (error as Error)?.message });
    return { error: t("errors.couldNotSendResetLink") };
  });

  if ("error" in codeResponse) {
    return codeResponse;
  }

  if (!codeResponse.verificationCode) {
    return { error: t("errors.couldNotSendResetLink") };
  }

  // Send email via GC Notify
  const apiKey = process.env.NOTIFY_API_KEY;
  const templateId = process.env.TEMPLATE_ID;
  const resetCode = codeResponse.verificationCode;

  if (!apiKey || !templateId) {
    logMessage.error("Missing NOTIFY_API_KEY or TEMPLATE_ID environment variables");
    return { error: t("errors.couldNotSendResetLink") };
  }

  try {
    const gcNotify = GCNotifyConnector.default(apiKey);
    await gcNotify.sendEmail(email, templateId, getPasswordResetTemplate(resetCode));
  } catch (error) {
    logMessage.debug({ message: (error as Error)?.message });
    return { error: t("errors.couldNotSendResetLink") };
  }
}
