import { Alert } from "@clientComponents/globals";

import { LoginPasskey } from "./components/login-passkey";
import { I18n } from "@i18n";
import { UserAvatar } from "@serverComponents/UserAvatar";
import { getSessionCookieById } from "@lib/cookies";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { loadMostRecentSession } from "@lib/session";
import { getBrandingSettings, getSession } from "@lib/zitadel";
import { Metadata } from "next";
import { serverTranslation } from "@i18n/server";
import { headers } from "next/headers";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("passkey");
  return { title: t("verify.title") };
}

export default async function Page(props: {
  searchParams: Promise<Record<string | number | symbol, string | undefined>>;
}) {
  const searchParams = await props.searchParams;

  const { loginName, altPassword, requestId, organization, sessionId } = searchParams;

  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);

  const sessionFactors = sessionId
    ? await loadSessionById(serviceUrl, sessionId, organization)
    : await loadMostRecentSession({
        serviceUrl,
        sessionParams: { loginName, organization },
      });

  async function loadSessionById(serviceUrl: string, sessionId: string, organization?: string) {
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

  const branding = await getBrandingSettings({
    serviceUrl,
    organization,
  });

  return (
    <>
      <div className="flex flex-col space-y-4">
        <h1>
          <I18n i18nKey="verify.title" namespace="passkey" />
        </h1>

        <p className="ztdl-p mb-6 block">
          <I18n i18nKey="verify.description" namespace="passkey" />
        </p>

        {sessionFactors && (
          <UserAvatar
            loginName={loginName ?? sessionFactors.factors?.user?.loginName}
            displayName={sessionFactors.factors?.user?.displayName}
            showDropdown
            searchParams={searchParams}
          ></UserAvatar>
        )}
      </div>

      <div className="w-full">
        {!(loginName || sessionId) && (
          <Alert.Danger>
            <I18n i18nKey="unknownContext" namespace="error" />
          </Alert.Danger>
        )}

        {(loginName || sessionId) && (
          <LoginPasskey
            loginName={loginName}
            sessionId={sessionId}
            requestId={requestId}
            altPassword={altPassword === "true"}
            organization={organization}
          />
        )}
      </div>
    </>
  );
}
