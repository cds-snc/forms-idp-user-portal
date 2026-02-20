"use server";

import { createSessionAndUpdateCookie } from "@lib/server/cookie";
import { addHumanUser, getLoginSettings, getUserByID } from "@lib/zitadel";
import { create } from "@zitadel/client";
import { Factors } from "@zitadel/proto/zitadel/session/v2/session_pb";
import { ChecksSchema } from "@zitadel/proto/zitadel/session/v2/session_service_pb";
import { cookies, headers } from "next/headers";
import { serverTranslation } from "@i18n/server";
import crypto from "crypto";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { getOrSetFingerprintId } from "@lib/fingerprint";
import { checkEmailVerification } from "@lib/verify-helper";
import { completeFlowOrGetUrl } from "@lib/client";

type RegisterUserCommand = {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  organization: string;
  requestId?: string;
};

export type RegisterUserResponse = {
  userId: string;
  sessionId: string;
  factors: Factors | undefined;
};
export async function registerUser(command: RegisterUserCommand) {
  const { t } = await serverTranslation("register");
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);

  const addResponse = await addHumanUser({
    serviceUrl,
    email: command.email,
    firstName: command.firstName,
    lastName: command.lastName,
    password: command.password ? command.password : undefined,
    organization: command.organization,
  });

  if (!addResponse) {
    return { error: t("errors.couldNotCreateUser") };
  }

  const loginSettings = await getLoginSettings({
    serviceUrl,
    organization: command.organization,
  });

  const checks = create(ChecksSchema, {
    user: { search: { case: "userId", value: addResponse.userId } },
    ...(command.password && { password: { password: command.password } }),
  });

  const session = await createSessionAndUpdateCookie({
    checks,
    requestId: command.requestId,
    lifetime: command.password ? loginSettings?.passwordCheckLifetime : undefined,
  });

  if (!session || !session.factors?.user) {
    return { error: t("errors.couldNotCreateSession") };
  }

  if (!command.password) {
    const params = new URLSearchParams({
      loginName: session.factors.user.loginName,
      organization: session.factors.user.organizationId,
    });

    if (command.requestId) {
      params.append("requestId", command.requestId);
    }

    // Set verification cookie for users registering with passkey (no password)
    // This allows them to proceed with passkey registration without additional verification
    const cookiesList = await cookies();
    const userAgentId = await getOrSetFingerprintId();

    const verificationCheck = crypto
      .createHash("sha256")
      .update(`${session.factors.user.id}:${userAgentId}`)
      .digest("hex");

    await cookiesList.set({
      name: "verificationCheck",
      value: verificationCheck,
      httpOnly: true,
      path: "/",
      maxAge: 300, // 5 minutes
    });

    return { redirect: "/passkey/set?" + params };
  } else {
    const userResponse = await getUserByID({
      serviceUrl,
      userId: session?.factors?.user?.id,
    });

    if (!userResponse.user) {
      return { error: t("errors.userNotFound") };
    }

    const humanUser =
      userResponse.user.type.case === "human" ? userResponse.user.type.value : undefined;

    const emailVerificationCheck = checkEmailVerification(
      session,
      humanUser,
      session.factors.user.organizationId,
      command.requestId
    );

    if (emailVerificationCheck?.redirect) {
      return emailVerificationCheck;
    }

    return completeFlowOrGetUrl(
      command.requestId && session.id
        ? {
            sessionId: session.id,
            requestId: command.requestId,
            organization: session.factors.user.organizationId,
          }
        : {
            loginName: session.factors.user.loginName,
            organization: session.factors.user.organizationId,
          },
      loginSettings?.defaultRedirectUri
    );
  }
}
