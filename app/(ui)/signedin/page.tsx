import { Alert } from "@clientComponents/globals";
import { LinkButton } from "@serverComponents/globals/Buttons/LinkButton";
import { UserAvatar } from "@serverComponents/UserAvatar/UserAvatar";
import { getMostRecentCookieWithLoginname, getSessionCookieById } from "@lib/cookies";
import { completeDeviceAuthorization } from "@lib/server/device";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { loadMostRecentSession } from "@lib/session";
import { getLoginSettings, getSession } from "@lib/zitadel";
import { Metadata } from "next";
import { serverTranslation } from "@i18n/server";
import { I18n } from "@i18n";
import { headers } from "next/headers";
import { AuthPanelTitle } from "@serverComponents/globals/AuthPanelTitle";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("signedin");
  return { title: t("title", { user: "" }) };
}

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

export default async function Page(props: {
  searchParams: Promise<Record<string | number | symbol, string | undefined>>;
}) {
  const searchParams = await props.searchParams;

  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);

  const { loginName, requestId, organization, sessionId } = searchParams;

  // complete device authorization flow if device requestId is present
  if (requestId && requestId.startsWith("device_")) {
    const cookie = sessionId
      ? await getSessionCookieById({ sessionId, organization })
      : await getMostRecentCookieWithLoginname({
          loginName: loginName,
          organization: organization,
        });

    await completeDeviceAuthorization(requestId.replace("device_", ""), {
      sessionId: cookie.id,
      sessionToken: cookie.token,
    }).catch((err) => {
      return (
        <>
          <div className="flex flex-col space-y-4">
            <h1>
              <I18n i18nKey="error.title" namespace="signedin" />
            </h1>
            <p className="ztdl-p mb-6 block">
              <I18n i18nKey="error.description" namespace="signedin" />
            </p>
            <Alert.Danger>{err.message}</Alert.Danger>
          </div>
          <div className="w-full"></div>
        </>
      );
    });
  }

  const sessionFactors = sessionId
    ? await loadSessionById(serviceUrl, sessionId, organization)
    : await loadMostRecentSession({
        serviceUrl,
        sessionParams: { loginName, organization },
      });

  let loginSettings;
  if (!requestId) {
    loginSettings = await getLoginSettings({
      serviceUrl,
      organization,
    });
  }

  return (
    <>
      <div id="auth-panel">
        <AuthPanelTitle
          i18nKey="title"
          namespace="signedin"
          data={{ user: sessionFactors?.factors?.user?.displayName }}
        />

        <I18n i18nKey="description" namespace="signedin" tagName="p" className="mb-6" />

        <UserAvatar
          loginName={loginName ?? sessionFactors?.factors?.user?.loginName}
          displayName={sessionFactors?.factors?.user?.displayName}
          showDropdown={!(requestId && requestId.startsWith("device_"))}
          searchParams={searchParams}
        />

        <div className="w-full">
          {requestId && requestId.startsWith("device_") && (
            <Alert.Info>
              You can now close this window and return to the device where you started the
              authorization process to continue.
            </Alert.Info>
          )}

          {loginSettings?.defaultRedirectUri && (
            <div className="mt-8 flex w-full flex-row items-center">
              <span className="grow"></span>
              <LinkButton.Primary href={loginSettings?.defaultRedirectUri}>
                <I18n i18nKey="continue" namespace="signedin" />
              </LinkButton.Primary>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
