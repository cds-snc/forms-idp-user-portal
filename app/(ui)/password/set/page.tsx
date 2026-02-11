import { Alert } from "@clientComponents/globals";

import { SetPasswordForm } from "./components/SetPasswordForm";
import { I18n } from "@i18n";
import { UserAvatar } from "@serverComponents/UserAvatar";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { loadMostRecentSession } from "@lib/session";
import {
  // getBrandingSettings,
  getLoginSettings,
  getPasswordComplexitySettings,
  getUserByID,
} from "@lib/zitadel";
import { Session } from "@zitadel/proto/zitadel/session/v2/session_pb";
import { HumanUser, User } from "@zitadel/proto/zitadel/user/v2/user_pb";
import { Metadata } from "next";
import { serverTranslation } from "@i18n/server";
import { headers } from "next/headers";
import { getSerializableObject } from "@lib/utils";
import { getSessionCredentials } from "@lib/cookies";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("password.set");
  return { title: t("title") };
}

export default async function Page() {
  // const searchParams = await props.searchParams;

  // const { userId, loginName, organization, requestId, code, initial } = searchParams;
  const { loginName, organization } = await getSessionCredentials();

  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);

  // also allow no session to be found (ignoreUnkownUsername)
  let session: Session | undefined;
  if (loginName) {
    session = await loadMostRecentSession({
      serviceUrl,
      sessionParams: {
        loginName,
        organization,
      },
    });
  }

  const userId = session?.factors?.user?.id;

  // const branding = await getBrandingSettings({
  //   serviceUrl,
  //   organization,
  // });

  const passwordComplexity = await getPasswordComplexitySettings({
    serviceUrl,
    organization: session?.factors?.user?.organizationId,
  });

  const loginSettings = await getLoginSettings({
    serviceUrl,
    organization,
  }).then((obj) => getSerializableObject(obj));

  let user: User | undefined;
  let displayName: string | undefined;
  if (userId) {
    const userResponse = await getUserByID({
      serviceUrl,
      userId,
    });
    user = userResponse.user;

    if (user?.type.case === "human") {
      displayName = (user.type.value as HumanUser).profile?.displayName;
    }
  }

  return (
    <>
      <div className="flex flex-col space-y-4">
        <h1>
          {session?.factors?.user?.displayName ?? <I18n i18nKey="set.title" namespace="password" />}
        </h1>
        <p className="mb-6 block">
          <I18n i18nKey="set.description" namespace="password" />
        </p>

        {/* show error only if usernames should be shown to be unknown */}
        {loginName && !session && !loginSettings?.ignoreUnknownUsernames && (
          <div className="py-4">
            <Alert.Danger>
              <I18n i18nKey="unknownContext" namespace="error" />
            </Alert.Danger>
          </div>
        )}

        {session ? (
          <UserAvatar
            loginName={loginName ?? session.factors?.user?.loginName}
            displayName={session.factors?.user?.displayName}
            showDropdown
          ></UserAvatar>
        ) : user ? (
          <UserAvatar
            loginName={user?.preferredLoginName}
            displayName={displayName}
            showDropdown
          ></UserAvatar>
        ) : null}
      </div>

      <div className="w-full">
        {/* {!initial && (
          <Alert.Info>
            <I18n i18nKey="set.codeSent" namespace="password" />
          </Alert.Info>
        )} */}

        {passwordComplexity &&
        (loginName ?? user?.preferredLoginName) &&
        (userId ?? session?.factors?.user?.id) ? (
          <SetPasswordForm
            userId={userId ?? (session?.factors?.user?.id as string)}
            loginName={loginName ?? (user?.preferredLoginName as string)}
            organization={organization}
            passwordComplexitySettings={passwordComplexity}
          />
        ) : (
          <div className="py-4">
            <Alert.Warning>
              <I18n i18nKey="failedLoading" namespace="error" />
            </Alert.Warning>
          </div>
        )}
      </div>
    </>
  );
}
