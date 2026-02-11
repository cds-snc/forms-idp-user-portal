"use server";

import { serverTranslation } from "@i18n/server";
import { logMessage } from "@lib/logger";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { getLoginSettings, searchUsers, SearchUsersCommand } from "@lib/zitadel";
import { headers } from "next/headers";
import { create } from "@zitadel/client";
import { ChecksSchema } from "@zitadel/proto/zitadel/session/v2/session_service_pb";
import { createSessionAndUpdateCookie } from "@lib/server/cookie";
import { UserState } from "@zitadel/proto/zitadel/user/v2/user_pb";
import { checkEmailVerification } from "@lib/verify-helper";

export type SendLoginnameCommand = {
  loginName: string;
  requestId?: string;
  organization?: string;
  suffix?: string;
};

export const submitUserNameForm = async (command: SendLoginnameCommand) => {
  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);

  const { t } = await serverTranslation("start");

  const loginSettingsByContext = await getLoginSettings({
    serviceUrl,
    organization: command.organization,
  });

  if (!loginSettingsByContext) {
    return { error: t("errors.couldNotGetLoginSettings") };
  }

  const searchUsersRequest: SearchUsersCommand = {
    serviceUrl,
    searchValue: command.loginName,
    organizationId: command.organization,
    loginSettings: loginSettingsByContext,
    suffix: command.suffix,
  };

  const searchResult = await searchUsers(searchUsersRequest);

  if (!searchResult) {
    logMessage.error("searchUsers returned undefined or null");
    return { error: t("errors.couldNotSearchUsers") };
  }

  if ("error" in searchResult && searchResult.error) {
    logMessage.error("searchUsers returned error, returning early: " + searchResult.error);
    return searchResult;
  }

  if (!("result" in searchResult)) {
    logMessage.error("searchUsers has no result field");
    return { error: t("errors.couldNotSearchUsers") };
  }

  const { result: potentialUsers } = searchResult;

  const users = potentialUsers ?? [];

  // Note: searchUsers already returns an error if multiple users are found,
  // so we only need to handle 0 or 1 user here
  if (users.length === 0 || !users[0].userId) {
    return { redirect: "/register" };
  }

  const user = users[0];
  const userId = user.userId;
  const humanUser = user.type.case === "human" ? user.type.value : undefined;

  if (user.state === UserState.INITIAL) {
    return { error: t("errors.initialUserNotSupported") };
  }

  const checks = create(ChecksSchema, {
    user: { search: { case: "userId", value: userId } },
  });

  const sessionOrError = await createSessionAndUpdateCookie({
    checks,
    requestId: command.requestId,
  }).catch((error) => {
    if (error?.rawMessage === "Errors.User.NotActive (SESSION-Gj4ko)") {
      return { error: t("errors.userNotActive") };
    }
    throw error;
  });

  if ("error" in sessionOrError) {
    return sessionOrError;
  }

  const session = sessionOrError;

  if (!session.factors?.user?.id) {
    return { error: t("errors.couldNotCreateSession") };
  }

  const emailVerificationCheck = checkEmailVerification(
    session,
    humanUser,
    command.organization,
    command.requestId
  );

  if (emailVerificationCheck?.redirect) {
    return emailVerificationCheck;
  }

  return { redirect: "/password" };
};
