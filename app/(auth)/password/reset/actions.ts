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

  const users = await listUsers({
    serviceUrl,
    loginName: command.loginName,
    organizationId: command.organization,
  });

  const nonEnumeratingResponse = {
    userId: "",
    loginName: command.loginName,
  };

  if (!users.details || users.details.totalResult !== BigInt(1) || !users.result[0].userId) {
    return nonEnumeratingResponse;
  }

  const user = users.result[0];
  const userId = user.userId;

  let email: string | undefined;
  if (user.type.case === "human") {
    email = user.type.value.email?.email;
  }

  if (!email) {
    logMessage.info("Password reset requested for user without email address");
    return nonEnumeratingResponse;
  }

  const codeResponse = await passwordResetWithReturn({
    serviceUrl,
    userId,
  }).catch((_error) => {
    logMessage.error("Failed to get password reset code");
    return undefined;
  });

  if (!codeResponse || !("verificationCode" in codeResponse) || !codeResponse.verificationCode) {
    logMessage.error("Password reset code missing from response");
    return nonEnumeratingResponse;
  }

  const apiKey = process.env.NOTIFY_API_KEY;
  const templateId = process.env.TEMPLATE_ID;
  const resetCode = codeResponse.verificationCode;

  if (!apiKey || !templateId) {
    logMessage.error("Missing NOTIFY_API_KEY or TEMPLATE_ID environment variables");
    return nonEnumeratingResponse;
  }

  try {
    const gcNotify = GCNotifyConnector.default(apiKey);
    await gcNotify.sendEmail(email, templateId, getPasswordResetTemplate(resetCode));
  } catch (_error) {
    logMessage.error("Failed to send password reset email via GC Notify");
    return nonEnumeratingResponse;
  }

  return { userId, loginName: command.loginName };
};
