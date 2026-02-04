import { Alert } from "@clientComponents/globals";
import { BackButton } from "@clientComponents/globals/Buttons/BackButton";
import { ChooseSecondFactorToSetup } from "./components/choose-second-factor-to-setup";

import { I18n } from "@i18n";
import { UserAvatar } from "@serverComponents/UserAvatar";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { loadSessionById, loadSessionByLoginname } from "@lib/session";
import { getLoginSettings } from "@lib/zitadel";
import { Timestamp, timestampDate } from "@zitadel/client";
import { Session } from "@zitadel/proto/zitadel/session/v2/session_pb";
import { Metadata } from "next";
import { serverTranslation } from "@i18n/server";
import { headers } from "next/headers";
import { getSerializableObject, SearchParams } from "@lib/utils";
import { AuthPanelTitle } from "@serverComponents/globals/AuthPanelTitle";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("mfa");
  return { title: t("set.title") };
}

function isSessionValid(session: Partial<Session>): {
  valid: boolean;
  verifiedAt?: Timestamp;
} {
  const validPassword = session?.factors?.password?.verifiedAt;
  const validPasskey = session?.factors?.webAuthN?.verifiedAt;
  const validIDP = session?.factors?.intent?.verifiedAt;
  const stillValid = session.expirationDate
    ? timestampDate(session.expirationDate) > new Date()
    : true;

  const verifiedAt = validPassword || validPasskey || validIDP;
  const valid = !!((validPassword || validPasskey || validIDP) && stillValid);

  return { valid, verifiedAt };
}

export default async function Page(props: { searchParams: Promise<SearchParams> }) {
  const searchParams = await props.searchParams;

  const { loginName, checkAfter, force, requestId, organization, sessionId } = searchParams;

  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);

  const sessionWithData = sessionId
    ? await loadSessionById(serviceUrl, sessionId, organization)
    : await loadSessionByLoginname(serviceUrl, loginName, organization);

  const loginSettings = await getLoginSettings({
    serviceUrl,
    organization: sessionWithData.factors?.user?.organizationId,
  }).then((obj) => getSerializableObject(obj));

  const { valid } = isSessionValid(sessionWithData);

  return (
    <>
      <div id="auth-panel">
        <AuthPanelTitle i18nKey="set.title" namespace="mfa" />

        <I18n i18nKey="set.description" namespace="mfa" tagName="p" className="mb-6" />

        {sessionWithData && (
          <UserAvatar
            loginName={loginName ?? sessionWithData.factors?.user?.loginName}
            displayName={sessionWithData.factors?.user?.displayName}
            showDropdown
            searchParams={searchParams}
          ></UserAvatar>
        )}
      </div>

      <div className="w-full">
        <div className="flex flex-col space-y-4">
          {!(loginName || sessionId) && (
            <Alert.Danger>
              <I18n i18nKey="unknownContext" namespace="error" />
            </Alert.Danger>
          )}

          {!valid && (
            <Alert.Warning>
              <I18n i18nKey="sessionExpired" namespace="error" />
            </Alert.Warning>
          )}

          {valid && loginSettings && sessionWithData && sessionWithData.factors?.user?.id && (
            <ChooseSecondFactorToSetup
              userId={sessionWithData.factors?.user?.id}
              loginName={loginName}
              sessionId={sessionWithData.id}
              requestId={requestId}
              organization={organization}
              loginSettings={loginSettings}
              userMethods={sessionWithData.authMethods ?? []}
              phoneVerified={sessionWithData.phoneVerified ?? false}
              emailVerified={sessionWithData.emailVerified ?? false}
              checkAfter={checkAfter === "true"}
              force={force === "true"}
            ></ChooseSecondFactorToSetup>
          )}

          <div className="mt-8 flex w-full flex-row items-center">
            <BackButton />
            <span className="flex-grow"></span>
          </div>
        </div>
      </div>
    </>
  );
}
