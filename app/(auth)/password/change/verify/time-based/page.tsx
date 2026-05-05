/*--------------------------------------------*
 * Framework and Third-Party
 *--------------------------------------------*/
import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AuthenticationMethodType } from "@zitadel/proto/zitadel/user/v2/user_service_pb";

/*--------------------------------------------*
 * Internal Aliases
 *--------------------------------------------*/
import { getSessionCredentials } from "@lib/cookies";
import { getOriginalHostFromHeaders } from "@lib/server/host";
import { AuthLevel, checkAuthenticationLevel } from "@lib/server/route-protection";
import { loadSessionById, loadSessionByLoginname } from "@lib/session";
import { resolveSiteConfigByHost } from "@lib/site-config";
import { getSerializableObject } from "@lib/utils";
import { getLoginSettings } from "@lib/zitadel";
import { serverTranslation } from "@i18n/server";
import { AuthPanel } from "@components/auth/AuthPanel";
import { LoginTOTP } from "@components/mfa/LoginTOTP";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("otp");
  return { title: t("verify.authAppTitle") };
}

export default async function Page() {
  let sessionId: string | undefined;
  let loginName: string | undefined;

  try {
    ({ sessionId, loginName } = await getSessionCredentials());
  } catch {
    redirect("/password");
  }

  const _headers = await headers();
  const resolvedHost = getOriginalHostFromHeaders(_headers);
  const siteConfig = resolveSiteConfigByHost(resolvedHost);

  const authCheck = await checkAuthenticationLevel(AuthLevel.PASSWORD_REQUIRED, loginName);

  if (!authCheck.satisfied) {
    redirect(authCheck.redirect || "/password");
  }

  const sessionData = sessionId
    ? await loadSessionById(sessionId)
    : await loadSessionByLoginname(loginName);

  if (!sessionData.authMethods?.includes(AuthenticationMethodType.TOTP)) {
    redirect("/password/change/verify");
  }

  const loginSettings = await getLoginSettings().then((obj) => getSerializableObject(obj));

  return (
    <AuthPanel
      titleI18nKey="verify.authAppTitle"
      descriptionI18nKey="none"
      namespace="otp"
      imageSrc="/img/auth-app-icon.png"
    >
      <LoginTOTP
        loginName={loginName ?? sessionData.factors?.user?.loginName}
        sessionId={sessionId}
        loginSettings={loginSettings}
        redirect="/password/change"
        displayName={sessionData.factors?.user?.displayName}
        siteConfig={siteConfig}
      />
    </AuthPanel>
  );
}
