/*--------------------------------------------*
 * Framework and Third-Party
 *--------------------------------------------*/
import { Metadata } from "next";
import { headers } from "next/headers";

/*--------------------------------------------*
 * Internal Aliases
 *--------------------------------------------*/
import { getSessionCredentials } from "@lib/cookies";
import { getSafeRedirectUrl } from "@lib/redirect-validator";
import { getOriginalHostFromHeaders } from "@lib/server/host";
import { loadSessionById, loadSessionByLoginname } from "@lib/session";
import { resolveSiteConfigByHost } from "@lib/site-config";
import { getSerializableObject, SearchParams } from "@lib/utils";
import { getLoginSettings } from "@lib/zitadel";
import { serverTranslation } from "@i18n/server";
import { AuthPanel } from "@components/auth/AuthPanel";
import { LoginTOTP } from "@components/mfa/LoginTOTP";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("otp");
  return { title: t("verify.title") };
}

export default async function Page(props: { searchParams: Promise<SearchParams> }) {
  const [searchParams, _headers, { sessionId, loginName, requestId }] = await Promise.all([
    props.searchParams,
    headers(),
    getSessionCredentials(),
  ]);

  const resolvedHost = getOriginalHostFromHeaders(_headers);
  const siteConfig = resolveSiteConfigByHost(resolvedHost);

  const { redirect } = searchParams;

  const sessionData = sessionId
    ? await loadSessionById(sessionId)
    : await loadSessionByLoginname(loginName);

  // Extract just the session factors from the session data
  const sessionFactors = sessionData
    ? { factors: sessionData.factors, expirationDate: sessionData.expirationDate }
    : undefined;

  const safeRedirect = getSafeRedirectUrl(redirect);

  const loginSettings = await getLoginSettings().then((obj) => getSerializableObject(obj));

  return (
    <AuthPanel
      titleI18nKey={"verify.authAppTitle"}
      descriptionI18nKey="none"
      namespace="otp"
      imageSrc={"/img/auth-app-icon.png"}
    >
      {sessionFactors && (
        <LoginTOTP
          loginName={loginName ?? sessionFactors.factors?.user?.loginName}
          sessionId={sessionId}
          requestId={requestId}
          loginSettings={loginSettings}
          redirect={safeRedirect}
          displayName={sessionFactors.factors?.user?.displayName}
          siteConfig={siteConfig}
        />
      )}
    </AuthPanel>
  );
}
