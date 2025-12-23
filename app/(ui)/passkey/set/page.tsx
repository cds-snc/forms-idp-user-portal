import { Alert } from "@clientComponents/globals";

import { RegisterPasskey } from "./components/register-passkey";
import { I18n } from "@i18n";
import { UserAvatar } from "@serverComponents/UserAvatar";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { loadMostRecentSession } from "@lib/session";
import { getBrandingSettings, getUserByID } from "@lib/zitadel";
import { Session } from "@zitadel/proto/zitadel/session/v2/session_pb";
import { HumanUser, User } from "@zitadel/proto/zitadel/user/v2/user_pb";
import { Metadata } from "next";
import { serverTranslation } from "@i18n/server";
import { headers } from "next/headers";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("passkey");
  return { title: t("set.title") };
}

export default async function Page(props: {
  searchParams: Promise<Record<string | number | symbol, string | undefined>>;
}) {
  const searchParams = await props.searchParams;

  const { userId, loginName, prompt, organization, requestId, code, codeId } = searchParams;

  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);

  // also allow no session to be found for userId-based flows
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
          <I18n i18nKey="set.title" namespace="passkey" />
        </h1>

        <p className="ztdl-p mb-6 block">
          <I18n i18nKey="set.description" namespace="passkey" />
        </p>

        {session ? (
          <UserAvatar
            loginName={loginName ?? session.factors?.user?.loginName}
            displayName={session.factors?.user?.displayName}
            showDropdown
            searchParams={searchParams}
          ></UserAvatar>
        ) : user ? (
          <UserAvatar
            loginName={user?.preferredLoginName}
            displayName={displayName}
            showDropdown
            searchParams={searchParams}
          ></UserAvatar>
        ) : null}
      </div>

      <div className="w-full">
        <Alert.Info>
          <span>
            <I18n i18nKey="set.info.description" namespace="passkey" />
            <a
              className="text-primary-light-500 hover:text-primary-light-300 dark:text-primary-dark-500 hover:dark:text-primary-dark-300"
              target="_blank"
              href="https://zitadel.com/docs/guides/manage/user/reg-create-user#with-passwordless"
            >
              <I18n i18nKey="set.info.link" namespace="passkey" />
            </a>
          </span>
        </Alert.Info>

        {!session && !user && (
          <div className="py-4">
            <Alert.Danger>
              <I18n i18nKey="unknownContext" namespace="error" />
            </Alert.Danger>
          </div>
        )}

        {(session?.id || userId) && (
          <RegisterPasskey
            sessionId={session?.id}
            userId={userId}
            isPrompt={!!prompt}
            organization={organization}
            requestId={requestId}
            code={code}
            codeId={codeId}
          />
        )}
      </div>
    </>
  );
}
