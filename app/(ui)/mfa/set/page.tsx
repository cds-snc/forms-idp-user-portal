import { Alert } from "@clientComponents/globals";
import { ChooseSecondFactorToSetup } from "./components/choose-second-factor-to-setup";

import { I18n } from "@i18n";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { loadSessionById, loadSessionByLoginname } from "@lib/session";
import { getLoginSettings } from "@lib/zitadel";
import { AuthPanel } from "@serverComponents/globals/AuthPanel";
import { Timestamp, timestampDate } from "@zitadel/client";
import { Session } from "@zitadel/proto/zitadel/session/v2/session_pb";
import { Metadata } from "next";
import { serverTranslation } from "@i18n/server";
import { headers } from "next/headers";
import { getSerializableObject, SearchParams } from "@lib/utils";

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

  const sessionFactors = sessionId
    ? await loadSessionById(serviceUrl, sessionId, organization)
    : await loadSessionByLoginname(serviceUrl, loginName, organization);

  const loginSettings = await getLoginSettings({
    serviceUrl,
    organization: sessionFactors.factors?.user?.organizationId,
  }).then((obj) => getSerializableObject(obj));

  const { valid } = isSessionValid(sessionFactors);

  return (
    <>
      <AuthPanel titleI18nKey="set.title" descriptionI18nKey="set.description" namespace="mfa">
        <div className="w-full">
          <div className="flex flex-col space-y-4">
            {!(loginName || !sessionId) && (
              <Alert.Danger>
                <I18n i18nKey="unknownContext" namespace="error" />
              </Alert.Danger>
            )}

            {!valid && (
              <Alert.Warning>
                <I18n i18nKey="sessionExpired" namespace="error" />
              </Alert.Warning>
            )}

            {valid && loginSettings && sessionFactors && sessionFactors.factors?.user?.id && (
              <ChooseSecondFactorToSetup
                loginName={loginName}
                sessionId={sessionFactors.id}
                requestId={requestId}
                organization={organization}
                phoneVerified={sessionFactors.phoneVerified ?? false}
                emailVerified={sessionFactors.emailVerified ?? false}
                checkAfter={checkAfter === "true"}
                force={force === "true"}
              ></ChooseSecondFactorToSetup>
            )}
          </div>
        </div>
      </AuthPanel>
    </>
  );
}
