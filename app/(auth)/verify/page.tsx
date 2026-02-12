import { Alert } from "@clientComponents/globals";

import { I18n } from "@i18n";
import { UserAvatar } from "@serverComponents/UserAvatar";
import { VerifyEmailForm } from "./components/verify-email-form";
import { sendVerificationEmail } from "@lib/server/verify";
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

  const { userId, loginName, code, organization, requestId, send } = searchParams;

  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);

  let sessionFactors;
  let user: User | undefined;
  let human: HumanUser | undefined;

  let error: string | undefined;

  const doSend = send === "true";

  // Email sending function
  async function sendEmail(userId: string): Promise<string | undefined> {
    const result = await sendVerificationEmail({ userId });
    if (result && "error" in result) {
      // eslint-disable-next-line no-console
      console.error("Could not send verification email", result.error);
      return "emailSendFailed";
    }
    return undefined;
  }

  if ("loginName" in searchParams) {
    sessionFactors = await loadMostRecentSession({
      serviceUrl,
      sessionParams: {
        loginName,
        organization,
      },
    });

    if (doSend && sessionFactors?.factors?.user?.id) {
      error = await sendEmail(sessionFactors.factors.user.id);
    }
  } else if ("userId" in searchParams && userId) {
    if (doSend) {
      error = await sendEmail(userId);
    }

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

  const params = new URLSearchParams({
    initial: "true", // defines that a code is not required and is therefore not shown in the UI
  });

  if (userId) {
    params.set("userId", userId);
  }

  if (loginName) {
    params.set("loginName", loginName);
  }

  if (organization) {
    params.set("organization", organization);
  }

  if (requestId) {
    params.set("requestId", requestId);
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

        {error && (
          <div className="py-4">
            <Alert.Danger>
              <I18n i18nKey={`errors.${error}`} namespace="verify" />
            </Alert.Danger>
          </div>
        )}

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
