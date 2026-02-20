"use server";

/*--------------------------------------------*
 * Framework and Third-Party
 *--------------------------------------------*/
import { headers } from "next/headers";
import { GCNotifyConnector } from "@gcforms/connectors";

/*--------------------------------------------*
 * Internal Aliases
 *--------------------------------------------*/
import { getPasswordResetTemplate } from "@lib/emailTemplates";
import { logMessage } from "@lib/logger";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { listUsers, passwordResetWithReturn } from "@lib/zitadel";
import { serverTranslation } from "@i18n/server";
type SendResetCodeCommand = {
  loginName: string;
  organization?: string;
  requestId?: string;
};

export const submitUserNameForm = async (
  command: SendResetCodeCommand
): Promise<{ error: string } | { userId: string; loginName: string }> => {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const { t } = await serverTranslation("password");

  const users = await listUsers({
    serviceUrl,
    loginName: command.loginName,
    organizationId: command.organization,
  });

  if (!users.details || users.details.totalResult !== BigInt(1) || !users.result[0].userId) {
    return {
      userId: "",
      loginName: command.loginName,
    };
  }

  const user = users.result[0];
  const userId = user.userId;

  let email: string | undefined;
  if (user.type.case === "human") {
    email = user.type.value.email?.email;
  }

  if (!email) {
    return { error: t("errors.couldNotSendResetLink") };
  }

  const codeResponse = await passwordResetWithReturn({
    serviceUrl,
    userId,
  }).catch((_error) => {
    logMessage.error("Failed to get password reset code");
    return { error: t("errors.couldNotSendResetLink") };
  });

  if ("error" in codeResponse) {
    return codeResponse;
  }

  if (!codeResponse.verificationCode) {
    return { error: t("errors.couldNotSendResetLink") };
  }

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
  } catch (_error) {
    logMessage.error("Failed to send password reset email via GC Notify");
    return { error: t("errors.couldNotSendResetLink") };
  }

  return { userId, loginName: command.loginName };
};
