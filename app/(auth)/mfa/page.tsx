import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { I18n } from "@i18n";
import { serverTranslation } from "i18n/server";

/*--------------------------------------------*
 * Types and Constants
 *--------------------------------------------*/
import { AuthenticationMethodType } from "@zitadel/proto/zitadel/user/v2/user_service_pb";

/*--------------------------------------------*
 * Methods
 *--------------------------------------------*/

import { loadSessionById, loadSessionByLoginname } from "@lib/session";
import { getServiceUrlFromHeaders } from "@lib/service-url";
import { checkAuthenticationLevel, AuthLevel } from "@lib/server/route-protection";
import { logMessage } from "@lib/logger";

/*--------------------------------------------*
 * Components
 *--------------------------------------------*/
import { ChooseSecondFactor } from "@components/mfa/ChooseSecondFactor";
import { UserAvatar } from "@components/UserAvatar/UserAvatar";
import { AuthPanel } from "@components/AuthPanel";
import { getSessionCredentials } from "@lib/cookies";
import { buildUrlWithRequestId } from "@lib/utils";

// Strong MFA methods that must be configured before accessing the MFA selection page
const STRONG_MFA_METHODS = [AuthenticationMethodType.TOTP, AuthenticationMethodType.U2F];

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await serverTranslation("mfa");
  return { title: t("verify.title") };
}

export default async function Page() {
  const { loginName, organization, sessionId, requestId } = await getSessionCredentials();

  const _headers = await headers();
  const { serviceUrl } = getServiceUrlFromHeaders(_headers);

  // Page-level authentication check - defense in depth
  const authCheck = await checkAuthenticationLevel(
    serviceUrl,
    AuthLevel.PASSWORD_REQUIRED,
    loginName,
    organization
  );

  if (!authCheck.satisfied) {
    redirect(authCheck.redirect || "/password");
  }

  const sessionFactors = sessionId
    ? await loadSessionById(serviceUrl, sessionId, organization)
    : await loadSessionByLoginname(serviceUrl, loginName, organization);

  if (!sessionFactors) {
    logMessage.debug({
      message: "MFA page missing session factors",
      hasSessionId: !!sessionId,
      hasLoginName: !!loginName,
      hasOrganization: !!organization,
    });
    redirect(authCheck.redirect || "/password");
  }

  // Check if user has at least one strong MFA method (TOTP or U2F)
  const hasStrongMFA = STRONG_MFA_METHODS.some((method) =>
    sessionFactors.authMethods?.includes(method)
  );

  // Redirect to MFA setup if no strong MFA method is configured
  if (!hasStrongMFA) {
    redirect(buildUrlWithRequestId("/mfa/set", requestId));
  }

  return (
    <>
      <AuthPanel titleI18nKey="title" descriptionI18nKey="verify.description" namespace="mfa">
        <div className="flex flex-col space-y-4">
          <UserAvatar
            loginName={loginName ?? sessionFactors.factors?.user?.loginName}
            displayName={sessionFactors.factors?.user?.displayName}
            showDropdown
          ></UserAvatar>
        </div>
        <ChooseSecondFactor
          userMethods={sessionFactors.authMethods ?? []}
          loginName={loginName}
          sessionId={sessionId}
          requestId={requestId}
          organization={organization}
        />
        <div className="mt-6">
          <Link
            href={buildUrlWithRequestId("/mfa/set", requestId)}
            className="text-gcds-blue-muted underline hover:text-gcds-blue-vivid"
          >
            <I18n i18nKey="set.addAnother" namespace="mfa" />
          </Link>
        </div>
      </AuthPanel>
    </>
  );
}
