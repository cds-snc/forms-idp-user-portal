import { Alert } from "@clientComponents/globals/Alert/Alert";
import { LoginOTP } from "./components/LoginOTP";
import { I18n } from "@i18n";
import { UserAvatar } from "@serverComponents/UserAvatar";
import { getOriginalHost } from "@lib/server/host";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { loadSessionById, loadSessionByLoginname } from "@lib/session";
import { getLoginSettings } from "@lib/zitadel";
import { Metadata } from "next";
import { headers } from "next/headers";
import { serverTranslation } from "@i18n/server";
import { getSerializableObject, SearchParams } from "@lib/utils";
import { AuthPanelTitle } from "@serverComponents/globals/AuthPanelTitle";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("otp");
  return { title: t("verify.title") };
}

export default async function Page(props: {
  searchParams: Promise<SearchParams>;
  params: Promise<Record<string | number | symbol, string | undefined>>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;

  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);
  const host = await getOriginalHost();

  const {
    loginName, // send from password page
    requestId,
    sessionId,
    organization,
    code,
  } = searchParams;

  const { method } = params;

  const sessionData = sessionId
    ? await loadSessionById(serviceUrl, sessionId, organization)
    : await loadSessionByLoginname(serviceUrl, loginName, organization);

  // Extract just the session factors from the session data
  const sessionFactors = sessionData
    ? { factors: sessionData.factors, expirationDate: sessionData.expirationDate }
    : undefined;

  // email links do not come with organization, thus we need to use the session's organization
  // const branding = await getBrandingSettings({
  //   serviceUrl,
  //   organization: organization ?? session?.factors?.user?.organizationId,
  // });

  const loginSettings = await getLoginSettings({
    serviceUrl,
    organization: organization ?? sessionFactors?.factors?.user?.organizationId,
  }).then((obj) => getSerializableObject(obj));

  return (
    <div id="auth-panel">
      {method && sessionFactors && (
        <LoginOTP
          loginName={loginName ?? sessionFactors.factors?.user?.loginName}
          sessionId={sessionId}
          requestId={requestId}
          organization={organization ?? sessionFactors?.factors?.user?.organizationId}
          method={method}
          loginSettings={loginSettings}
          host={host}
          code={code}
        >
          {!sessionFactors && (
            <div className="py-4">
              <Alert.Danger>
                <I18n i18nKey="unknownContext" namespace="error" />
              </Alert.Danger>
            </div>
          )}

          <AuthPanelTitle i18nKey="verify.title" namespace="otp" />

          {method === "email" && (
            <I18n i18nKey="verify.emailDescription" namespace="otp" tagName="p" className="mb-3" />
          )}
          {method === "time-based" && (
            <I18n i18nKey="verify.otpDescription" namespace="otp" tagName="p" className="mb-3" />
          )}

          {sessionFactors && (
            <UserAvatar
              loginName={loginName ?? sessionFactors.factors?.user?.loginName}
              displayName={sessionFactors.factors?.user?.displayName}
              showDropdown
              searchParams={searchParams}
            />
          )}
        </LoginOTP>
      )}
    </div>
  );
}
