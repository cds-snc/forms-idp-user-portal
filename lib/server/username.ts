"use server";

/*--------------------------------------------*
 * Framework and Third-Party
 *--------------------------------------------*/
import { headers } from "next/headers";
import { create } from "@zitadel/client";
import { ChecksSchema } from "@zitadel/proto/zitadel/session/v2/session_service_pb";
import { UserState } from "@zitadel/proto/zitadel/user/v2/user_pb";
import { AuthenticationMethodType } from "@zitadel/proto/zitadel/user/v2/user_service_pb";

/*--------------------------------------------*
 * Internal Aliases
 *--------------------------------------------*/
import { logMessage } from "@lib/logger";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { buildUrlWithRequestId } from "@lib/utils";
import {
  getLoginSettings,
  listAuthenticationMethodTypes,
  searchUsers,
  SearchUsersCommand,
} from "@lib/zitadel";
import { serverTranslation } from "@i18n/server";

import { createSessionAndUpdateCookie } from "./cookie";

export type SendLoginnameCommand = {
  loginName: string;
  requestId?: string;
  organization?: string;
  suffix?: string;
};

/**
 * NOTE: this is replaced by start/actions.ts
 * This file should be deleted when oidc/saml files are removed.
 */
export async function sendLoginname(command: SendLoginnameCommand) {
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

  // @TODO: verify these checks

  // Safety check: ensure searchResult is defined
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

  // Additional safety check: treat undefined result as empty array
  const users = potentialUsers ?? [];

  // Note: searchUsers already returns an error if multiple users are found,
  // so we only need to handle 0 or 1 user here
  if (users.length === 0 || !users[0].userId) {
    return { redirect: buildUrlWithRequestId("/register", command.requestId) };
  }

  const user = users[0];
  const userId = users[0].userId;

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

  // TODO: check if handling of userstate INITIAL is needed
  if (user.state === UserState.INITIAL) {
    return { error: t("errors.initialUserNotSupported") };
  }

  const methods = await listAuthenticationMethodTypes({
    serviceUrl,
    userId: session.factors?.user?.id,
  });

  if (methods.authMethodTypes.includes(AuthenticationMethodType.PASSWORD)) {
    return { redirect: buildUrlWithRequestId("/password", command.requestId) };
  }

  return { redirect: buildUrlWithRequestId("/register", command.requestId) };
}
