import { Alert } from "@clientComponents/globals";

import { I18n } from "@i18n";
import { UserAvatar } from "@serverComponents/UserAvatar";
import { VerifyEmailForm } from "./components/verify-email-form";
import { sendEmailCode, sendInviteEmailCode } from "@lib/server/verify";
import { getOriginalHostWithProtocol } from "@lib/server/host";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { loadMostRecentSession } from "@lib/session";
import { getUserByID } from "@lib/zitadel";
import { HumanUser, User } from "@zitadel/proto/zitadel/user/v2/user_pb";
import { Metadata } from "next";
import { serverTranslation } from "@i18n/server";
import { headers } from "next/headers";
import { AuthPanelTitle } from "@serverComponents/globals/AuthPanelTitle";
import Link from "next/link";
import { LinkButton } from "@serverComponents/globals/Buttons/LinkButton";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("otp");
  return { title: t("verify.title") };
}

export default async function Page(props: { searchParams: Promise<any> }) {
  const searchParams = await props.searchParams;

  const { userId, loginName, code, organization, requestId, invite, send } = searchParams;

  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);

  let sessionFactors;
  let user: User | undefined;
  let human: HumanUser | undefined;
  let id: string | undefined;

  let error: string | undefined;

  const doSend = send === "true";

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  async function sendEmail(userId: string) {
    const hostWithProtocol = await getOriginalHostWithProtocol();

    if (invite === "true") {
      await sendInviteEmailCode({
        userId,
        urlTemplate:
          `${hostWithProtocol}${basePath}/verify?code={{.Code}}&userId={{.UserID}}&organization={{.OrgID}}&invite=true` +
          (requestId ? `&requestId=${requestId}` : ""),
      }).catch((apiError) => {
        console.error("Could not send invitation email", apiError);
        error = "inviteSendFailed";
      });
    } else {
      await sendEmailCode({
        userId,
        urlTemplate:
          `${hostWithProtocol}${basePath}/verify?code={{.Code}}&userId={{.UserID}}&organization={{.OrgID}}` +
          (requestId ? `&requestId=${requestId}` : ""),
      }).catch((apiError) => {
        console.error("Could not send verification email", apiError);
        error = "emailSendFailed";
      });
    }
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
      await sendEmail(sessionFactors.factors.user.id);
    }
  } else if ("userId" in searchParams && userId) {
    if (doSend) {
      await sendEmail(userId);
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

  id = userId ?? sessionFactors?.factors?.user?.id;

  if (!id) {
    throw Error("Failed to get user id");
  }

  const params = new URLSearchParams({
    userId: userId,
    initial: "true", // defines that a code is not required and is therefore not shown in the UI
  });

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
    <>
      <div id="auth-panel">
        <VerifyEmailForm
          loginName={loginName}
          organization={organization}
          userId={id}
          code={code}
          isInvite={invite === "true"}
          requestId={requestId}
        >
          <AuthPanelTitle i18nKey="title" namespace="verify" />

          <div className="my-8">
            {sessionFactors ? (
              <UserAvatar
                loginName={loginName ?? sessionFactors.factors?.user?.loginName}
                displayName={sessionFactors.factors?.user?.displayName}
                showDropdown
                searchParams={searchParams}
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

          {/* {id && send && (
                  <div className="w-full py-4">
                    <Alert.Info>
                      <I18n i18nKey="verify.codeSent" namespace="verify" />
                    </Alert.Info>
                  </div>
                )} */}
        </VerifyEmailForm>
      </div>
    </>
  );
}
