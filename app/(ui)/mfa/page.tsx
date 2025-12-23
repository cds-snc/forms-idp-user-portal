import { Alert } from "@clientComponents/globals/Alert/Alert";
import { BackButton } from "@clientComponents/globals/Buttons/BackButton";
import { ChooseSecondFactor } from "./components/choose-second-factor";
import { I18n } from "@i18n";
import { UserAvatar } from "@serverComponents/UserAvatar/UserAvatar";
import { getSessionCookieById } from "@lib/cookies";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { loadMostRecentSession } from "@lib/session";
import { getSession, listAuthenticationMethodTypes } from "@lib/zitadel";
import { Metadata } from "next";
import { serverTranslation } from "i18n/server";
import { headers } from "next/headers";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("mfa");
  return { title: t("verify.title") };
}

export default async function Page(props: {
  searchParams: Promise<Record<string | number | symbol, string | undefined>>;
}) {
  const searchParams = await props.searchParams;

  const { loginName, requestId, organization, sessionId } = searchParams;

  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);

  const sessionFactors = sessionId
    ? await loadSessionById(serviceUrl, sessionId, organization)
    : await loadSessionByLoginname(serviceUrl, loginName, organization);

  async function loadSessionByLoginname(
    serviceUrl: string,
    loginName?: string,
    organization?: string
  ) {
    return loadMostRecentSession({
      serviceUrl,
      sessionParams: {
        loginName,
        organization,
      },
    }).then((session) => {
      if (session && session.factors?.user?.id) {
        return listAuthenticationMethodTypes({
          serviceUrl,
          userId: session.factors.user.id,
        }).then((methods) => {
          return {
            factors: session?.factors,
            authMethods: methods.authMethodTypes ?? [],
          };
        });
      }
    });
  }

  async function loadSessionById(host: string, sessionId: string, organization?: string) {
    const recent = await getSessionCookieById({ sessionId, organization });
    return getSession({
      serviceUrl,
      sessionId: recent.id,
      sessionToken: recent.token,
    }).then((response) => {
      if (response?.session && response.session.factors?.user?.id) {
        return listAuthenticationMethodTypes({
          serviceUrl,
          userId: response.session.factors.user.id,
        }).then((methods) => {
          return {
            factors: response.session?.factors,
            authMethods: methods.authMethodTypes ?? [],
          };
        });
      }
    });
  }

  return (
    <>
      <div className="flex flex-col space-y-4">
        <h1>
          <I18n i18nKey="verify.title" namespace="mfa" />
        </h1>
        <p className="ztdl-p">
          <I18n i18nKey="verify.description" namespace="mfa" />
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

        {sessionFactors ? (
          <ChooseSecondFactor
            loginName={loginName}
            sessionId={sessionId}
            requestId={requestId}
            organization={organization}
            userMethods={sessionFactors.authMethods ?? []}
          ></ChooseSecondFactor>
        ) : (
          <Alert.Warning>
            <I18n i18nKey="verify.noResults" namespace="mfa" />
          </Alert.Warning>
        )}

        <div className="mt-8 flex w-full flex-row items-center">
          <BackButton />
          <span className="flex-grow"></span>
        </div>
      </div>
    </>
  );
}
