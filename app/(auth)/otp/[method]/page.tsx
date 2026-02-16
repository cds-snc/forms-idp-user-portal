import { Metadata } from "next";
import { headers } from "next/headers";
import { I18n } from "@i18n";
import { serverTranslation } from "@i18n/server";

/*--------------------------------------------*
 * Methods
 *--------------------------------------------*/
import { getLoginSettings } from "@lib/zitadel";
import { loadSessionById, loadSessionByLoginname } from "@lib/session";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { getSerializableObject, SearchParams } from "@lib/utils";
import { getSafeRedirectUrl } from "@lib/redirect-validator";

/*--------------------------------------------*
 * Components
 *--------------------------------------------*/
import { LoginOTP } from "@components/mfa/otp/LoginOTP";
import { UserAvatar } from "@serverComponents/UserAvatar";
import { AuthPanel } from "@serverComponents/globals/AuthPanel";
import { getSessionCredentials } from "@lib/cookies";

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

  const { code, redirect } = searchParams;

  const { sessionId, loginName, organization, requestId } = await getSessionCredentials();

  // Method =  `/otp/email` or `/otp/time-based` (authenticator app)
  const { method } = params;

  const sessionData = sessionId
    ? await loadSessionById(serviceUrl, sessionId, organization)
    : await loadSessionByLoginname(serviceUrl, loginName, organization);

  // Extract just the session factors from the session data
  const sessionFactors = sessionData
    ? { factors: sessionData.factors, expirationDate: sessionData.expirationDate }
    : undefined;

  const safeRedirect = getSafeRedirectUrl(redirect);

  const loginSettings = await getLoginSettings({
    serviceUrl,
    organization: organization ?? sessionFactors?.factors?.user?.organizationId,
  }).then((obj) => getSerializableObject(obj));

  return (
    <AuthPanel
      titleI18nKey={method === "time-based" ? "verify.authAppTitle" : "verify.title"}
      descriptionI18nKey="none"
      namespace="otp"
      imageSrc={method === "time-based" ? "/img/auth-app-icon.png" : undefined}
    >
      {method && sessionFactors && (
        <LoginOTP
          loginName={loginName ?? sessionFactors.factors?.user?.loginName}
          sessionId={sessionId}
          organization={organization ?? sessionFactors?.factors?.user?.organizationId}
          requestId={requestId}
          method={method}
          loginSettings={loginSettings}
          code={code}
          redirect={safeRedirect}
        >
          {method === "email" && (
            <I18n i18nKey="verify.emailDescription" namespace="otp" tagName="p" className="mb-3" />
          )}

          {sessionFactors && (
            <UserAvatar
              loginName={loginName ?? sessionFactors.factors?.user?.loginName}
              displayName={sessionFactors.factors?.user?.displayName}
              showDropdown
            />
          )}
        </LoginOTP>
      )}
    </AuthPanel>
  );
}
