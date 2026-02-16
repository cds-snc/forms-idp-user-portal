import { Alert } from "@clientComponents/globals";

import { I18n } from "@i18n";
import { UserAvatar } from "@serverComponents/UserAvatar";
import { VerifyEmailForm } from "./components/VerifyEmailForm";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { loadMostRecentSession } from "@lib/session";
import { getUserByID } from "@lib/zitadel";
import { AuthPanel } from "@serverComponents/globals/AuthPanel";
import { HumanUser, User } from "@zitadel/proto/zitadel/user/v2/user_pb";
import { Metadata } from "next";
import { serverTranslation } from "@i18n/server";
import { headers } from "next/headers";
import { SearchParams } from "@lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("otp");
  return { title: t("verify.title") };
}

export default async function Page(props: { searchParams: Promise<SearchParams> }) {
  const searchParams = await props.searchParams;

  const { userId, loginName, code, organization, requestId } = searchParams;

  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);

  let sessionFactors;
  let user: User | undefined;
  let human: HumanUser | undefined;

  if ("loginName" in searchParams) {
    sessionFactors = await loadMostRecentSession({
      serviceUrl,
      sessionParams: {
        loginName,
        organization,
      },
    });
  } else if ("userId" in searchParams && userId) {
    const userResponse = await getUserByID({
      serviceUrl,
      userId,
    });
    if (userResponse) {
      user = userResponse.user;
      if (user?.type.case === "human") {
        human = user.type.value as HumanUser;
      }
    }
  }

  const id = userId ?? sessionFactors?.factors?.user?.id;

  if (!id) {
    throw Error("Failed to get user id");
  }

  return (
    <AuthPanel titleI18nKey="title" descriptionI18nKey="description" namespace="verify">
      <VerifyEmailForm
        loginName={loginName}
        organization={organization}
        userId={id}
        code={code}
        requestId={requestId}
      >
        <div className="my-8">
          {sessionFactors ? (
            <UserAvatar
              loginName={loginName ?? sessionFactors.factors?.user?.loginName}
              displayName={sessionFactors.factors?.user?.displayName}
              showDropdown
            ></UserAvatar>
          ) : (
            user && (
              <UserAvatar
                loginName={user.preferredLoginName}
                displayName={human?.profile?.displayName}
                showDropdown={false}
              />
            )
          )}
        </div>

        {!id && (
          <div className="py-4">
            <Alert.Danger>
              <I18n i18nKey="unknownContext" namespace="error" />
            </Alert.Danger>
          </div>
        )}
      </VerifyEmailForm>
    </AuthPanel>
  );
}
