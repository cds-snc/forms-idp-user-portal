import { Alert } from "@clientComponents/globals/Alert/Alert";
import { LoginOTP } from "./components/LoginOTP";
import { I18n } from "@i18n";
import { UserAvatar } from "@serverComponents/UserAvatar";
import { getSessionCookieById } from "@lib/cookies";
import { getOriginalHost } from "@lib/server/host";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { loadMostRecentSession } from "@lib/session";
import { getLoginSettings, getSession } from "@lib/zitadel";
import { Metadata } from "next";
import { headers } from "next/headers";
import { serverTranslation } from "@i18n/server";
import { getSerializableObject } from "@lib/utils";
import { AuthPanelTitle } from "@serverComponents/globals/AuthPanelTitle";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("otp");
  return { title: t("verify.title") };
}

export default async function Page(props: {
  searchParams: Promise<Record<string | number | symbol, string | undefined>>;
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

  const session = sessionId
    ? await loadSessionById(sessionId, organization)
    : await loadMostRecentSession({
        serviceUrl,
        sessionParams: { loginName, organization },
      });

  async function loadSessionById(sessionId: string, organization?: string) {
    const recent = await getSessionCookieById({ sessionId, organization });
    return getSession({
      serviceUrl,
      sessionId: recent.id,
      sessionToken: recent.token,
    }).then((response) => {
      if (response?.session) {
        return response.session;
      }
    });
  }

  // email links do not come with organization, thus we need to use the session's organization
  // const branding = await getBrandingSettings({
  //   serviceUrl,
  //   organization: organization ?? session?.factors?.user?.organizationId,
  // });

  const loginSettings = await getLoginSettings({
    serviceUrl,
    organization: organization ?? session?.factors?.user?.organizationId,
  }).then((obj) => getSerializableObject(obj));

  return (
    <div id="auth-panel">
      {method && session && (
        <LoginOTP
          loginName={loginName ?? session.factors?.user?.loginName}
          sessionId={sessionId}
          requestId={requestId}
          organization={organization ?? session?.factors?.user?.organizationId}
          method={method}
          loginSettings={loginSettings}
          host={host}
          code={code}
        >
          {!session && (
            <div className="py-4">
              <Alert.Danger>
                <I18n i18nKey="unknownContext" namespace="error" />
              </Alert.Danger>
            </div>
          )}

          <AuthPanelTitle i18nKey="verify.title" namespace="otp" />

          <p className="mb-3">
            {method === "email" && <I18n i18nKey="verify.emailDescription" namespace="otp" />}
            {method === "time-based" && <I18n i18nKey="verify.otpDescription" namespace="otp" />}
          </p>

          {session && (
            <UserAvatar
              loginName={loginName ?? session.factors?.user?.loginName}
              displayName={session.factors?.user?.displayName}
              showDropdown
              searchParams={searchParams}
            />
          )}
        </LoginOTP>
      )}
    </div>
  );
}
